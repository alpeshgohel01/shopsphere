"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/shop/RatingStars";
import { WishlistButton } from "@/components/shop/WishlistButton";
import {
  buildCartLine,
  discountPercent,
  inStockVariants,
  isOnSale,
  primaryImage,
} from "@/lib/shop/cart-line";
import { formatPrice } from "@/lib/shop/format";
import { useCartStore } from "@/store/cartStore";
import { useCartUiStore } from "@/store/cartUiStore";
import { cn } from "@/lib/utils";

/**
 * @param {{ product: object, priority?: boolean, className?: string }} props
 */
export function ProductCard({ product, priority = false, className }) {
  const [picking, setPicking] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartUiStore((s) => s.openCart);

  const image = primaryImage(product);
  const available = inStockVariants(product);
  const soldOut = available.length === 0;
  const onSale = isOnSale(product);

  function add(variant) {
    addItem(buildCartLine(product, variant, 1));
    toast.success(`${product.title} added`, { description: `Size ${variant.size}` });
    setPicking(false);
    openCart();
  }

  function onQuickAdd() {
    if (soldOut) return;
    if (available.length === 1) add(available[0]);
    else setPicking(true);
  }

  return (
    <article className={cn("group/card", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0 block"
          aria-label={product.title}
        >
          {image ? (
            <Image
              src={image}
              alt={product.title}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
              No image
            </span>
          )}
        </Link>

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between">
          <div className="flex flex-col items-start gap-1.5">
            {onSale ? (
              <Badge className="rounded-lg bg-highlight px-2 text-highlight-foreground">
                -{discountPercent(product)}%
              </Badge>
            ) : null}
            {soldOut ? (
              <Badge variant="secondary" className="rounded-lg px-2">
                Sold out
              </Badge>
            ) : null}
          </div>
          <WishlistButton productId={product.id} className="pointer-events-auto" />
        </div>

        <div className="absolute inset-x-3 bottom-3">
          <AnimatePresence mode="wait" initial={false}>
            {picking ? (
              <motion.div
                key="sizes"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className="rounded-xl bg-background/95 p-2.5 shadow-lg backdrop-blur"
              >
                <div className="mb-2 flex items-center justify-between px-0.5">
                  <span className="text-xs font-medium">Select size</span>
                  <button
                    type="button"
                    onClick={() => setPicking(false)}
                    aria-label="Close size picker"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {available.map((v) => (
                    <button
                      key={v.size}
                      type="button"
                      onClick={() => add(v)}
                      className="h-8 min-w-9 rounded-lg border border-border px-2 text-xs font-medium transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="quick"
                type="button"
                onClick={onQuickAdd}
                disabled={soldOut}
                initial={false}
                className={cn(
                  "flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-background/95 text-sm font-semibold shadow-md backdrop-blur transition",
                  "hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60",
                  // Touch: always on. Pointer hover: reveal on card hover.
                  "[@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0",
                  "[@media(hover:hover)]:group-hover/card:translate-y-0 [@media(hover:hover)]:group-hover/card:opacity-100",
                  "[@media(hover:hover)]:focus-visible:translate-y-0 [@media(hover:hover)]:focus-visible:opacity-100",
                )}
              >
                <Plus className="size-4" />
                {soldOut ? "Sold out" : "Quick add"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Link
        href={`/products/${product.slug}`}
        className="mt-3.5 block space-y-1.5 overflow-visible pb-1"
      >
        {product.brand ? (
          <p className="text-[0.7rem] leading-normal tracking-wide text-muted-foreground uppercase">
            {product.brand}
          </p>
        ) : null}
        <h3 className="line-clamp-2 min-h-[2.5rem] font-sans text-[0.95rem] leading-snug font-semibold tracking-normal">
          {product.title}
        </h3>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <p className="flex items-baseline gap-2 text-sm leading-none">
            <span className="font-semibold">{formatPrice(product.price)}</span>
            {onSale ? (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            ) : null}
          </p>
          {product.ratingCount > 0 ? (
            <RatingStars rating={product.ratingAvg} showCount={false} />
          ) : null}
        </div>
      </Link>
    </article>
  );
}
