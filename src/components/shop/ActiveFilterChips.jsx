"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const PRICE_LABELS = {
  "|5000": "Under $50",
  "5000|10000": "$50 - $100",
  "10000|20000": "$100 - $200",
  "20000|": "$200 & up",
};

/**
 * Removable chips for active PLP filters (Amazon/Flipkart-style feedback).
 */
export function ActiveFilterChips() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const q = params.get("q");
  const category = params.get("category");
  const min = params.get("minPrice") ?? "";
  const max = params.get("maxPrice") ?? "";
  const rating = params.get("rating");
  const sale = params.get("sale") === "1";

  const clear = useCallback(
    (keys) => {
      const next = new URLSearchParams(params.toString());
      for (const key of keys) next.delete(key);
      next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  /** @type {{ key: string, label: string, remove: string[] }[]} */
  const chips = [];
  if (q) chips.push({ key: "q", label: `“${q}”`, remove: ["q"] });
  if (category) chips.push({ key: "category", label: category, remove: ["category"] });
  if (min || max) {
    const label = PRICE_LABELS[`${min}|${max}`] || `$${Number(min || 0) / 100}+`;
    chips.push({ key: "price", label, remove: ["minPrice", "maxPrice"] });
  }
  if (rating) chips.push({ key: "rating", label: `${rating}+ stars`, remove: ["rating"] });
  if (sale) chips.push({ key: "sale", label: "On sale", remove: ["sale"] });

  if (!chips.length) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => clear(chip.remove)}
          className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-medium transition hover:border-foreground/40"
        >
          {chip.label}
          <X className="size-3 opacity-60" aria-hidden />
          <span className="sr-only">Remove {chip.label}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => router.replace(pathname, { scroll: false })}
        className="h-8 px-2 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
