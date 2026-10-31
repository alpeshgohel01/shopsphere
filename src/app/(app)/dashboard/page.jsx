import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  MapPin,
  Package,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { requireSession } from "@/lib/session";
import { formatDate, formatPrice } from "@/lib/shop/format";
import { listOrdersForUser } from "@/lib/shop/orders";
import { getProfile } from "@/lib/shop/profiles";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Account",
};

function StatTile({ icon: Icon, label, value, hint, href }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        {href ? <ArrowRight className="size-4 text-muted-foreground" /> : null}
      </div>
      <p className="mt-5 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="font-display mt-1.5 text-3xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-2xl border border-border/80 bg-card p-5 transition hover:border-foreground/25 hover:bg-muted/30"
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5">{body}</div>
  );
}

function OrderRow({ order }) {
  const qty = order.items.reduce((n, i) => n + (i.quantity ?? 0), 0);
  const thumbs = order.items.slice(0, 3);

  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="group flex flex-col gap-4 border-b border-border px-1 py-5 transition last:border-0 hover:bg-muted/30 sm:flex-row sm:items-center sm:gap-6 sm:px-2"
    >
      <div className="flex -space-x-3">
        {thumbs.map((item, i) => (
          <span
            key={`${item.productId}-${item.size}-${i}`}
            className="relative size-14 overflow-hidden rounded-xl border-2 border-background bg-muted shadow-sm"
          >
            {item.image ? (
              <Image
                src={item.image}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : null}
          </span>
        ))}
        {order.items.length > 3 ? (
          <span className="flex size-14 items-center justify-center rounded-xl border-2 border-background bg-muted text-xs font-semibold">
            +{order.items.length - 3}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{order.orderNumber}</p>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDate(order.createdAt)} · {qty} {qty === 1 ? "item" : "items"}
          {order.trackingNumber ? ` · Tracking ${order.trackingNumber}` : ""}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {order.items.map((i) => i.title).join(" · ")}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="text-sm font-semibold tabular-nums">{formatPrice(order.total)}</p>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-80 group-hover:opacity-100">
          View details <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const { user } = await requireSession("/dashboard");
  const firstName = user.name?.split(/\s+/)[0] || "there";

  const [orders, profile] = await Promise.all([
    listOrdersForUser(user.id, { limit: 6 }).catch(() => ({
      items: [],
      total: 0,
    })),
    getProfile(user.id).catch(() => ({ addresses: [], wishlist: [] })),
  ]);

  const addresses = profile.addresses ?? [];
  const wishlistCount = profile.wishlist?.length ?? 0;
  const defaultAddress =
    addresses.find((a) => a.isDefault) || addresses[0] || null;

  const openShipments = orders.items.filter((o) =>
    ["paid", "shipped"].includes(o.status),
  ).length;
  const delivered = orders.items.filter((o) => o.status === "delivered").length;
  const lifetimeSpend = orders.items.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            Your account
          </p>
          <h1 className="font-display mt-3 text-4xl leading-none sm:text-5xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Orders, addresses, wishlist and security — everything for{" "}
            <span className="text-foreground">{user.email}</span>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                <CheckCircle2 className="size-3.5" />
                Email verified
              </span>
            ) : (
              <Link
                href={`/verify-email?email=${encodeURIComponent(user.email)}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300"
              >
                Verify your email
              </Link>
            )}
            {user.role === "admin" ? (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium hover:bg-muted/80"
              >
                <ShieldCheck className="size-3.5" />
                Admin console
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products"
            className={cn(buttonVariants(), "h-11 rounded-xl px-5")}
          >
            <ShoppingBag className="size-4" />
            Continue shopping
          </Link>
          <Link
            href="/settings"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 rounded-xl px-5",
            )}
          >
            <Settings2 className="size-4" />
            Account settings
          </Link>
        </div>
      </header>

      <section
        aria-label="Account summary"
        className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatTile
          icon={Package}
          label="Orders"
          value={orders.total}
          hint={
            openShipments
              ? `${openShipments} in progress`
              : delivered
                ? `${delivered} delivered recently`
                : "Track purchases here"
          }
          href="/account/orders"
        />
        <StatTile
          icon={Heart}
          label="Wishlist"
          value={wishlistCount}
          hint="Saved for later"
          href="/wishlist"
        />
        <StatTile
          icon={MapPin}
          label="Addresses"
          value={addresses.length}
          hint={defaultAddress ? `Default: ${defaultAddress.label}` : "Add a shipping address"}
          href="/account"
        />
        <StatTile
          icon={Truck}
          label="Recent spend"
          value={orders.items.length ? formatPrice(lifetimeSpend) : "—"}
          hint="From your latest orders on this page"
        />
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem] lg:gap-10">
        <section aria-labelledby="recent-orders-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2
                id="recent-orders-heading"
                className="font-display text-2xl sm:text-3xl"
              >
                Recent orders
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Status, tracking and reorder from each detail page.
              </p>
            </div>
            <Link
              href="/account/orders"
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {orders.items.length ? (
            <div className="rounded-2xl border border-border bg-card px-4 sm:px-5">
              {orders.items.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Package className="size-5" />
              </span>
              <p className="font-display mt-4 text-xl">No orders yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                When you check out, your purchases show up here with live status.
              </p>
              <Link
                href="/products"
                className={cn(buttonVariants(), "mt-6 h-11 rounded-xl px-5")}
              >
                Shop the collection
              </Link>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Shipping address
            </h2>
            {defaultAddress ? (
              <address className="mt-3 text-sm leading-relaxed not-italic">
                <p className="font-semibold">{defaultAddress.fullName}</p>
                <p className="mt-1 text-muted-foreground">
                  {defaultAddress.line1}
                  {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ""}
                  <br />
                  {defaultAddress.city}, {defaultAddress.state}{" "}
                  {defaultAddress.postalCode}
                  <br />
                  {defaultAddress.country}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Label: {defaultAddress.label}
                  {defaultAddress.isDefault ? " · Default" : ""}
                </p>
              </address>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No saved address yet. Add one to speed up checkout.
              </p>
            )}
            <Link
              href="/account"
              className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
            >
              Manage addresses
            </Link>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Shortcuts
            </h2>
            <ul className="mt-3 space-y-1">
              {[
                { href: "/account/orders", label: "Order history", icon: Package },
                { href: "/wishlist", label: "Wishlist", icon: Heart },
                { href: "/cart", label: "Shopping bag", icon: ShoppingBag },
                { href: "/settings", label: "Security & profile", icon: Settings2 },
                { href: "/shipping", label: "Shipping policy", icon: Truck },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-sm transition hover:bg-muted"
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl bg-primary px-5 py-5 text-primary-foreground">
            <p className="text-xs font-semibold tracking-[0.14em] uppercase opacity-80">
              Need help?
            </p>
            <p className="font-display mt-2 text-xl leading-tight">
              Returns within 30 days. Free shipping over $100.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex text-sm font-medium underline underline-offset-4"
            >
              Contact support
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
