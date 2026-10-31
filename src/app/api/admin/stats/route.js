import { handleRouteError, jsonOk } from "@/lib/shop/api";
import { requireApiAdmin } from "@/lib/shop/guards";
import { getAdminStats } from "@/lib/shop/stats";

/** GET /api/admin/stats - revenue, counts, 30-day sales by day, low stock. */
export async function GET() {
  try {
    await requireApiAdmin();
    return jsonOk(await getAdminStats());
  } catch (err) {
    return handleRouteError(err);
  }
}
