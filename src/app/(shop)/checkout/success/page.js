import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ClearCartOnMount } from "@/components/shop/ClearCartOnMount";
import { OrderTimeline } from "@/components/shop/OrderTimeline";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";
import { getSession } from "@/lib/session";
import { formatPrice } from "@/lib/shop/format";
import { getOrderById } from "@/lib/shop/orders";
import { cn } from "@/lib/utils";

export const metadata = { title: "Order status" };

const first = (v) => (Array.isArray(v) ? v[0] : v);

export default async function CheckoutSuccessPage({ searchParams }) {
  const sp = await searchParams;
  const orderId = first(sp.order);
  const sessionId = first(sp.session_id);

  let order = null;
  let userEmail = "";
  try {
    const session = await getSession();
    if (session && orderId) {
      order = await getOrderById(orderId, { userId: session.user.id });
      userEmail = session.user.email ?? "";
    }
  } catch {
    order = null;
  }

  const paid = order?.paymentStatus === "paid";
  const demo = paid && (first(sp.demo) === "1" || !order.stripeSessionId);
  const pending = Boolean(order) && !paid;
  const emailSent = paid && Boolean(order.confirmationEmailSentAt);

  let heading = "Order status";
  let message = "We could not find that order. Check your account for recent orders.";
  if (paid && demo) {
    heading = "Test checkout completed";
    message =
      "Your order was placed in test mode. No real payment was taken, and stock was updated.";
  } else if (paid) {
    heading = "Order confirmed";
    message = "Thank you. Your payment was received and your order is being prepared.";
  } else if (pending) {
    heading = "Confirming your payment";
    message =
      "We have your order and are waiting for payment confirmation. This usually takes a few seconds.";
  }

  const Icon = pending || !order ? Clock : CheckCircle2;

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:py-28">
      {order && (paid || sessionId) ? <ClearCartOnMount /> : null}
      <span
        className={cn(
          "mx-auto flex size-16 items-center justify-center rounded-2xl",
          paid
            ? "bg-highlight text-highlight-foreground"
            : "bg-accent text-accent-foreground",
        )}
      >
        <Icon className="size-8" />
      </span>
      <h1 className="font-display mt-8 text-5xl leading-none">{heading}</h1>
      <p className="mt-4 text-muted-foreground">{message}</p>
      {emailSent && userEmail ? (
        <p className="mt-2 text-sm text-muted-foreground">
          A confirmation was sent to {userEmail}.
        </p>
      ) : null}

      {order ? (
        <div className="mt-10 space-y-4 rounded-xl border border-border bg-card p-6 text-left text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Order</span>
            <span className="font-semibold">{order.orderNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payment</span>
            <span className="font-medium">
              {paid ? (demo ? "Paid (test)" : "Paid") : "Pending"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Items</span>
            <span>{order.items.reduce((n, i) => n + i.quantity, 0)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4 text-base">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">{formatPrice(order.total)}</span>
          </div>
          {paid ? (
            <p className="text-xs text-muted-foreground">
              Estimated delivery: 3-6 business days.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Refresh this page in a moment, or check your order history for the latest status.
            </p>
          )}
          <div className="border-t border-border pt-6">
            <OrderTimeline order={order} />
          </div>
        </div>
      ) : null}

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        {order ? (
          <Link
            href={`/account/orders/${order.id}`}
            className={cn(buttonVariants(), "h-12 rounded-xl px-7 text-sm font-semibold")}
          >
            View order
          </Link>
        ) : (
          <Link
            href="/account/orders"
            className={cn(buttonVariants(), "h-12 rounded-xl px-7 text-sm font-semibold")}
          >
            My orders
          </Link>
        )}
        <Link
          href="/products"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-12 rounded-xl px-7 text-sm font-semibold",
          )}
        >
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
