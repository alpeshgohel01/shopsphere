import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/shop/format";
import { formatCents } from "@/lib/shop/money";

/**
 * Admin orders table (server-renderable; no client state).
 * @param {{
 *   orders: { id: string, orderNumber: string, status: string, paymentStatus?: string, total: number, createdAt: string | null, items: unknown[], shippingAddress?: { fullName?: string }, customerEmail?: string | null }[],
 *   emptyMessage?: string,
 * }} props
 */
export function OrdersTable({ orders, emptyMessage = "No orders found." }) {
  if (!orders.length) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-muted/60 text-xs tracking-wide text-muted-foreground uppercase">
          <tr>
            <th className="px-4 py-2.5 font-medium">Order</th>
            <th className="px-4 py-2.5 font-medium">Customer</th>
            <th className="px-4 py-2.5 font-medium">Date</th>
            <th className="px-4 py-2.5 font-medium">Items</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-muted/40">
              <td className="px-4 py-3 font-medium">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {order.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3">
                <p>{order.shippingAddress?.fullName || "-"}</p>
                {order.customerEmail ? (
                  <p className="max-w-[16rem] truncate text-xs text-muted-foreground">
                    {order.customerEmail}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(order.createdAt)}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {order.items?.reduce((n, i) => n + (i.quantity ?? 0), 0) ?? 0}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 text-right font-medium tabular-nums">
                {formatCents(order.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
