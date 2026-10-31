import { formatPrice } from "@/lib/shop/format";
import { computeOrderTotals } from "@/lib/shop/money";
import { cn } from "@/lib/utils";

/** @param {{ subtotal: number, className?: string }} props subtotal in cents */
export function OrderSummary({ subtotal, className }) {
  const totals = computeOrderTotals(subtotal);
  const rows = [
    ["Subtotal", formatPrice(totals.subtotal)],
    ["Shipping", totals.shippingFee === 0 ? "Free" : formatPrice(totals.shippingFee)],
    ["Tax (8%)", formatPrice(totals.tax)],
  ];

  return (
    <dl className={cn("space-y-3 text-sm", className)}>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t border-border pt-4 text-base">
        <dt className="font-semibold">Total</dt>
        <dd className="font-semibold">{formatPrice(totals.total)}</dd>
      </div>
    </dl>
  );
}
