import Link from "next/link";
import { Package, Settings } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddressManager } from "@/components/shop/AddressManager";
import { EmptyState } from "@/components/shop/EmptyState";
import { OrderList } from "@/components/shop/OrderList";
import { requireSession } from "@/lib/session";
import { listOrdersForUser } from "@/lib/shop/orders";
import { getProfile } from "@/lib/shop/profiles";
import { cn } from "@/lib/utils";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await requireSession("/account");
  const { user } = session;

  const [orders, profile] = await Promise.all([
    listOrdersForUser(user.id, { limit: 5 }).catch(() => ({ items: [], total: 0 })),
    getProfile(user.id).catch(() => ({ addresses: [] })),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Account</p>
        <h1 className="font-display mt-3 text-5xl leading-none sm:text-6xl">
          Hi, {user.name?.split(" ")[0] || "there"}
        </h1>
      </header>

      <Tabs defaultValue="orders" className="gap-8">
        <TabsList variant="line" className="h-auto w-full justify-start gap-6 border-b border-border pb-0">
          {[
            ["orders", "Orders"],
            ["addresses", "Addresses"],
            ["profile", "Profile"],
          ].map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-11 flex-none px-1 text-sm after:bottom-0"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="orders">
          {orders.items.length ? (
            <div className="space-y-4">
              <OrderList orders={orders.items} />
              {orders.total > orders.items.length ? (
                <Link
                  href="/account/orders"
                  className="inline-block text-sm font-medium text-primary hover:underline"
                >
                  View all {orders.total} orders
                </Link>
              ) : null}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="Your purchases will appear here."
              action={{ href: "/products", label: "Shop collection" }}
              className="py-12"
            />
          )}
        </TabsContent>

        <TabsContent value="addresses">
          <AddressManager initialAddresses={profile.addresses} />
        </TabsContent>

        <TabsContent value="profile">
          <div className="space-y-6 rounded-xl border border-border bg-card p-6 text-sm">
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="mt-1 font-medium">{user.name || "Account"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="mt-1 font-medium">{user.email}</dd>
              </div>
            </dl>
            <Link
              href="/settings"
              className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-xl px-4")}
            >
              <Settings className="size-4" />
              Security &amp; profile settings
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
