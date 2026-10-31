"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/shop/constants";
import { cn } from "@/lib/utils";

const PRICE_RANGES = [
  { label: "Any price", min: null, max: null },
  { label: "Under $50", min: null, max: 5000 },
  { label: "$50 - $100", min: 5000, max: 10000 },
  { label: "$100 - $200", min: 10000, max: 20000 },
  { label: "$200 & up", min: 20000, max: null },
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

const RATINGS = [4, 3, 2];

function Chip({ active, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-xl border px-3.5 py-2 text-sm transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-foreground/30",
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Group({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="font-sans text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * Filters synced to URL search params (category, price, rating, sort, sale).
 * @param {{ categoryCounts?: { category: string, count: number }[] }} props
 */
export function Filters({ categoryCounts = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const category = params.get("category") ?? "";
  const min = params.get("minPrice");
  const max = params.get("maxPrice");
  const rating = params.get("rating") ?? "";
  const sort = params.get("sort") ?? "newest";
  const sale = params.get("sale") === "1";
  const q = params.get("q") ?? "";

  const update = useCallback(
    (changes) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value == null || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const counts = new Map(categoryCounts.map((c) => [c.category.toLowerCase(), c.count]));
  const activeCount = [category, min || max, rating, sale, q].filter(Boolean).length;

  const filterGroups = (
    <div className="space-y-8">
      <Group title="Category">
        <div className="flex flex-wrap gap-2">
          <Chip active={!category} onClick={() => update({ category: "" })}>
            All
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.slug}
              active={category.toLowerCase() === c.name.toLowerCase()}
              onClick={() => update({ category: c.name })}
            >
              {c.label}
              {counts.has(c.name.toLowerCase()) ? (
                <span className="ml-1.5 text-xs opacity-60">
                  {counts.get(c.name.toLowerCase())}
                </span>
              ) : null}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Price">
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((r) => {
            const active =
              String(r.min ?? "") === (min ?? "") && String(r.max ?? "") === (max ?? "");
            return (
              <Chip
                key={r.label}
                active={active}
                onClick={() => update({ minPrice: r.min, maxPrice: r.max })}
              >
                {r.label}
              </Chip>
            );
          })}
        </div>
      </Group>

      <Group title="Rating">
        <div className="flex flex-wrap gap-2">
          <Chip active={!rating} onClick={() => update({ rating: "" })}>
            Any
          </Chip>
          {RATINGS.map((r) => (
            <Chip
              key={r}
              active={rating === String(r)}
              onClick={() => update({ rating: r })}
            >
              <span className="inline-flex items-center gap-1">
                {r}
                <Star className="size-3 fill-current" /> & up
              </span>
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Offers">
        <Chip active={sale} onClick={() => update({ sale: sale ? "" : "1" })}>
          On sale
        </Chip>
      </Group>

      {activeCount > 0 ? (
        <Button
          variant="ghost"
          className="h-10 rounded-xl px-3 text-sm"
          onClick={() => {
            router.replace(pathname, { scroll: false });
          }}
        >
          <X className="size-4" /> Clear all
        </Button>
      ) : null}
    </div>
  );

  function SortSelect() {
    return (
      <select
        value={sort}
        onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })}
        className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Sort products"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div>
      <div className="space-y-3 lg:hidden">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Sort
            </label>
            <SortSelect />
          </div>
          <div className="flex flex-col justify-end">
            <Button
              variant="outline"
              className="h-10 w-full justify-between rounded-xl px-3 text-sm"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="size-4" />
                Filters{activeCount ? ` (${activeCount})` : ""}
              </span>
            </Button>
          </div>
        </div>
        {open ? <div className="pt-3">{filterGroups}</div> : null}
      </div>
      <div className="hidden space-y-8 lg:block">
        <Group title="Sort">
          <SortSelect />
        </Group>
        {filterGroups}
      </div>
    </div>
  );
}
