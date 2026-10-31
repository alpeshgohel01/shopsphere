"use client";

import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildCartLine } from "@/lib/shop/cart-line";
import { useCartStore } from "@/store/cartStore";
import { useCartUiStore } from "@/store/cartUiStore";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   product: object,
 *   size?: string,
 *   quantity?: number,
 *   className?: string,
 *   children?: import("react").ReactNode,
 *   openDrawer?: boolean,
 * }} props
 */
export function AddToCartButton({
  product,
  size,
  quantity = 1,
  className,
  children,
  openDrawer = true,
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartUiStore((s) => s.openCart);

  const variants = product.variants ?? [];
  const variant = size
    ? variants.find((v) => v.size === size)
    : variants.length === 1
      ? variants[0]
      : undefined;
  const soldOut = variants.length > 0 && variants.every((v) => v.stock <= 0);
  const needsSize = !variant && variants.length > 1;
  const disabled = soldOut || (variant && variant.stock <= 0);

  function onClick() {
    if (needsSize) {
      toast.error("Choose a size first");
      return;
    }
    if (!variant) return;
    addItem(buildCartLine(product, variant, quantity));
    toast.success(`${product.title} added`, { description: `Size ${variant.size}` });
    if (openDrawer) openCart();
  }

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={Boolean(disabled)}
      className={cn("h-12 w-full rounded-xl text-sm font-semibold", className)}
    >
      <ShoppingBag className="size-4" />
      {children ?? (soldOut || disabled ? "Sold out" : "Add to bag")}
    </Button>
  );
}
