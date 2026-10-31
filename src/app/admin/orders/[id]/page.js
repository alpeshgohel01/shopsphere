import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/shop/format";
import { formatCents } from "@/lib/shop/money";
import { getOrderById } from "@/lib/shop/orders";
import { getUserEmailsByIds } from "@/lib/shop/users";

export const metadata = { title: "Order" };

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}

export default async function AdminOrderDetailPage({ params }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();
  const customerEmail = (await getUserEmailsByIds([order.userId])).get(String(order.userId));

  const a = order.shippingAddress ?? {};
  const timeline = [
    ["Placed", order.createdAt],
    ["Paid", order.paidAt],
    ["Shipped", order.shippedAt],
    ["Delivered", order.deliveredAt],
    ["Cancelled", order.cancelledAt],
  ].filter(([, at]) => at);

  return (
    <>
      <header className="space-y-2">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Orders
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <StatusBadge status={order.status} />
          <span className="text-sm text-muted-foreground capitalize">
            Payment: {order.paymentStatus}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Update status</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {order.items.map((item, i) => (
                <li key={`${item.productId}-${item.size}-${i}`} className="flex items-center gap-3 py-3">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      className="size-14 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
                    />
                  ) : (
                    <span className="size-14 shrink-0 rounded-lg bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${item.productId}/edit`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.size ? `Size ${item.size} | ` : ""}
                      {formatCents(item.price)} x {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatCents(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-border pt-4">
              <Row label="Subtotal">{formatCents(order.subtotal)}</Row>
              <Row label="Shipping">
                {order.shippingFee ? formatCents(order.shippingFee) : "Free"}
              </Row>
              <Row label="Tax">{formatCents(order.tax)}</Row>
              <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-lg font-bold tabular-nums">
                  {formatCents(order.total)}
                </dd>
              </div>
            </dl>

            {order.stockShortages?.length ? (
              <p className="mt-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
                Stock ran short for {order.stockShortages.length} line(s) when this order was paid
                - check inventory before shipping.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ship to</CardTitle>
            </CardHeader>
            <CardContent>
              <address className="space-y-0.5 text-sm not-italic">
                <p className="font-medium">{a.fullName}</p>
                <p>{a.line1}</p>
                {a.line2 ? <p>{a.line2}</p> : null}
                <p>
                  {[a.city, a.state, a.postalCode].filter(Boolean).join(", ")}
                </p>
                <p>{a.country}</p>
                {a.phone ? <p className="pt-1 text-muted-foreground">{a.phone}</p> : null}
              </address>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {timeline.map(([label, at]) => (
                  <li key={label} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-right">{formatDateTime(at)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                <div className="flex justify-between gap-3">
                  <dt>Customer ID</dt>
                  <dd className="truncate font-mono">{order.userId}</dd>
                </div>
                {customerEmail ? (
                  <div className="flex justify-between gap-3">
                    <dt>Email</dt>
                    <dd className="truncate">{customerEmail}</dd>
                  </div>
                ) : null}
                {order.carrier ? (
                  <div className="flex justify-between gap-3">
                    <dt>Carrier</dt>
                    <dd className="truncate">{order.carrier}</dd>
                  </div>
                ) : null}
                {order.trackingNumber ? (
                  <div className="flex justify-between gap-3">
                    <dt>Tracking</dt>
                    <dd className="truncate font-mono">{order.trackingNumber}</dd>
                  </div>
                ) : null}
                {order.stripePaymentIntentId ? (
                  <div className="flex justify-between gap-3">
                    <dt>Payment intent</dt>
                    <dd className="truncate font-mono">{order.stripePaymentIntentId}</dd>
                  </div>
                ) : null}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
