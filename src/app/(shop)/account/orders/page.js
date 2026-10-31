import Link from "next/link";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/shop/EmptyState";
import { OrderList } from "@/components/shop/OrderList";
import { Pagination } from "@/components/shop/Pagination";
import { requireSession } from "@/lib/session";
import { listOrdersForUser } from "@/lib/shop/orders";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }) {
  const session = await requireSession("/account/orders");
  const sp = await searchParams;
  const page = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;
  const orders = await listOrdersForUser(session.user.id, { page, limit: 10 });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">
        Back to account
      </Link>
      <h1 className="font-display mt-4 mb-10 text-5xl leading-none sm:text-6xl">Orders</h1>

      {orders.items.length ? (
        <>
          <OrderList orders={orders.items} />
          <Pagination
            page={orders.page}
            totalPages={orders.totalPages}
            basePath="/account/orders"
          />
        </>
      ) : (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Your purchases will appear here."
          action={{ href: "/products", label: "Shop collection" }}
        />
      )}
    </div>
  );
}
