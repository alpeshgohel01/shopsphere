import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES = {
  pending: "bg-muted text-muted-foreground",
  paid: "bg-accent text-accent-foreground",
  shipped: "bg-primary/15 text-primary",
  delivered: "bg-highlight text-highlight-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

/** @param {{ status: string, className?: string }} props */
export function OrderStatusBadge({ status, className }) {
  return (
    <Badge
      variant="secondary"
      className={cn("rounded-lg px-2.5 capitalize", STYLES[status], className)}
    >
      {status}
    </Badge>
  );
}
