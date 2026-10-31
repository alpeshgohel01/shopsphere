import { HttpError, handleRouteError, jsonOk } from "@/lib/shop/api";
import { getOrderById, updateOrderStatus } from "@/lib/shop/orders";
import { readJson, requireApiAdmin, requireApiUser } from "@/lib/shop/guards";
import { hasRole } from "@/lib/session";

/** GET /api/orders/:id - order owner or admin. */
export async function GET(_request, { params }) {
  try {
    const session = await requireApiUser();
    const { id } = await params;
    const isAdmin = hasRole(session, "admin");

    // Non-admins can only load their own orders; others look like 404.
    const order = await getOrderById(id, {
      userId: isAdmin ? undefined : session.user.id,
    });
    if (!order) throw new HttpError("Order not found", 404);

    return jsonOk(order);
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * PATCH /api/orders/:id - admin status update.
 * Body: { status, trackingNumber?, carrier? } (tracking fields apply to "shipped").
 */
export async function PATCH(request, { params }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const body = (await readJson(request)) ?? {};
    return jsonOk(
      await updateOrderStatus(id, body.status, {
        trackingNumber: body.trackingNumber,
        carrier: body.carrier,
      }),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
