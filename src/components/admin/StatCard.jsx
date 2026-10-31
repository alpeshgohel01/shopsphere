import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TREND_STYLES = {
  up: "text-green-700 dark:text-green-400",
  down: "text-red-700 dark:text-red-400",
  flat: "text-muted-foreground",
  new: "text-green-700 dark:text-green-400",
};

function trendLabel({ pct, direction }) {
  if (direction === "new") return "New";
  if (direction === "flat") return "0%";
  return `${direction === "up" ? "+" : ""}${pct}%`;
}

/**
 * Dashboard metric tile.
 * @param {{
 *   label: string,
 *   value: React.ReactNode,
 *   hint?: React.ReactNode,
 *   icon?: React.ComponentType<{ className?: string }>,
 *   trend?: { pct: number | null, direction: "up" | "down" | "flat" | "new" },
 *   trendLabel?: string,
 *   className?: string,
 * }} props
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  trendLabel: trendCaption = "vs prior 30 days",
  className,
}) {
  return (
    <Card className={cn("gap-3", className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="font-display truncate text-2xl font-bold tabular-nums">
            {value}
          </p>
          {trend ? (
            <p className="text-xs">
              <span className={cn("font-semibold tabular-nums", TREND_STYLES[trend.direction])}>
                {trend.direction === "up" ? "^ " : trend.direction === "down" ? "v " : ""}
                {trendLabel(trend)}
              </span>{" "}
              <span className="text-muted-foreground">{trendCaption}</span>
            </p>
          ) : null}
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {Icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
