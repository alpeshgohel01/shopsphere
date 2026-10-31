import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @param {{ rating?: number, count?: number, size?: "sm" | "md", showCount?: boolean, className?: string }} props
 */
export function RatingStars({
  rating = 0,
  count,
  size = "sm",
  showCount = true,
  className,
}) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  const dim = size === "md" ? "size-4" : "size-3.5";

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      role="img"
      aria-label={`Rated ${value.toFixed(1)} out of 5`}
    >
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden
            className={cn(
              dim,
              n <= Math.round(value)
                ? "fill-primary text-primary"
                : "fill-transparent text-muted-foreground/40",
            )}
          />
        ))}
      </span>
      {showCount && count != null ? (
        <span className="text-xs text-muted-foreground">
          {count > 0 ? `${value.toFixed(1)} (${count})` : "No reviews"}
        </span>
      ) : null}
    </div>
  );
}
