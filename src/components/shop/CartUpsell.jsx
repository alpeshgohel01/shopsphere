"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/shop/format";
import { useCartStore } from "@/store/cartStore";

/**
 * Lightweight “complete the look” rail inside the cart drawer.
 * Select a stable string from zustand — mapping to a new array each render
 * retriggers subscriptions and can hit max update depth when the drawer opens.
 */
export function CartUpsell({ onNavigate }) {
  const cartKey = useCartStore((s) =>
    s.items.map((i) => String(i.productId)).join(","),
  );
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const inCart = new Set(cartKey ? cartKey.split(",") : []);

    fetch("/api/products?sort=rating&limit=8")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || !json?.ok) return;
        const next = (json.data?.items ?? [])
          .filter((p) => !inCart.has(String(p.id)))
          .slice(0, 4);
        setItems(next);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [cartKey]);

  if (!items.length) return null;

  return (
    <div className="border-t border-border px-6 py-5">
      <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        You might also like
      </p>
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((p) => {
          const img = p.images?.[0]?.url || "";
          return (
            <li key={p.id} className="w-28 shrink-0">
              <Link
                href={`/products/${p.slug}`}
                onClick={onNavigate}
                className="group block"
              >
                <span className="relative block aspect-[4/5] overflow-hidden rounded-lg bg-muted">
                  {img ? (
                    <Image
                      src={img}
                      alt={p.title}
                      fill
                      sizes="112px"
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : null}
                </span>
                <span className="mt-1.5 block truncate text-xs font-medium">
                  {p.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatPrice(p.price)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
