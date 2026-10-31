/**
 * Period-over-period change helper. Safe for server and client code.
 *
 * @param {number} current
 * @param {number} previous
 * @returns {{ pct: number | null, direction: "up" | "down" | "flat" | "new" }}
 *   `pct` is a whole-number percentage (null when there is no prior data).
 */
export function percentChange(current, previous) {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev === 0) {
    return cur === 0
      ? { pct: 0, direction: "flat" }
      : { pct: null, direction: "new" };
  }
  const pct = Math.round(((cur - prev) / prev) * 100);
  return { pct, direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}
