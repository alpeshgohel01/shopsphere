import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderTimeline } from "@/components/shop/OrderTimeline";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";
import { requireSession } from "@/lib/session";
import { formatDateTime, formatPrice } from "@/lib/shop/format";
import { getOrderById } from "@/lib/shop/orders";

export const metadata = { title: "Order details" };

export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  const session = await requireSession(`/account/orders/${id}`);
  const order = await getOrderById(id, { userId: session.user.id });
  if (!order) notFound();

  const a = order.shippingAddress ?? {};

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/account/orders" className="text-sm text-muted-foreground hover:text-foreground">
        Back to all orders
      </Link>

      <header className="mt-4 mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">{order.orderNumber}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} className="h-7 text-sm" />
      </header>

      <section aria-label="Order progress" className="mb-12 rounded-xl border border-border bg-card p-6">
        <OrderTimeline order={order} />
      </section>

      <div className="grid gap-10 md:grid-cols-[1fr_18rem]">
        <ul className="divide-y divide-border">
          {order.items.map((item) => {
            const href = item.slug ? `/products/${item.slug}` : null;
            return (
              <li key={`${item.productId}-${item.size}`} className="flex gap-4 py-5 first:pt-0">
                <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {href ? (
                    <Link href={href} className="absolute inset-0 block" aria-label={item.title}>
                      {item.image ? (
                        <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />
                      ) : null}
                    </Link>
                  ) : item.image ? (
                    <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 justify-between gap-3 text-sm">
                  <div>
                    {href ? (
                      <Link href={href} className="font-semibold hover:underline">
                        {item.title}
                      </Link>
                    ) : (
                      <p className="font-semibold">{item.title}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Size {item.size} | Qty {item.quantity}
                    </p>
                    {href ? (
                      <Link
                        href={href}
                        className="mt-2 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Buy again
                      </Link>
                    ) : null}
                  </div>
                  <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit space-y-6 rounded-xl border border-border bg-card p-6 text-sm">
          <dl className="space-y-3">
            {[
              ["Subtotal", formatPrice(order.subtotal)],
              ["Shipping", order.shippingFee ? formatPrice(order.shippingFee) : "Free"],
              ["Tax", formatPrice(order.tax)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold">{formatPrice(order.total)}</dd>
            </div>
          </dl>
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Ship to
            </p>
            <address className="mt-2 leading-relaxed not-italic">
              {a.fullName}
              <br />
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}
              <br />
              {a.city}, {a.state} {a.postalCode}
              <br />
              {a.country}
            </address>
          </div>
          {order.trackingNumber || order.carrier ? (
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Tracking
              </p>
              <p className="mt-2 leading-relaxed">
                {order.carrier ? <span>{order.carrier}</span> : null}
                {order.carrier && order.trackingNumber ? <br /> : null}
                {order.trackingNumber ? (
                  <span className="font-mono text-xs">{order.trackingNumber}</span>
                ) : null}
              </p>
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Payment: <span className="capitalize">{order.paymentStatus}</span>
          </p>
        </aside>
      </div>
    </div>
  );
}
