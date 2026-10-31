import { ProductCard } from "@/components/shop/ProductCard";
import { cn } from "@/lib/utils";

/**
 * @param {{ products: object[], priorityCount?: number, className?: string, columns?: 3 | 4 }} props
 */
export function ProductGrid({
  products,
  priorityCount = 0,
  columns = 4,
  className,
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6",
        columns === 4 ? "sm:grid-cols-3 lg:grid-cols-4" : "sm:grid-cols-3",
        className,
      )}
    >
      {products.map((product, i) => (
        <div
          key={product.id}
          className="reveal-up"
          style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}
        >
          <ProductCard product={product} priority={i < priorityCount} />
        </div>
      ))}
    </div>
  );
}
