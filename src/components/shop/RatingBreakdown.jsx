import { Star } from "lucide-react";

/**
 * Star distribution bars.
 * @param {{ total: number, rows: { stars: number, count: number }[] }} props
 */
export function RatingBreakdown({ total, rows }) {
  return (
    <ul className="space-y-2" aria-label="Rating breakdown">
      {rows.map(({ stars, count }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <li key={stars} className="flex items-center gap-3 text-xs">
            <span className="flex w-8 shrink-0 items-center gap-1 tabular-nums text-muted-foreground">
              {stars}
              <Star aria-hidden className="size-3 fill-current" />
            </span>
            <span
              className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label={`${stars} star reviews`}
            >
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
              {count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
