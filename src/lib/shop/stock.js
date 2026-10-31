/**
 * Pure stock helpers. Safe for server and client.
 * (products.js is server-only, so client-safe code imports from here.)
 */

export const LOW_STOCK_THRESHOLD = 5;

/** @param {{ variants?: { stock?: number }[] } | null | undefined} product */
export function totalStock(product) {
  return (product?.variants ?? []).reduce((sum, v) => sum + (v.stock ?? 0), 0);
}

/**
 * @param {{ variants?: { stock?: number }[] } | null | undefined} product
 * @returns {{ state: "out" | "low" | "in", total: number }}
 */
export function stockStatus(product) {
  const total = totalStock(product);
  if (total <= 0) return { state: "out", total };
  if (total <= LOW_STOCK_THRESHOLD) return { state: "low", total };
  return { state: "in", total };
}
