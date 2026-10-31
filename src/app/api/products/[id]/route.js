import { HttpError, handleRouteError, jsonOk } from "@/lib/shop/api";
import {
  deleteProduct,
  getProductById,
  getProductBySlug,
  updateProduct,
} from "@/lib/shop/products";
import {
  getOptionalSession,
  readJson,
  requireApiAdmin,
} from "@/lib/shop/guards";
import { hasRole } from "@/lib/session";

/** GET /api/products/:id - public (active products only; admins see inactive too). */
export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const includeInactive = hasRole(await getOptionalSession(), "admin");

    // Accept either an ObjectId or a slug.
    const product =
      (await getProductById(id, { includeInactive })) ??
      (await getProductBySlug(id, { includeInactive }));
    if (!product) throw new HttpError("Product not found", 404);

    return jsonOk(product);
  } catch (err) {
    return handleRouteError(err);
  }
}

/** PUT/PATCH /api/products/:id - admin partial update. */
async function update(request, { params }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const body = await readJson(request);
    return jsonOk(await updateProduct(id, body));
  } catch (err) {
    return handleRouteError(err);
  }
}

export const PUT = update;
export const PATCH = update;

/**
 * DELETE /api/products/:id - admin. Soft-deletes (isActive=false) so past orders
 * keep working; pass ?hard=true to remove the document permanently.
 */
export async function DELETE(request, { params }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const hard = request.nextUrl.searchParams.get("hard") === "true";

    const found = await deleteProduct(id, { hard });
    if (!found) throw new HttpError("Product not found", 404);

    return jsonOk({ id, deleted: true, hard });
  } catch (err) {
    return handleRouteError(err);
  }
}
