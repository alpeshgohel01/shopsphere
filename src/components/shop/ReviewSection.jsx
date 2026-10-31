"use client";

import { useState } from "react";
import { ReviewList } from "@/components/shop/ReviewList";
import { Button } from "@/components/ui/button";

/**
 * Reviews with marketplace-style "Load more".
 * @param {{
 *   productId: string,
 *   initialItems: object[],
 *   initialTotal: number,
 *   pageSize?: number,
 * }} props
 */
export function ReviewSection({ productId, initialItems, initialTotal, pageSize = 10 }) {
  const [items, setItems] = useState(initialItems ?? []);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal ?? initialItems?.length ?? 0);
  const [loading, setLoading] = useState(false);

  const hasMore = items.length < total;

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/products/${productId}/reviews?page=${nextPage}&limit=${pageSize}`,
      );
      const json = await res.json();
      if (json?.ok) {
        const batch = json.data?.items ?? [];
        setItems((prev) => {
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...batch.filter((r) => !seen.has(r.id))];
        });
        setTotal(json.data?.total ?? total);
        setPage(nextPage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ReviewList reviews={items} />
      {hasMore ? (
        <div className="mt-4 flex justify-center border-t border-border pt-6">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl px-6"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "Loading…" : `Load more reviews (${items.length} of ${total})`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
