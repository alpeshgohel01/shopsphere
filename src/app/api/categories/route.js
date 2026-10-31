import { handleRouteError, jsonOk } from "@/lib/shop/api";
import { getCategoriesWithCounts } from "@/lib/shop/products";

/** GET /api/categories - active categories with product counts. */
export async function GET() {
  try {
    return jsonOk(await getCategoriesWithCounts());
  } catch (err) {
    return handleRouteError(err);
  }
}
