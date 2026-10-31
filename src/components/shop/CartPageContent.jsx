"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CartItem } from "@/components/shop/CartItem";
import { EmptyState } from "@/components/shop/EmptyState";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { ShippingBar } from "@/components/shop/ShippingBar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartSync } from "@/hooks/use-cart-sync";
import { useMounted } from "@/hooks/use-mounted";
import { useCartStore } from "@/store/cartStore";
import { cn } from "@/lib/utils";

export function CartPageContent() {
  const mounted = useMounted();
  const items = useCartStore((s) => s.items);
  const { hasUnavailable } = useCartSync({ enabled: mounted });
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (!mounted) {
    return (
      <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your bag is empty"
        description="Find something worth wearing."
        action={{ href: "/products", label: "Shop collection" }}
      />
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16">
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <CartItem
            key={`${item.productId}-${item.size}`}
            item={item}
            className="py-6 first:pt-0"
          />
        ))}
      </ul>

      <aside className="h-fit space-y-6 rounded-xl border border-border bg-card p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl">Summary</h2>
        <ShippingBar subtotal={subtotal} />
        <OrderSummary subtotal={subtotal} />
        {hasUnavailable ? (
          <p className="text-xs font-medium text-destructive">
            Remove unavailable items to check out.
          </p>
        ) : null}
        <Link
          href="/checkout"
          aria-disabled={hasUnavailable}
          className={cn(
            buttonVariants(),
            "h-12 w-full rounded-xl text-sm font-semibold",
            hasUnavailable && "pointer-events-none opacity-50",
          )}
        >
          Checkout
        </Link>
        <Link
          href="/products"
          className="block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
