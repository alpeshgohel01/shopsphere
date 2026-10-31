"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Mirrors the server-side transitions in src/lib/shop/orders.js. */
const NEXT_STATUSES = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const SELECT_CLASS =
  "h-10 min-w-40 rounded-xl border border-input bg-transparent px-3 text-sm capitalize outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30 [&>option]:bg-popover [&>option]:text-popover-foreground";

/**
 * Admin order status dropdown -> PATCH /api/orders/:id.
 * Only valid next statuses are offered.
 * @param {{ orderId: string, status: string }} props
 */
export function OrderStatusSelect({ orderId, status }) {
  const router = useRouter();
  const options = NEXT_STATUSES[status] ?? [];
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  if (!options.length) {
    return (
      <p className="text-sm text-muted-foreground">
        This order is <span className="font-medium capitalize">{status}</span> - no further
        changes are possible.
      </p>
    );
  }

  async function handleSave() {
    if (value === status) return;
    if (
      value === "cancelled" &&
      !window.confirm("Cancel this order? Paid orders will be restocked.")
    ) {
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: value,
          ...(value === "shipped"
            ? {
                trackingNumber: trackingNumber.trim() || undefined,
                carrier: carrier.trim() || undefined,
              }
            : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Update failed (${res.status})`);
      }
      toast.success(`Order marked ${value}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
      setValue(status);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Order status"
        className={SELECT_CLASS}
        value={value}
        disabled={busy}
        onChange={(e) => setValue(e.target.value)}
      >
        <option value={status}>{status} (current)</option>
        {options.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <Button
        type="button"
        className="h-10 px-4"
        onClick={handleSave}
        disabled={busy || value === status}
      >
        {busy ? <Loader2 className="animate-spin" /> : null}
        Update status
      </Button>
    </div>
    {value === "shipped" && status !== "shipped" ? (
      <div className="grid max-w-xl gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="order-carrier" className="mb-1.5 block text-sm font-medium">
            Carrier <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="order-carrier"
            value={carrier}
            maxLength={60}
            placeholder="UPS, FedEx, DHL..."
            disabled={busy}
            onChange={(e) => setCarrier(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="order-tracking" className="mb-1.5 block text-sm font-medium">
            Tracking number <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="order-tracking"
            value={trackingNumber}
            maxLength={100}
            placeholder="1Z999AA10123456784"
            disabled={busy}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </div>
      </div>
    ) : null}
    </div>
  );
}
