"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { formatPrice } from "@/lib/shop/format";
import { primaryImage } from "@/lib/shop/cart-line";

/**
 * Records the current PDP visit and shows other recently viewed products.
 * @param {{ product: object, className?: string }} props
 */
export function RecentlyViewed({ product, className }) {
  const { items, push } = useRecentlyViewed();

  useEffect(() => {
    if (!product?.id) return;
    push({
      id: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      image: primaryImage(product) || "",
      price: product.price,
      compareAtPrice: product.compareAtPrice,
    });
  }, [product, push]);

  const others = items.filter((p) => p.id !== String(product.id)).slice(0, 6);
  if (!others.length) return null;

  return (
    <section className={className} aria-label="Recently viewed">
      <h2 className="font-display mb-8 text-3xl sm:text-4xl">Recently viewed</h2>
      <ul className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {others.map((p) => (
          <li key={p.id} className="w-36 shrink-0 sm:w-40">
            <Link href={`/products/${p.slug}`} className="group block">
              <span className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="160px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : null}
              </span>
              <span className="mt-2.5 block truncate text-sm font-semibold">{p.title}</span>
              <span className="mt-1 block text-sm">{formatPrice(p.price)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
