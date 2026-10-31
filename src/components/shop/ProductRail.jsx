"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { cn } from "@/lib/utils";

/**
 * Horizontal product rail with left/right buttons (scrollbar hidden).
 * @param {{ products: object[], label: string }} props
 */
export function ProductRail({ products, label }) {
  const scrollerRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, products.length]);

  function scrollByDir(dir) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.85, 340);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  if (!products?.length) return null;

  return (
    <div className="relative" role="region" aria-label={label}>
      <button
        type="button"
        onClick={() => scrollByDir(-1)}
        disabled={!canPrev}
        aria-label="Previous products"
        className={cn(
          "absolute top-[38%] left-0 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl border border-border bg-background/95 text-foreground shadow-md backdrop-blur transition sm:left-1 sm:size-12",
          "hover:border-primary hover:bg-primary hover:text-primary-foreground",
          "disabled:pointer-events-none disabled:opacity-0",
        )}
      >
        <ChevronLeft className="size-5" />
      </button>

      <button
        type="button"
        onClick={() => scrollByDir(1)}
        disabled={!canNext}
        aria-label="Next products"
        className={cn(
          "absolute top-[38%] right-0 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl border border-border bg-background/95 text-foreground shadow-md backdrop-blur transition sm:right-1 sm:size-12",
          "hover:border-primary hover:bg-primary hover:text-primary-foreground",
          "disabled:pointer-events-none disabled:opacity-0",
        )}
      >
        <ChevronRight className="size-5" />
      </button>

      <div
        ref={scrollerRef}
        tabIndex={0}
        className={cn(
          "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-1 pb-3 sm:-mx-6 sm:gap-6 sm:px-6",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            className="w-[70vw] max-w-[17.5rem] shrink-0 snap-start overflow-visible sm:w-64 lg:w-[17.5rem]"
          >
            <ProductCard product={product} priority={i < 2} />
          </div>
        ))}
      </div>
    </div>
  );
}
