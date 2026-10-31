"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/shop/EmptyState";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/hooks/use-mounted";
import { useWishlistStore } from "@/store/wishlistStore";

/**
 * Shows saved products. Signed-in users receive their products from the
 * server; guests resolve their locally saved ids against the public catalog.
 *
 * @param {{ serverProducts?: object[] | null }} props
 */
export function WishlistView({ serverProducts = null }) {
  const mounted = useMounted();
  const ids = useWishlistStore((s) => s.ids);
  const setIds = useWishlistStore((s) => s.setIds);
  const signedIn = Array.isArray(serverProducts);

  const [catalog, setCatalog] = useState(serverProducts ?? []);
  const [loading, setLoading] = useState(!signedIn);

  useEffect(() => {
    if (signedIn) setIds(serverProducts.map((p) => p.id));
    // Seed once from the server snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (signedIn) return;
    let cancelled = false;
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setCatalog(json?.data?.items ?? []);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  if (!mounted || loading) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
        ))}
      </div>
    );
  }

  const byId = new Map(catalog.map((p) => [p.id, p]));
  const products = [...ids].reverse().map((id) => byId.get(id)).filter(Boolean);

  if (!products.length) {
    return (
      <EmptyState
        icon={Heart}
        title="Nothing saved yet"
        description="Tap the heart on any piece to keep it here."
        action={{ href: "/products", label: "Shop collection" }}
      />
    );
  }

  return (
    <>
      {!signedIn ? (
        <p className="mb-8 text-sm text-muted-foreground">
          <Link href="/sign-in?callbackUrl=%2Fwishlist" className="font-medium text-primary hover:underline">
            Sign in
          </Link>{" "}
          to keep your wishlist across devices.
        </p>
      ) : null}
      <ProductGrid products={products} />
    </>
  );
}
