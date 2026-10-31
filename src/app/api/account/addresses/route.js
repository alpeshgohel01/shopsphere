import { HttpError, handleRouteError, jsonOk } from "@/lib/shop/api";
import { deleteAddress, getProfile, upsertAddress } from "@/lib/shop/profiles";
import { readJson, requireApiUser } from "@/lib/shop/guards";

/** GET /api/account/addresses - saved addresses. */
export async function GET() {
  try {
    const session = await requireApiUser();
    const profile = await getProfile(session.user.id);
    return jsonOk(profile.addresses);
  } catch (err) {
    return handleRouteError(err);
  }
}

const sameLabel = (a, label) =>
  typeof label === "string" &&
  a.label.toLowerCase() === label.trim().toLowerCase();

/** POST /api/account/addresses - add a new address (label must be unique). */
export async function POST(request) {
  try {
    const session = await requireApiUser();
    const body = (await readJson(request)) ?? {};

    const profile = await getProfile(session.user.id);
    if (profile.addresses.some((a) => sameLabel(a, body.label))) {
      throw new HttpError("An address with this label already exists", 409);
    }
    return jsonOk(await upsertAddress(session.user.id, body), 201);
  } catch (err) {
    return handleRouteError(err);
  }
}

/** PUT /api/account/addresses - update the address matching body.label. */
export async function PUT(request) {
  try {
    const session = await requireApiUser();
    const body = (await readJson(request)) ?? {};

    const profile = await getProfile(session.user.id);
    if (!profile.addresses.some((a) => sameLabel(a, body.label))) {
      throw new HttpError("Address not found", 404);
    }
    return jsonOk(await upsertAddress(session.user.id, body));
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * DELETE /api/account/addresses - remove an address.
 * Label via JSON body { label } or ?label= query. Returns remaining addresses.
 */
export async function DELETE(request) {
  try {
    const session = await requireApiUser();
    const queryLabel = new URL(request.url).searchParams.get("label");
    const body = queryLabel ? { label: queryLabel } : ((await readJson(request)) ?? {});
    return jsonOk(await deleteAddress(session.user.id, body));
  } catch (err) {
    return handleRouteError(err);
  }
}
