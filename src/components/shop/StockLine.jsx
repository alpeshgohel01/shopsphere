import { PRODUCT } from "@/lib/shop/copy";
import { stockStatus } from "@/lib/shop/stock";
import { cn } from "@/lib/utils";

/** One-line stock status for the product detail page. */
export function StockLine({ product, className }) {
  const { state, total } = stockStatus(product);

  const text =
    state === "out"
      ? PRODUCT.soldOut
      : state === "low"
        ? PRODUCT.lowStock(total)
        : PRODUCT.inStock;

  return (
    <p
      className={cn(
        "flex items-center gap-2 text-sm font-medium",
        state === "low" && "text-destructive",
        state === "out" && "text-muted-foreground",
        className,
      )}
      data-stock={state}
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          state === "in" && "bg-primary",
          state === "low" && "bg-destructive",
          state === "out" && "bg-muted-foreground/50",
        )}
      />
      {text}
    </p>
  );
}
