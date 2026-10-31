"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";

const DEDUPE_MS = 3000;
const TOAST_REPEAT_MS = 60_000;

// Shared across hook instances so the drawer, cart page and checkout never
// double-fetch or double-toast for the same cart state.
let lastSyncedKey = "";
let lastSyncedAt = 0;
const toastedAt = new Map();

const keyOf = (items) =>
  items.map((i) => `${i.productId}|${i.size}|${i.quantity}`).join(",");

function notify(message) {
  const now = Date.now();
  if (now - (toastedAt.get(message) ?? 0) < TOAST_REPEAT_MS) return;
  toastedAt.set(message, now);
  toast.warning(message, { id: `cart-sync:${message}` });
}

/**
 * Keeps the local cart honest: POSTs the cart to /api/cart/validate on mount
 * and whenever lines change (debounced), then writes the server's prices,
 * stock and availability back into the zustand cart store. The server never
 * trusts client prices; this only refreshes the UI. Price changes and stock
 * problems surface as toasts.
 *
 * @param {{ enabled?: boolean, debounceMs?: number }} [options]
 * @returns {{ syncing: boolean, hasUnavailable: boolean }}
 */
export function useCartSync({ enabled = true, debounceMs = 400 } = {}) {
  const items = useCartStore((s) => s.items);
  const syncFromServer = useCartStore((s) => s.syncFromServer);
  const [syncing, setSyncing] = useState(false);
  const requestId = useRef(0);

  const key = useMemo(() => keyOf(items), [items]);
  const hasUnavailable = items.some((i) => i.available === false);

  useEffect(() => {
    if (!enabled || !key) return undefined;
    if (key === lastSyncedKey && Date.now() - lastSyncedAt < DEDUPE_MS) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const myId = ++requestId.current;
      const snapshot = useCartStore.getState().items;
      const sentKey = keyOf(snapshot);
      setSyncing(true);
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            items: snapshot.map((i) => ({
              productId: i.productId,
              size: i.size,
              quantity: i.quantity,
              price: i.price,
            })),
          }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok) return;

        // The cart changed while we were waiting: this answer is stale.
        if (keyOf(useCartStore.getState().items) !== sentKey) return;

        syncFromServer(json.data.items);
        lastSyncedKey = keyOf(useCartStore.getState().items);
        lastSyncedAt = Date.now();

        for (const warning of json.data.warnings ?? []) notify(warning);
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.warn("[cart-sync] validation failed", err);
        }
      } finally {
        if (requestId.current === myId) setSyncing(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, key, debounceMs, syncFromServer]);

  return { syncing, hasUnavailable };
}
