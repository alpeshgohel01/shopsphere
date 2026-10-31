import { CURRENCY } from "@/lib/shop/money";
import { totalStock } from "@/lib/shop/stock";

/**
 * Build a schema.org Product object for a serialized product.
 * Prices are cents in the DB and dollars in JSON-LD.
 *
 * @param {object} product serialized product
 * @param {string} baseUrl site origin, no trailing slash
 */
export function buildProductJsonLd(product, baseUrl) {
  const url = `${baseUrl}/products/${product.slug}`;
  const images = (product.images ?? []).map((i) => i.url).filter(Boolean);
  const inStock = totalStock(product) > 0;

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    url,
    ...(images.length ? { image: images } : {}),
    ...(product.description ? { description: product.description.slice(0, 500) } : {}),
    sku: product.id,
    ...(product.category ? { category: product.category } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: CURRENCY,
      price: (product.price / 100).toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (product.ratingCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.ratingAvg).toFixed(1),
      reviewCount: product.ratingCount,
    };
  }
  return data;
}

/**
 * Serialize JSON-LD safely for an inline script tag.
 * @param {object} data
 */
export function jsonLdString(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
