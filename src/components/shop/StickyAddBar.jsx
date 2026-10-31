"use client";

import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { formatPrice } from "@/lib/shop/format";
import { cn } from "@/lib/utils";

/**
 * Fixed add-to-bag bar for small screens. Shown once the main purchase
 * controls scroll out of view. Shares size/quantity state with the panel.
 *
 * @param {{
 *   product: object,
 *   size: string,
 *   onSizeChange: (size: string) => void,
 *   quantity: number,
 *   visible: boolean,
 * }} props
 */
export function StickyAddBar({ product, size, onSizeChange, quantity, visible }) {
  const variants = product.variants ?? [];
  const multi = variants.length > 1;
  const soldOut = variants.length > 0 && variants.every((v) => v.stock <= 0);

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(7,12,10,0.25)] backdrop-blur-xl transition-transform duration-300 lg:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      data-testid="sticky-add-bar"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{product.title}</p>
          <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
        </div>
        {multi ? (
          <>
            <label htmlFor="sticky-size" className="sr-only">
              Size
            </label>
            <select
              id="sticky-size"
              value={size}
              onChange={(e) => onSizeChange(e.target.value)}
              className="h-11 w-24 rounded-xl border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Size</option>
              {variants.map((v) => (
                <option key={v.size} value={v.size} disabled={v.stock <= 0}>
                  {v.size}
                  {v.stock <= 0 ? " (out)" : ""}
                </option>
              ))}
            </select>
          </>
        ) : null}
        <AddToCartButton
          product={product}
          size={size}
          quantity={quantity}
          className="h-11 w-auto shrink-0 px-5"
        >
          {soldOut ? "Sold out" : "Add to bag"}
        </AddToCartButton>
      </div>
    </div>
  );
}
