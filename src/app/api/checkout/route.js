import { HttpError, handleRouteError, jsonOk } from "@/lib/shop/api";
import {
  createPendingOrder,
  markOrderPaid,
  setOrderStripeSession,
} from "@/lib/shop/orders";
import { readJson, requireApiUser } from "@/lib/shop/guards";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { resolveAppUrl } from "@/lib/app-url";

export const runtime = "nodejs";

/**
 * POST /api/checkout
 * Body: { items: [{ productId, quantity, size }], shippingAddress }
 *
 * Creates a pending order (prices come from the DB), then a Stripe Checkout
 * session. Returns { data: { url, orderId, orderNumber } }.
 * When Stripe is not configured (demo / test checkout) the order is marked paid
 * immediately (stock is decremented) and the response is
 * { data: { url: null, orderId, orderNumber, demo: true, paid: true } }.
 */
export async function POST(request) {
  try {
    const session = await requireApiUser();
    const body = (await readJson(request)) ?? {};

    const order = await createPendingOrder({
      userId: session.user.id,
      items: body.items,
      shippingAddress: body.shippingAddress,
    });

    if (!isStripeConfigured()) {
      const { order: paid } = await markOrderPaid({
        orderId: order.id,
        customerEmail: session.user.email,
        demo: true,
      });
      return jsonOk(
        {
          url: null,
          orderId: paid.id,
          orderNumber: paid.orderNumber,
          demo: true,
          paid: paid.paymentStatus === "paid",
        },
        201,
      );
    }

    const appUrl = resolveAppUrl();
    let checkout;
    try {
      checkout = await createCheckoutSession({
        order,
        successUrl: `${appUrl}/checkout/success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${appUrl}/checkout/cancel?order=${order.id}`,
        customerEmail: session.user.email,
      });
      await setOrderStripeSession(order.id, checkout.id);
    } catch (err) {
      console.error("[checkout] failed to create Stripe session", err);
      throw new HttpError("Could not start payment. Please try again.", 502);
    }

    if (!checkout.url) {
      throw new HttpError("Could not start payment. Please try again.", 502);
    }

    return jsonOk(
      { url: checkout.url, orderId: order.id, orderNumber: order.orderNumber },
      201,
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
