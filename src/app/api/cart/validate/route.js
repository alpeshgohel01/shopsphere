import { handleRouteError, jsonOk } from "@/lib/shop/api";
import { readJson } from "@/lib/shop/guards";
import { validateCart } from "@/lib/shop/cart-validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/cart/validate
 * Body: { items: [{ productId, size, quantity, price? }] }
 *
 * Returns { data: { items: [{ productId, size, quantity, title, image, price,
 * maxStock, available, priceChanged }], warnings: string[] } }.
 * Prices and stock are read from the database; a client price is only used to
 * flag `priceChanged`.
 */
export async function POST(request) {
  try {
    const body = (await readJson(request)) ?? {};
    return jsonOk(await validateCart(body));
  } catch (err) {
    return handleRouteError(err);
  }
}
