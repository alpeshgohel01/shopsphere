/**
 * Pure helpers shared by product cards, the detail page and cart UI.
 * Safe for server and client.
 */

/** @param {{ images?: { url: string }[] } | null | undefined} product */
export function primaryImage(product) {
  return product?.images?.[0]?.url ?? "";
}

/** @param {{ compareAtPrice?: number | null, price: number }} product */
export function isOnSale(product) {
  return product?.compareAtPrice != null && product.compareAtPrice > product.price;
}

/** @param {{ compareAtPrice?: number | null, price: number }} product */
export function discountPercent(product) {
  if (!isOnSale(product)) return 0;
  return Math.round((1 - product.price / product.compareAtPrice) * 100);
}

/** @param {{ variants?: { size: string, stock: number }[] }} product */
export function inStockVariants(product) {
  return (product?.variants ?? []).filter((v) => v.stock > 0);
}

/**
 * Build the object expected by cartStore.addItem.
 * @param {object} product serialized product
 * @param {{ size: string, stock: number }} variant
 * @param {number} [quantity]
 */
export function buildCartLine(product, variant, quantity = 1) {
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    image: primaryImage(product),
    price: product.price,
    size: variant.size,
    maxStock: variant.stock,
    quantity,
  };
}
