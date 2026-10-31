"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      /** @type {string[]} product ids */
      ids: [],

      /** Add the id if missing, remove it otherwise. @param {string} productId */
      toggle: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId)
            ? state.ids.filter((id) => id !== productId)
            : [...state.ids, productId],
        })),

      /** @param {string} productId */
      has: (productId) => get().ids.includes(productId),

      /** Replace ids, e.g. when syncing from the server. @param {string[]} ids */
      setIds: (ids) =>
        set({
          ids: Array.isArray(ids) ? [...new Set(ids.map(String))] : [],
        }),

      clear: () => set({ ids: [] }),
    }),
    {
      name: "shopsphere-wishlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ ids: state.ids }),
    },
  ),
);
