"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useMounted } from "@/hooks/use-mounted";
import { useWishlistStore } from "@/store/wishlistStore";
import { cn } from "@/lib/utils";

/**
 * Heart toggle. Updates the local store instantly and, when signed in,
 * syncs to /api/wishlist in the background (guests stay local).
 *
 * @param {{ productId: string, className?: string, label?: boolean }} props
 */
export function WishlistButton({ productId, className, label = false }) {
  const mounted = useMounted();
  const active = useWishlistStore((s) => s.ids.includes(productId));
  const toggle = useWishlistStore((s) => s.toggle);
  const saved = mounted && active;

  async function onClick(event) {
    event.preventDefault();
    event.stopPropagation();
    toggle(productId);
    toast(saved ? "Removed from wishlist" : "Saved to wishlist");
    try {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    } catch {
      // Local state is the source of truth for guests / offline.
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-background/85 text-foreground backdrop-blur transition hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        label ? "h-11 px-4 text-sm font-medium" : "size-9",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4 transition",
          saved ? "fill-destructive text-destructive" : "text-foreground",
        )}
      />
      {label ? <span>{saved ? "Saved" : "Wishlist"}</span> : null}
    </button>
  );
}
