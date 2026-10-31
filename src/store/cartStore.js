"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * @typedef {Object} CartItem
 * @property {string} productId
 * @property {string} slug
 * @property {string} title
 * @property {string} image
 * @property {number} price      unit price in cents
 * @property {string} size
 * @property {number} quantity
 * @property {number} maxStock   max purchasable quantity for this variant
 * @property {boolean} [available] false when the server says it cannot be bought
 */

const sameLine = (item, productId, size) =>
  item.productId === productId && item.size === size;

const clampQty = (qty, maxStock) => {
  const n = Math.floor(Number(qty));
  if (!Number.isFinite(n)) return 1;
  const cap = Number.isFinite(maxStock) && maxStock > 0 ? maxStock : Infinity;
  return Math.max(1, Math.min(n, cap));
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      /** @type {CartItem[]} */
      items: [],

      /**
       * Add a line. If productId + size already exists, quantity is
       * incremented, capped by maxStock.
       * @param {Omit<CartItem, "quantity"> & { quantity?: number }} item
       */
      addItem: (item) =>
        set((state) => {
          const size = item.size ?? "";
          const maxStock = Number(item.maxStock) || 0;
          const qty = Math.max(1, Math.floor(Number(item.quantity)) || 1);
          const existing = state.items.find((i) =>
            sameLine(i, item.productId, size),
          );

          if (existing) {
            const cap = maxStock || existing.maxStock;
            return {
              items: state.items.map((i) =>
                i === existing
                  ? {
                      ...i,
                      maxStock: cap,
                      available: true,
                      price: item.price ?? i.price,
                      quantity: clampQty(i.quantity + qty, cap),
                    }
                  : i,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                productId: item.productId,
                slug: item.slug,
                title: item.title,
                image: item.image ?? "",
                price: item.price,
                size,
                maxStock,
                quantity: clampQty(qty, maxStock),
              },
            ],
          };
        }),

      /** @param {string} productId @param {string} size */
      removeItem: (productId, size = "") =>
        set((state) => ({
          items: state.items.filter((i) => !sameLine(i, productId, size)),
        })),

      /**
       * Set an exact quantity (clamped to 1..maxStock). Quantity <= 0 removes the line.
       * @param {string} productId @param {string} size @param {number} quantity
       */
      updateQuantity: (productId, size = "", quantity) =>
        set((state) => {
          if (Number(quantity) <= 0) {
            return {
              items: state.items.filter((i) => !sameLine(i, productId, size)),
            };
          }
          return {
            items: state.items.map((i) =>
              sameLine(i, productId, size)
                ? { ...i, quantity: clampQty(quantity, i.maxStock) }
                : i,
            ),
          };
        }),

      clearCart: () => set({ items: [] }),

      /**
       * Apply server-validated data (price, stock, title, image) to matching
       * lines. Lines the server marks unavailable are kept but flagged so the
       * UI can block checkout. Does nothing (no re-render) when nothing changed.
       * @param {{ productId: string, size: string, quantity: number, title?: string, image?: string, price?: number, maxStock: number, available: boolean }[]} serverItems
       */
      syncFromServer: (serverItems) =>
        set((state) => {
          let changed = false;
          const next = state.items.map((item) => {
            const s = serverItems.find(
              (x) =>
                x.productId === item.productId &&
                String(x.size).toLowerCase() === String(item.size).toLowerCase(),
            );
            if (!s) return item;

            if (!s.available) {
              if (item.available === false && item.maxStock === 0) return item;
              changed = true;
              return { ...item, available: false, maxStock: 0 };
            }

            const updated = {
              ...item,
              available: true,
              title: s.title || item.title,
              image: s.image || item.image,
              price: Number.isFinite(s.price) ? s.price : item.price,
              maxStock: s.maxStock,
              quantity: clampQty(Math.min(item.quantity, s.quantity), s.maxStock),
            };
            const same =
              updated.available === item.available &&
              updated.title === item.title &&
              updated.image === item.image &&
              updated.price === item.price &&
              updated.maxStock === item.maxStock &&
              updated.quantity === item.quantity;
            if (same) return item;
            changed = true;
            return updated;
          });
          return changed ? { items: next } : state;
        }),

      /** Sum of price * quantity, in cents. */
      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      /** Total number of units in the cart. */
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "shopsphere-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
