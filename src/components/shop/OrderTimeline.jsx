import { Check, X } from "lucide-react";
import { ORDER_STEPS } from "@/lib/shop/copy";
import { formatDate } from "@/lib/shop/format";
import { cn } from "@/lib/utils";

const RANK = { pending: 0, paid: 1, shipped: 2, delivered: 3 };

/**
 * Derive the four timeline steps from an order.
 * Dates come from createdAt / paidAt / shippedAt / deliveredAt; when a later
 * status was set without a date (older data), the step is done with no date.
 *
 * @param {{
 *   status?: string,
 *   paymentStatus?: string,
 *   createdAt?: string | null,
 *   paidAt?: string | null,
 *   shippedAt?: string | null,
 *   deliveredAt?: string | null,
 * }} order
 */
export function buildOrderSteps(order) {
  const rank = RANK[order?.status] ?? 0;
  const paid = order?.paymentStatus === "paid" || rank >= 1 || Boolean(order?.paidAt);

  return [
    { key: "placed", label: ORDER_STEPS.placed, done: true, date: order?.createdAt ?? null },
    { key: "paid", label: ORDER_STEPS.paid, done: paid, date: order?.paidAt ?? null },
    {
      key: "shipped",
      label: ORDER_STEPS.shipped,
      done: rank >= 2 || Boolean(order?.shippedAt),
      date: order?.shippedAt ?? null,
    },
    {
      key: "delivered",
      label: ORDER_STEPS.delivered,
      done: rank >= 3 || Boolean(order?.deliveredAt),
      date: order?.deliveredAt ?? null,
    },
  ];
}

/**
 * Order progress: Placed / Paid / Shipped / Delivered.
 * @param {{ order: object, className?: string }} props
 */
export function OrderTimeline({ order, className }) {
  const cancelled = order?.status === "cancelled";
  const steps = buildOrderSteps(order);
  const currentIndex = cancelled ? -1 : steps.findIndex((s) => !s.done);

  return (
    <div className={className}>
      <ol
        className="grid gap-0 sm:grid-cols-4"
        aria-label={`Order progress: ${cancelled ? "cancelled" : (order?.status ?? "pending")}`}
      >
        {steps.map((step, i) => {
          const current = i === currentIndex;
          const last = i === steps.length - 1;
          const nextDone = steps[i + 1]?.done;
          return (
            <li
              key={step.key}
              aria-current={current ? "step" : undefined}
              className="relative flex gap-4 pb-6 sm:block sm:pb-0"
              data-state={step.done ? "done" : current ? "current" : "todo"}
            >
              {/* connector: vertical on mobile, horizontal from sm */}
              {!last ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-9 left-[15px] h-[calc(100%-2.25rem)] w-0.5 sm:top-[15px] sm:left-9 sm:h-0.5 sm:w-[calc(100%-2.25rem)]",
                    step.done && nextDone ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}

              <span
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  step.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : current
                      ? "border-primary bg-background text-primary"
                      : "border-border bg-background text-muted-foreground",
                )}
              >
                {step.done ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>

              <div className="sm:mt-3">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    !step.done && !current && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.done
                    ? step.date
                      ? formatDate(step.date)
                      : "Complete"
                    : current
                      ? "In progress"
                      : cancelled
                        ? "Not reached"
                        : "Pending"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {cancelled ? (
        <p className="mt-6 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <X className="size-4 shrink-0" aria-hidden />
          {ORDER_STEPS.cancelled}
          {order?.cancelledAt ? ` on ${formatDate(order.cancelledAt)}` : ""}
        </p>
      ) : null}
    </div>
  );
}
