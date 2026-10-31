"use client";

import { useCallback, useEffect, useState } from "react";
import { useMounted } from "@/hooks/use-mounted";

const KEY = "shopsphere:recently-viewed";
const MAX = 8;

/**
 * @typedef {{ id: string, slug: string, title: string, brand?: string, image?: string, price: number, compareAtPrice?: number | null }} RecentProduct
 */

/** @returns {RecentProduct[]} */
function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((p) => p?.slug && p?.id) : [];
  } catch {
    return [];
  }
}

/** @param {RecentProduct[]} items */
function write(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Persist PDP visits for a "Recently viewed" rail.
 * @returns {{ items: RecentProduct[], push: (product: RecentProduct) => void }}
 */
export function useRecentlyViewed() {
  const mounted = useMounted();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (mounted) setItems(read());
  }, [mounted]);

  const push = useCallback((product) => {
    if (!product?.id || !product?.slug) return;
    // Always merge against localStorage so we don't race the mount hydrate.
    const current = read();
    const next = [
      {
        id: String(product.id),
        slug: product.slug,
        title: product.title,
        brand: product.brand || "",
        image: product.image || "",
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
      },
      ...current.filter((p) => p.id !== String(product.id)),
    ].slice(0, MAX);
    write(next);
    setItems(next);
  }, []);

  return { items: mounted ? items : [], push };
}
