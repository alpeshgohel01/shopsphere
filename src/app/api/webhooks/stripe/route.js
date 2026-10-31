import { HttpError, handleRouteError, jsonError, jsonOk } from "@/lib/shop/api";
import { markOrderPaid } from "@/lib/shop/orders";
import { constructWebhookEvent, isStripeConfigured } from "@/lib/stripe";

// Signature verification needs the Node crypto module and the raw body.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAID_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

/** POST /api/webhooks/stripe */
export async function POST(request) {
  try {
    if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
      return jsonError("Stripe webhook is not configured", 503);
    }

    // Must be the raw, unparsed body or signature verification fails.
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    let event;
    try {
      event = constructWebhookEvent(rawBody, signature);
    } catch (err) {
      console.warn("[stripe-webhook] signature verification failed:", err?.message);
      return jsonError("Invalid signature", 400);
    }

    if (PAID_EVENTS.has(event.type)) {
      const checkout = event.data.object;

      // "completed" can fire before async payment methods have settled.
      if (checkout.payment_status === "paid") {
        const orderId = checkout.metadata?.orderId || checkout.client_reference_id;
        const paymentIntent =
          typeof checkout.payment_intent === "string"
            ? checkout.payment_intent
            : (checkout.payment_intent?.id ?? null);

        try {
          await markOrderPaid({
            orderId: orderId || undefined,
            stripeSessionId: checkout.id,
            stripePaymentIntentId: paymentIntent,
            amountTotal: checkout.amount_total ?? undefined,
            customerEmail:
              checkout.customer_details?.email || checkout.customer_email || null,
          });
        } catch (err) {
          // Unknown order / amount mismatch: retrying will not help, so ack the
          // event (Stripe would otherwise retry for days) and log for follow-up.
          if (err instanceof HttpError && (err.status === 404 || err.status === 409)) {
            console.error(
              `[stripe-webhook] could not mark order paid (session ${checkout.id}): ${err.message}`,
            );
            return jsonOk({ received: true, handled: false });
          }
          throw err; // transient failure: 500 so Stripe retries
        }
      }
    }

    return jsonOk({ received: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
