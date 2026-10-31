import "server-only";
import Stripe from "stripe";

/** @type {Stripe | null} */
let stripeClient = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Lazily create the Stripe client from STRIPE_SECRET_KEY.
 * Throws a clear error if the key is missing.
 * @returns {Stripe}
 */
export function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "Stripe is not configured: set STRIPE_SECRET_KEY in your environment",
      );
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

/**
 * Build Stripe line items from an order. Prices come from the stored order
 * (server-side), never from the client. Shipping and tax are added as their
 * own lines so the Stripe total matches order.total exactly.
 *
 * @param {object} order serialized order
 * @param {string} [currency]
 */
export function orderToLineItems(order, currency = "usd") {
  const lines = order.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency,
      unit_amount: item.price,
      product_data: {
        name: item.title,
        ...(item.size ? { description: `Size: ${item.size}` } : {}),
        ...(/^https?:\/\//i.test(item.image || "") ? { images: [item.image] } : {}),
      },
    },
  }));

  if (order.shippingFee > 0) {
    lines.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: order.shippingFee,
        product_data: { name: "Shipping" },
      },
    });
  }
  if (order.tax > 0) {
    lines.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: order.tax,
        product_data: { name: "Tax" },
      },
    });
  }
  return lines;
}

/**
 * Create a Stripe Checkout Session for a pending order.
 *
 * @param {{
 *   order: { id?: string, _id?: string, orderNumber: string, userId: string, items: object[], shippingFee: number, tax: number },
 *   lineItems?: object[],
 *   successUrl: string,
 *   cancelUrl: string,
 *   customerEmail?: string,
 * }} params lineItems defaults to orderToLineItems(order)
 */
export async function createCheckoutSession({
  order,
  lineItems,
  successUrl,
  cancelUrl,
  customerEmail,
}) {
  const stripe = getStripe();
  const orderId = String(order.id ?? order._id);

  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems ?? orderToLineItems(order),
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: orderId,
    ...(customerEmail ? { customer_email: customerEmail } : {}),
    metadata: {
      orderId,
      orderNumber: order.orderNumber,
      userId: order.userId,
    },
    payment_intent_data: {
      metadata: { orderId, orderNumber: order.orderNumber },
    },
  });
}

/**
 * Verify and parse a Stripe webhook payload. Pass the raw request body text.
 * @param {string} rawBody
 * @param {string | null} signature value of the `stripe-signature` header
 */
export function constructWebhookEvent(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Stripe webhook is not configured: set STRIPE_WEBHOOK_SECRET");
  }
  if (!signature) throw new Error("Missing stripe-signature header");
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}
