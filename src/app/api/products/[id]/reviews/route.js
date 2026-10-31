import { HttpError, handleRouteError, jsonOk } from "@/lib/shop/api";
import { createReview, listReviews } from "@/lib/shop/reviews";
import { readJson, requireApiUser } from "@/lib/shop/guards";

/** GET /api/products/:id/reviews?page=&limit= - public list. */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const sp = request.nextUrl.searchParams;
    return jsonOk(
      await listReviews(id, {
        page: sp.get("page") ?? undefined,
        limit: sp.get("limit") ?? undefined,
      }),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

/** POST /api/products/:id/reviews - signed-in purchaser creates a review. */
export async function POST(request, { params }) {
  try {
    const session = await requireApiUser();
    const { id } = await params;
    const body = await readJson(request);
    if (!body || typeof body !== "object") {
      throw new HttpError("Invalid request body", 400);
    }

    const review = await createReview({
      userId: session.user.id,
      rating: body.rating,
      comment: body.comment,
      productId: id,
    });
    return jsonOk(review, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
