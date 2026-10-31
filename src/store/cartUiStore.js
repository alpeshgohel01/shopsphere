"use client";

import { create } from "zustand";

/** Non-persisted UI state for the cart drawer. */
export const useCartUiStore = create((set) => ({
  open: false,
  openCart: () => set({ open: true }),
  closeCart: () => set({ open: false }),
  setOpen: (open) => set({ open: Boolean(open) }),
}));
