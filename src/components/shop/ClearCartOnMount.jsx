"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";

/** Empties the local cart once an order is confirmed. */
export function ClearCartOnMount() {
  const clearCart = useCartStore((s) => s.clearCart);
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  return null;
}
