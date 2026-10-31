import { handleRouteError, jsonOk } from "@/lib/shop/api";
import { getWishlistProducts, toggleWishlist } from "@/lib/shop/profiles";
import { readJson, requireApiUser } from "@/lib/shop/guards";

/** GET /api/wishlist - the signed-in user's wishlist products. */
export async function GET() {
  try {
    const session = await requireApiUser();
    return jsonOk(await getWishlistProducts(session.user.id));
  } catch (err) {
    return handleRouteError(err);
  }
}

/** POST /api/wishlist - toggle a product. Body: { productId } */
export async function POST(request) {
  try {
    const session = await requireApiUser();
    const body = (await readJson(request)) ?? {};
    return jsonOk(await toggleWishlist(session.user.id, body.productId));
  } catch (err) {
    return handleRouteError(err);
  }
}
