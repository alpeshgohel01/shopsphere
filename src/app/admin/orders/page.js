import Link from "next/link";
import { Search } from "lucide-react";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { Pagination } from "@/components/admin/Pagination";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listOrdersAdmin } from "@/lib/shop/orders";
import { ORDER_STATUSES } from "@/lib/shop/validators";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };

const first = (v) => (Array.isArray(v) ? v[0] : v);

export default async function AdminOrdersPage({ searchParams }) {
  const sp = await searchParams;
  const rawStatus = first(sp?.status);
  const status = ORDER_STATUSES.includes(rawStatus) ? rawStatus : undefined;
  const q = first(sp?.q)?.trim().slice(0, 100) || "";

  const result = await listOrdersAdmin({ status, q, page: first(sp?.page), limit: 20 });

  const tabHref = (value) => {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };
  const tabs = [{ label: "All", value: undefined }, ...ORDER_STATUSES.map((s) => ({ label: s, value: s }))];

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {result.total.toLocaleString("en-US")} {result.total === 1 ? "order" : "orders"}
          {status ? ` | ${status}` : ""}
          {q ? ` matching "${q}"` : ""}
        </p>
      </header>

      <form action="/admin/orders" method="get" className="flex max-w-md gap-2" role="search">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Order number, name or email..."
            className="pl-9"
            aria-label="Search orders"
          />
        </div>
        <Button type="submit" variant="secondary" className="h-10 px-4">
          Search
        </Button>
        {q ? (
          <Link href={tabHref(status)} className={cn(buttonVariants({ variant: "ghost" }), "h-10")}>
            Clear
          </Link>
        ) : null}
      </form>

      <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const active = tab.value === status;
          return (
            <Link
              key={tab.label}
              href={tabHref(tab.value)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ring-1 ring-inset transition-colors",
                active
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-card text-muted-foreground ring-foreground/10 hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <OrdersTable
        orders={result.items}
        emptyMessage={
          q
            ? `No ${status ?? ""} orders match "${q}".`.replace("  ", " ")
            : status
              ? `No ${status} orders.`
              : "No orders yet."
        }
      />

      <Pagination
        basePath="/admin/orders"
        page={result.page}
        totalPages={result.totalPages}
        params={{ status, q }}
      />
    </>
  );
}
