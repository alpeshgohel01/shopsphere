import { handleRouteError, jsonOk } from "@/lib/shop/api";
import { listOrdersAdmin, listOrdersForUser } from "@/lib/shop/orders";
import { requireApiUser } from "@/lib/shop/guards";
import { hasRole } from "@/lib/session";

/**
 * GET /api/orders?page=&limit=
 * Returns the signed-in user's orders. Admins can pass ?all=true (plus
 * optional ?status= and ?q=) to list every order.
 */
export async function GET(request) {
  try {
    const session = await requireApiUser();
    const query = Object.fromEntries(request.nextUrl.searchParams);

    if (query.all === "true" && hasRole(session, "admin")) {
      return jsonOk(await listOrdersAdmin(query));
    }
    return jsonOk(await listOrdersForUser(session.user.id, query));
  } catch (err) {
    return handleRouteError(err);
  }
}
