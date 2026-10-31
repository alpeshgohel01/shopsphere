import "server-only";
import { ObjectId } from "mongodb";
import {
  getCountersCol,
  getOrdersCol,
  getProductsCol,
} from "@/lib/shop/collections";
import { HttpError } from "@/lib/shop/api";
import { computeOrderTotals } from "@/lib/shop/money";
import { resolveAppUrl } from "@/lib/app-url";
import { sendOrderConfirmationEmailMessage } from "@/lib/email";
import { findUserIdsByEmail, getUserContact } from "@/lib/shop/users";
import {
  attachCustomerEmails,
  serializeOrder,
} from "@/lib/shop/order-serialize";
import { escapeRegex, toObjectId } from "@/lib/shop/products";
import {
  checkoutAddressSchema,
  checkoutItemsSchema,
  orderListQuerySchema,
  orderStatusUpdateSchema,
} from "@/lib/shop/validators";

export { attachCustomerEmails, serializeOrder };

const ORDER_NUMBER_BASE = 100000;

/** Allowed manual status transitions. "paid" is handled via markOrderPaid. */
const TRANSITIONS = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

/**
 * Atomic, gap-free order number: SS-100001, SS-100002, ...
 */
async function nextOrderNumber() {
  const counters = await getCountersCol();
  const doc = await counters.findOneAndUpdate(
    { _id: "orderNumber" },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  return `SS-${ORDER_NUMBER_BASE + doc.seq}`;
}

/**
 * Create a pending, unpaid order. Prices, titles and images are read from the
 * database; the client only supplies productId/size/quantity.
 *
 * @param {{
 *   userId: string,
 *   items: { productId: string, size?: string, quantity: number }[],
 *   shippingAddress: unknown,
 * }} input
 */
export async function createPendingOrder({ userId, items, shippingAddress }) {
  if (!userId) throw new HttpError("Authentication required", 401);

  const parsedItems = checkoutItemsSchema.parse(items);
  const address = checkoutAddressSchema.parse(shippingAddress);

  // Merge duplicate lines (same product + size).
  const merged = new Map();
  for (const item of parsedItems) {
    const key = `${item.productId}::${item.size.toLowerCase()}`;
    const prev = merged.get(key);
    if (prev) prev.quantity += item.quantity;
    else merged.set(key, { ...item });
  }
  const lines = [...merged.values()];

  const products = await getProductsCol();
  const ids = [...new Set(lines.map((l) => l.productId))].map(
    (id) => new ObjectId(id),
  );
  const docs = await products.find({ _id: { $in: ids }, isActive: true }).toArray();
  const byId = new Map(docs.map((p) => [String(p._id), p]));

  const orderItems = lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) {
      throw new HttpError("A product in your cart is no longer available", 400);
    }

    const variants = product.variants ?? [];
    let variant;
    if (line.size) {
      variant = variants.find(
        (v) => v.size.toLowerCase() === line.size.toLowerCase(),
      );
    } else if (variants.length === 1) {
      variant = variants[0];
    }
    if (!variant) {
      throw new HttpError(`Please choose a valid size for "${product.title}"`, 400);
    }
    if (variant.stock < line.quantity) {
      throw new HttpError(
        variant.stock > 0
          ? `Only ${variant.stock} left in stock for "${product.title}" (${variant.size})`
          : `"${product.title}" (${variant.size}) is out of stock`,
        409,
      );
    }

    return {
      productId: product._id,
      slug: product.slug ?? "",
      title: product.title,
      image: product.images?.[0]?.url ?? "",
      price: product.price, // server-side price, in cents
      quantity: line.quantity,
      size: variant.size,
    };
  });

  const subtotalCents = orderItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );
  const totals = computeOrderTotals(subtotalCents);

  const col = await getOrdersCol();
  const now = new Date();
  const doc = {
    orderNumber: await nextOrderNumber(),
    userId,
    items: orderItems,
    shippingAddress: address,
    subtotal: totals.subtotal,
    shippingFee: totals.shippingFee,
    tax: totals.tax,
    total: totals.total,
    status: "pending",
    paymentStatus: "unpaid",
    stripeSessionId: null,
    stripePaymentIntentId: null,
    paidAt: null,
    stockDecremented: false,
    createdAt: now,
    updatedAt: now,
  };

  const res = await col.insertOne(doc);
  return serializeOrder({ ...doc, _id: res.insertedId });
}

/**
 * @param {string | ObjectId} id
 * @param {{ userId?: string }} [options] when set, only returns the user's own order
 */
export async function getOrderById(id, { userId } = {}) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const col = await getOrdersCol();
  const filter = { _id };
  if (userId) filter.userId = userId;
  return serializeOrder(await col.findOne(filter));
}

/**
 * Store the Stripe Checkout session id on an order.
 * @param {string | ObjectId} orderId
 * @param {string} stripeSessionId
 */
export async function setOrderStripeSession(orderId, stripeSessionId) {
  const _id = toObjectId(orderId);
  if (!_id) throw new HttpError("Invalid order id", 400);
  const col = await getOrdersCol();
  await col.updateOne(
    { _id },
    { $set: { stripeSessionId, updatedAt: new Date() } },
  );
}

/**
 * @param {string} stripeSessionId
 */
export async function getOrderByStripeSessionId(stripeSessionId) {
  if (!stripeSessionId) return null;
  const col = await getOrdersCol();
  return serializeOrder(await col.findOne({ stripeSessionId }));
}

/**
 * @param {string} userId
 * @param {{ page?: number, limit?: number }} [query]
 */
export async function listOrdersForUser(userId, query = {}) {
  const q = orderListQuerySchema.parse({ page: query.page, limit: query.limit });
  const col = await getOrdersCol();
  const filter = { userId };
  const [docs, total] = await Promise.all([
    col
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .toArray(),
    col.countDocuments(filter),
  ]);
  return {
    items: docs.map(serializeOrder),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.max(1, Math.ceil(total / q.limit)),
  };
}

/**
 * Admin listing across all users. The caller must enforce admin authorization.
 * @param {{ status?: string, q?: string, page?: number, limit?: number }} [query]
 */
export async function listOrdersAdmin(query = {}) {
  const q = orderListQuerySchema.parse(query);
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    const emailUserIds = await findUserIdsByEmail(q.q);
    filter.$or = [
      { orderNumber: rx },
      { "shippingAddress.fullName": rx },
      { userId: q.q },
      ...(emailUserIds.length ? [{ userId: { $in: emailUserIds } }] : []),
    ];
  }

  const col = await getOrdersCol();
  const [docs, total] = await Promise.all([
    col
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .toArray(),
    col.countDocuments(filter),
  ]);
  return {
    items: await attachCustomerEmails(docs.map(serializeOrder)),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.max(1, Math.ceil(total / q.limit)),
  };
}

/**
 * Decrement variant stock for every item in an order. Idempotent: guarded by
 * an atomic `stockDecremented` flag, so repeated calls never double-decrement.
 * If stock is insufficient, it is clamped at 0 and the shortage is recorded on
 * the order (`stockShortages`) for manual follow-up.
 *
 * @param {string | ObjectId} orderId
 * @returns {Promise<{ decremented: boolean, shortages: object[] }>}
 */
export async function decrementStockForOrder(orderId) {
  const _id = toObjectId(orderId);
  if (!_id) throw new HttpError("Invalid order id", 400);

  const orders = await getOrdersCol();
  const order = await orders.findOneAndUpdate(
    { _id, stockDecremented: { $ne: true } },
    { $set: { stockDecremented: true, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!order) return { decremented: false, shortages: [] };

  const products = await getProductsCol();
  const shortages = [];

  for (const item of order.items) {
    const res = await products.updateOne(
      {
        _id: item.productId,
        variants: { $elemMatch: { size: item.size, stock: { $gte: item.quantity } } },
      },
      { $inc: { "variants.$[v].stock": -item.quantity } },
      { arrayFilters: [{ "v.size": item.size }] },
    );
    if (res.modifiedCount === 0) {
      // Not enough stock (oversold): clamp at zero and record it.
      await products.updateOne({ _id: item.productId }, [
        {
          $set: {
            variants: {
              $map: {
                input: "$variants",
                as: "v",
                in: {
                  $cond: [
                    { $eq: ["$$v.size", { $literal: item.size }] },
                    {
                      $mergeObjects: [
                        "$$v",
                        {
                          stock: {
                            $max: [
                              0,
                              { $subtract: ["$$v.stock", item.quantity] },
                            ],
                          },
                        },
                      ],
                    },
                    "$$v",
                  ],
                },
              },
            },
          },
        },
      ]);
      shortages.push({
        productId: String(item.productId),
        size: item.size,
        quantity: item.quantity,
      });
    }
  }

  if (shortages.length) {
    await orders.updateOne({ _id }, { $set: { stockShortages: shortages } });
  }
  return { decremented: true, shortages };
}

/** Put stock back for a cancelled order whose stock had been decremented. */
async function restockForOrder(orderId) {
  const orders = await getOrdersCol();
  const order = await orders.findOneAndUpdate(
    { _id: orderId, stockDecremented: true, stockRestocked: { $ne: true } },
    { $set: { stockRestocked: true } },
    { returnDocument: "after" },
  );
  if (!order) return;

  const products = await getProductsCol();
  for (const item of order.items) {
    await products.updateOne(
      { _id: item.productId },
      { $inc: { "variants.$[v].stock": item.quantity } },
      { arrayFilters: [{ "v.size": item.size }] },
    );
  }
}

/**
 * Send the order confirmation email. Never throws: a mail failure must not
 * undo a successful payment. Records `confirmationEmailSentAt` only when the
 * message really went out (not the dev console fallback).
 *
 * @param {object} order serialized, paid order
 * @param {{ customerEmail?: string | null, demo?: boolean }} [options]
 */
export async function sendOrderConfirmation(order, { customerEmail, demo = false } = {}) {
  try {
    let to = customerEmail || "";
    let name = order.shippingAddress?.fullName || "";
    if (!to) {
      const contact = await getUserContact(order.userId);
      to = contact?.email ?? "";
      name = name || contact?.name || "";
    }
    if (!to) return { sent: false };

    const result = await sendOrderConfirmationEmailMessage({
      to,
      name: name || undefined,
      order,
      orderUrl: `${resolveAppUrl()}/account/orders/${order.id}`,
      demo,
    });

    const delivered = Boolean(result?.ok) && result.id !== "dev-console";
    if (delivered) {
      const col = await getOrdersCol();
      await col.updateOne(
        { _id: toObjectId(order.id) },
        { $set: { confirmationEmailSentAt: new Date() } },
      );
    }
    return { sent: delivered };
  } catch (err) {
    console.error("[orders] confirmation email failed", err);
    return { sent: false };
  }
}

/**
 * Mark an order as paid. Idempotent and safe for concurrent webhook retries:
 * only the call that flips paymentStatus unpaid -> paid decrements stock and
 * sends the confirmation email.
 *
 * @param {{
 *   orderId?: string,
 *   stripeSessionId?: string,
 *   stripePaymentIntentId?: string | null,
 *   amountTotal?: number,
 *   customerEmail?: string | null,
 *   demo?: boolean,
 * }} input amountTotal (cents), when given, must equal the order total
 * @returns {Promise<{ order: object, alreadyPaid: boolean }>}
 */
export async function markOrderPaid({
  orderId,
  stripeSessionId,
  stripePaymentIntentId,
  amountTotal,
  customerEmail,
  demo = false,
}) {
  const col = await getOrdersCol();

  const _id = toObjectId(orderId);
  const filter = _id ? { _id } : stripeSessionId ? { stripeSessionId } : null;
  if (!filter) throw new HttpError("orderId or stripeSessionId is required", 400);

  const existing = await col.findOne(filter);
  if (!existing) throw new HttpError("Order not found", 404);

  if (amountTotal != null && amountTotal !== existing.total) {
    throw new HttpError("Paid amount does not match order total", 409);
  }
  if (existing.paymentStatus === "paid") {
    return { order: serializeOrder(existing), alreadyPaid: true };
  }
  if (existing.paymentStatus !== "unpaid") {
    throw new HttpError("Order cannot be marked as paid", 409);
  }

  const now = new Date();
  const lit = (v) => (v ? { $literal: v } : null);

  const updated = await col.findOneAndUpdate(
    { _id: existing._id, paymentStatus: "unpaid" },
    [
      {
        $set: {
          paymentStatus: "paid",
          paidAt: now,
          updatedAt: now,
          status: {
            $cond: [{ $eq: ["$status", "pending"] }, "paid", "$status"],
          },
          stripeSessionId: stripeSessionId
            ? lit(stripeSessionId)
            : "$stripeSessionId",
          stripePaymentIntentId: stripePaymentIntentId
            ? lit(stripePaymentIntentId)
            : "$stripePaymentIntentId",
        },
      },
    ],
    { returnDocument: "after" },
  );

  if (!updated) {
    // Lost the race to another request: it has already handled the payment.
    const current = await col.findOne({ _id: existing._id });
    return { order: serializeOrder(current), alreadyPaid: true };
  }

  await decrementStockForOrder(updated._id);
  let fresh = await col.findOne({ _id: updated._id });

  const confirmation = await sendOrderConfirmation(serializeOrder(fresh), {
    customerEmail,
    demo,
  });
  if (confirmation.sent) fresh = await col.findOne({ _id: updated._id });

  return { order: serializeOrder(fresh), alreadyPaid: false };
}

/**
 * Admin status change with transition validation.
 * Cancelling a paid order restocks its items.
 *
 * Optional `trackingNumber` / `carrier` are stored when shipping an order
 * (or when re-submitting the "shipped" status to correct them).
 *
 * @param {string | ObjectId} orderId
 * @param {string} status
 * @param {{ trackingNumber?: string, carrier?: string }} [details]
 */
export async function updateOrderStatus(orderId, status, details = {}) {
  const _id = toObjectId(orderId);
  if (!_id) throw new HttpError("Invalid order id", 400);
  const {
    status: next,
    trackingNumber,
    carrier,
  } = orderStatusUpdateSchema.parse({
    status,
    trackingNumber: details?.trackingNumber,
    carrier: details?.carrier,
  });

  const col = await getOrdersCol();
  const order = await col.findOne({ _id });
  if (!order) throw new HttpError("Order not found", 404);

  if (order.status === next) {
    if (next === "shipped" && (trackingNumber || carrier)) {
      const fix = { updatedAt: new Date() };
      if (trackingNumber) fix.trackingNumber = trackingNumber;
      if (carrier) fix.carrier = carrier;
      const fixed = await col.findOneAndUpdate(
        { _id },
        { $set: fix },
        { returnDocument: "after" },
      );
      return serializeOrder(fixed ?? order);
    }
    return serializeOrder(order);
  }

  if (!TRANSITIONS[order.status]?.includes(next)) {
    throw new HttpError(`Cannot change order from ${order.status} to ${next}`, 409);
  }

  if (next === "paid") {
    const { order: paid } = await markOrderPaid({ orderId: String(_id) });
    return paid;
  }
  if ((next === "shipped" || next === "delivered") && order.paymentStatus !== "paid") {
    throw new HttpError("Order has not been paid", 409);
  }

  const now = new Date();
  const set = { status: next, updatedAt: now };
  if (next === "shipped") {
    set.shippedAt = now;
    if (trackingNumber) set.trackingNumber = trackingNumber;
    if (carrier) set.carrier = carrier;
  }
  if (next === "delivered") set.deliveredAt = now;
  if (next === "cancelled") set.cancelledAt = now;

  const updated = await col.findOneAndUpdate(
    { _id, status: order.status },
    { $set: set },
    { returnDocument: "after" },
  );
  if (!updated) throw new HttpError("Order was modified, please retry", 409);

  if (next === "cancelled") await restockForOrder(_id);
  return serializeOrder(updated);
}
