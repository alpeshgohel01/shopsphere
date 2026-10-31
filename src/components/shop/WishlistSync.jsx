"use client";

import { useEffect } from "react";
import { useWishlistStore } from "@/store/wishlistStore";

/**
 * Seeds the local wishlist store from the server wishlist of the signed-in user.
 * @param {{ ids?: string[] | null }} props
 */
export function WishlistSync({ ids }) {
  const setIds = useWishlistStore((s) => s.setIds);

  useEffect(() => {
    if (Array.isArray(ids)) setIds(ids);
  }, [ids, setIds]);

  return null;
}
