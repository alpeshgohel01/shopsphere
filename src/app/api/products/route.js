import { handleRouteError, jsonOk } from "@/lib/shop/api";
import { createProduct, listProducts } from "@/lib/shop/products";
import {
  getOptionalSession,
  readJson,
  requireApiAdmin,
} from "@/lib/shop/guards";
import { hasRole } from "@/lib/session";

/** GET /api/products - public list. Admins may pass ?includeInactive=true. */
export async function GET(request) {
  try {
    const query = Object.fromEntries(request.nextUrl.searchParams);

    let includeInactive = false;
    if (query.includeInactive === "true") {
      includeInactive = hasRole(await getOptionalSession(), "admin");
    }

    return jsonOk(await listProducts(query, { includeInactive }));
  } catch (err) {
    return handleRouteError(err);
  }
}

/** POST /api/products - admin create. */
export async function POST(request) {
  try {
    await requireApiAdmin();
    const body = await readJson(request);
    return jsonOk(await createProduct(body), 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
