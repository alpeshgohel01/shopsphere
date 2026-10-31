import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  pending:
    "bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25",
  paid: "bg-blue-100 text-blue-800 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25",
  shipped:
    "bg-violet-100 text-violet-800 ring-violet-600/20 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/25",
  delivered:
    "bg-green-100 text-green-800 ring-green-600/20 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-400/25",
  cancelled:
    "bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/25",
};

/**
 * Order status pill: pending amber, paid blue, shipped violet,
 * delivered green, cancelled red.
 * @param {{ status: string, className?: string }} props
 */
export function StatusBadge({ status, className }) {
  const style =
    STATUS_STYLES[status] ??
    "bg-muted text-muted-foreground ring-foreground/10";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        style,
        className,
      )}
    >
      {status}
    </span>
  );
}
