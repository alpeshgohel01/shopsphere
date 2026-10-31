"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { DeliveryEstimate } from "@/components/shop/DeliveryEstimate";
import { StickyAddBar } from "@/components/shop/StickyAddBar";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { cn } from "@/lib/utils";

/** Size picker, quantity stepper, add to bag and wishlist for the detail page. */
export function ProductPurchasePanel({ product }) {
  const variants = product.variants ?? [];
  const firstAvailable = variants.find((v) => v.stock > 0);
  const [size, setSize] = useState(variants.length === 1 ? variants[0].size : "");
  const [quantity, setQuantity] = useState(1);
  const [showSticky, setShowSticky] = useState(false);
  const actionsRef = useRef(null);

  const selected = variants.find((v) => v.size === size);
  const max = Math.max(1, Math.min(selected?.stock ?? 10, 10));
  const soldOut = !firstAvailable;

  // Show the sticky bar only after the main add-to-bag row has scrolled
  // above the viewport (not while it is still below the fold).
  useEffect(() => {
    const el = actionsRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function chooseSize(next) {
    setSize(next);
    const v = variants.find((x) => x.size === next);
    if (v) setQuantity((q) => Math.min(q, Math.max(1, v.stock)));
  }

  return (
    <div className="space-y-6">
      {variants.length > 1 ? (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">
              Size{size ? <span className="ml-2 font-normal text-muted-foreground">{size}</span> : null}
            </p>
            <div className="flex items-center gap-3">
              {selected && selected.stock > 0 && selected.stock <= 5 ? (
                <p className="text-xs font-medium text-destructive">Only {selected.stock} left</p>
              ) : null}
              <Link
                href="/size-guide"
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Size guide
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
            {variants.map((v) => {
              const out = v.stock <= 0;
              const active = v.size === size;
              return (
                <button
                  key={v.size}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={out}
                  onClick={() => chooseSize(v.size)}
                  className={cn(
                    "h-11 min-w-14 rounded-xl border px-4 text-sm font-medium transition",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-foreground/40",
                    out && "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:border-border",
                  )}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div ref={actionsRef} className="flex items-center gap-3">
        <div className="inline-flex h-12 items-center rounded-xl border border-border bg-card">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex size-12 items-center justify-center rounded-l-xl hover:bg-muted"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            className="flex size-12 items-center justify-center rounded-r-xl hover:bg-muted"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <AddToCartButton
          product={product}
          size={size}
          quantity={quantity}
          className="flex-1"
        />
        <WishlistButton
          productId={product.id}
          className="size-12 border border-border bg-card"
        />
      </div>

      {soldOut ? (
        <p className="text-sm text-muted-foreground">This product is currently sold out.</p>
      ) : (
        <DeliveryEstimate className="rounded-xl border border-border/70 bg-card/60 px-3.5 py-3" />
      )}

      <StickyAddBar
        product={product}
        size={size}
        onSizeChange={chooseSize}
        quantity={quantity}
        visible={showSticky}
      />
    </div>
  );
}
