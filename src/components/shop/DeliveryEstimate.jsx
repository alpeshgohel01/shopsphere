"use client";

import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";

function addBusinessDays(from, days) {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return d;
}

function formatShort(date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Flipkart/Amazon-style delivery window (client-local after mount).
 * @param {{ freeOverCents?: number, className?: string }} props
 */
export function DeliveryEstimate({ freeOverCents = 10000, className }) {
  const mounted = useMounted();
  const [range, setRange] = useState(null);

  useEffect(() => {
    const now = new Date();
    setRange({
      earliest: formatShort(addBusinessDays(now, 2)),
      latest: formatShort(addBusinessDays(now, 5)),
    });
  }, []);

  return (
    <div className={className}>
      <p className="flex items-start gap-2.5 text-sm">
        <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>
          <span className="font-medium text-foreground">
            {mounted && range
              ? `Get it by ${range.earliest} – ${range.latest}`
              : "Ships within 1–2 business days"}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Free shipping on orders over ${(freeOverCents / 100).toFixed(0)}. Easy 30-day returns.
          </span>
        </span>
      </p>
    </div>
  );
}
