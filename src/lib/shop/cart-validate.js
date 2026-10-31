import "server-only";
import { getProductById } from "@/lib/shop/products";
import { cartValidateSchema } from "@/lib/shop/validators";
import { formatCents } from "@/lib/shop/money";

/** Max units of a single line (matches checkoutItemSchema). */
const MAX_LINE_QTY = 20;

/**
 * Re-price and re-check stock for cart lines. Prices, titles, images and stock
 * always come from the database; a client-supplied price is only compared to
 * decide `priceChanged`.
 *
 * @param {unknown} input { items: [{ productId, size, quantity, price? }] }
 * @returns {Promise<{ items: object[], warnings: string[] }>}
 */
export async function validateCart(input) {
  const { items } = cartValidateSchema.parse(input);

  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await Promise.all(ids.map((id) => getProductById(id)));
  const byId = new Map(ids.map((id, idx) => [id, products[idx]]));

  const warnings = [];
  const out = items.map((line) => {
    const product = byId.get(line.productId);

    if (!product) {
      warnings.push("An item in your bag is no longer available.");
      return {
        productId: line.productId,
        size: line.size,
        quantity: line.quantity,
        title: "",
        image: "",
        price: 0,
        maxStock: 0,
        available: false,
        priceChanged: false,
      };
    }

    const variants = product.variants ?? [];
    let variant;
    if (line.size) {
      variant = variants.find(
        (v) => v.size.toLowerCase() === line.size.toLowerCase(),
      );
    } else if (variants.length === 1) {
      variant = variants[0];
    }

    const base = {
      productId: line.productId,
      slug: product.slug,
      title: product.title,
      image: product.images?.[0]?.url ?? "",
      price: product.price,
    };

    if (!variant) {
      warnings.push(`"${product.title}" is no longer offered in size ${line.size}.`);
      return {
        ...base,
        size: line.size,
        quantity: line.quantity,
        maxStock: 0,
        available: false,
        priceChanged: false,
      };
    }

    const maxStock = Math.max(0, variant.stock ?? 0);
    const cap = Math.min(maxStock, MAX_LINE_QTY);
    const available = cap > 0;
    let quantity = line.quantity;

    if (!available) {
      warnings.push(`"${product.title}" (${variant.size}) is out of stock.`);
    } else if (quantity > cap) {
      quantity = cap;
      warnings.push(
        `Only ${cap} left in stock for "${product.title}" (${variant.size}). Quantity updated.`,
      );
    }

    const priceChanged = line.price != null && line.price !== product.price;
    if (priceChanged) {
      warnings.push(
        `Price of "${product.title}" changed from ${formatCents(line.price)} to ${formatCents(product.price)}.`,
      );
    }

    return {
      ...base,
      size: variant.size,
      quantity,
      maxStock,
      available,
      priceChanged,
    };
  });

  return { items: out, warnings: [...new Set(warnings)] };
}
