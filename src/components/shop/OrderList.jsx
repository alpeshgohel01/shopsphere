import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";
import { formatDate, formatPrice } from "@/lib/shop/format";

/** @param {{ orders: object[] }} props */
export function OrderList({ orders }) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/${order.id}`}
            className="flex items-center gap-4 px-5 py-4 transition hover:bg-muted/60 sm:px-6"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{order.orderNumber}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDate(order.createdAt)} |{" "}
                {order.items.reduce((n, i) => n + i.quantity, 0)} items
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
            <p className="w-20 text-right text-sm font-semibold">{formatPrice(order.total)}</p>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
