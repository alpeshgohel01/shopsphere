"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/shop/format";
import { useCartStore } from "@/store/cartStore";
import { cn } from "@/lib/utils";

/**
 * @param {{ item: import("@/store/cartStore").CartItem, onNavigate?: () => void, className?: string }} props
 */
export function CartItem({ item, onNavigate, className }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const unavailable = item.available === false;
  const atMax = unavailable || (item.maxStock > 0 && item.quantity >= item.maxStock);

  return (
    <li className={cn("flex gap-4", className)}>
      <Link
        href={`/products/${item.slug}`}
        onClick={onNavigate}
        className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl bg-muted"
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/products/${item.slug}`}
              onClick={onNavigate}
              className="line-clamp-2 text-sm font-semibold hover:underline"
            >
              {item.title}
            </Link>
            {item.size ? (
              <p className="mt-0.5 text-xs text-muted-foreground">Size {item.size}</p>
            ) : null}
            {unavailable ? (
              <p className="mt-1 text-xs font-medium text-destructive">
                Unavailable - remove to continue
              </p>
            ) : null}
          </div>
          <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="inline-flex items-center rounded-xl border border-border">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
              className="flex size-8 items-center justify-center rounded-l-xl hover:bg-muted"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={atMax}
              onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
              className="flex size-8 items-center justify-center rounded-r-xl hover:bg-muted disabled:opacity-40"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.productId, item.size)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
