import Link from "next/link";
import { AlertTriangle, DollarSign, Package, ShoppingBag, Users } from "lucide-react";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { SalesChart } from "@/components/admin/SalesChart";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCents } from "@/lib/shop/money";
import { getAdminStats } from "@/lib/shop/stats";
import { ORDER_STATUSES } from "@/lib/shop/validators";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  const { revenue, counts, trends, salesByDay, lowStock, lowStockThreshold, recentOrders } = stats;

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">How ShopSphere is doing.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          icon={DollarSign}
          value={formatCents(revenue.total)}
          trend={trends.revenue}
          hint={`${formatCents(revenue.last30Days)} in the last 30 days (prior ${formatCents(revenue.previous30Days)})`}
        />
        <StatCard
          label="Orders"
          icon={ShoppingBag}
          value={counts.orders.toLocaleString("en-US")}
          trend={trends.orders}
          hint={`${revenue.paidOrders.toLocaleString("en-US")} paid | avg ${formatCents(revenue.averageOrderValue)}`}
        />
        <StatCard
          label="Products"
          icon={Package}
          value={counts.products.toLocaleString("en-US")}
          hint={`${counts.activeProducts.toLocaleString("en-US")} active`}
        />
        <StatCard
          label="Customers"
          icon={Users}
          value={counts.users == null ? "-" : counts.users.toLocaleString("en-US")}
          hint="Registered accounts"
        />
      </section>

      <section aria-label="Orders by status" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className="group flex items-center justify-between gap-2 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50"
          >
            <StatusBadge status={s} />
            <span className="font-display text-xl font-bold tabular-nums">
              {(counts.ordersByStatus[s] ?? 0).toLocaleString("en-US")}
            </span>
          </Link>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Sales - last 30 days</CardTitle>
          <CardDescription>Paid orders by day (UTC).</CardDescription>
        </CardHeader>
        <CardContent>
          <SalesChart data={salesByDay} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600" />
              Low stock
            </CardTitle>
            <CardDescription>
              Active products with fewer than {lowStockThreshold} units in total.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lowStock.length ? (
              <ul className="divide-y divide-border">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={
                          p.totalStock === 0
                            ? "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-500/15 dark:text-red-300"
                            : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                        }
                      >
                        {p.totalStock === 0 ? "Out of stock" : `${p.totalStock} left`}
                      </span>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        aria-label={`Restock ${p.title}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Restock
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Everything is well stocked.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>
              <Link href="/admin/orders" className="underline-offset-4 hover:underline">
                View all orders
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersTable orders={recentOrders} emptyMessage="No orders yet." />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
