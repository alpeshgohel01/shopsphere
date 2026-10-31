"use client";

import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/shop/format";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shop/money";
import { cn } from "@/lib/utils";

/**
 * Progress toward free shipping (orders over $100).
 * @param {{ subtotal: number, className?: string }} props subtotal in cents
 */
export function ShippingBar({ subtotal, className }) {
  const unlocked = subtotal > FREE_SHIPPING_THRESHOLD_CENTS;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS + 1 - subtotal);
  const progress = unlocked
    ? 1
    : Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD_CENTS);

  return (
    <div className={cn("space-y-2.5", className)}>
      <p className="flex items-center gap-2 text-sm">
        <Truck
          className={cn("size-4", unlocked ? "text-primary" : "text-muted-foreground")}
        />
        {unlocked ? (
          <span className="font-medium">You&apos;ve unlocked free shipping.</span>
        ) : (
          <span>
            <span className="font-medium">{formatPrice(remaining)}</span>
            <span className="text-muted-foreground"> away from free shipping</span>
          </span>
        )}
      </p>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <motion.div
          className="h-full rounded-full bg-highlight"
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        />
      </div>
    </div>
  );
}
