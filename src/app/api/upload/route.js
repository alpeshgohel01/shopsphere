import { HttpError, handleRouteError, jsonOk } from "@/lib/shop/api";
import { readJson, requireApiAdmin } from "@/lib/shop/guards";
import { isCloudinaryConfigured, uploadImage } from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];
const DATA_URI = /^data:(image\/(?:png|jpe?g|webp|gif|avif));base64,([A-Za-z0-9+/=\s]+)$/;
const UNSPLASH_HOSTS = new Set([
  "images.unsplash.com",
  "plus.unsplash.com",
  "source.unsplash.com",
]);

const NOT_CONFIGURED =
  "Image uploads are not configured. Provide an Unsplash image URL as { url } instead.";

/** @param {string} value */
function parseHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/upload - admin only. Accepts:
 *  - multipart/form-data with a `file` field
 *  - JSON { image: "data:image/png;base64,..." }  (base64 data URI)
 *  - JSON { url: "https://..." }  (Unsplash URLs pass straight through; other
 *    URLs are imported into Cloudinary when it is configured)
 * Returns { data: { url, publicId } }.
 */
export async function POST(request) {
  try {
    await requireApiAdmin();

    const contentType = request.headers.get("content-type") || "";

    // ---- multipart file upload ----
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData().catch(() => null);
      const file = form?.get("file");
      if (!file || typeof file === "string") {
        throw new HttpError("A `file` field is required", 400);
      }
      if (!IMAGE_TYPES.includes(file.type)) {
        throw new HttpError("Unsupported image type", 415);
      }
      if (file.size > MAX_BYTES) {
        throw new HttpError("Image is too large (max 5 MB)", 413);
      }
      if (!isCloudinaryConfigured()) throw new HttpError(NOT_CONFIGURED, 503);

      const result = await uploadImage(file);
      return jsonOk(result, 201);
    }

    // ---- JSON: base64 data URI or URL ----
    const body = (await readJson(request)) ?? {};

    if (typeof body.image === "string") {
      const match = DATA_URI.exec(body.image);
      if (!match) throw new HttpError("`image` must be a base64 image data URI", 400);
      // base64 expands data by ~4/3
      if ((match[2].length * 3) / 4 > MAX_BYTES) {
        throw new HttpError("Image is too large (max 5 MB)", 413);
      }
      if (!isCloudinaryConfigured()) throw new HttpError(NOT_CONFIGURED, 503);

      const result = await uploadImage(body.image);
      return jsonOk(result, 201);
    }

    if (typeof body.url === "string") {
      const url = parseHttpUrl(body.url.trim());
      if (!url) throw new HttpError("`url` must be a valid http(s) URL", 400);

      if (UNSPLASH_HOSTS.has(url.hostname)) {
        return jsonOk({ url: url.toString(), publicId: "" });
      }
      if (!isCloudinaryConfigured()) {
        throw new HttpError(
          "Only Unsplash image URLs are accepted while uploads are not configured",
          400,
        );
      }
      const result = await uploadImage(url.toString());
      return jsonOk(result, 201);
    }

    throw new HttpError("Provide a `file` (multipart), `image` (base64) or `url`", 400);
  } catch (err) {
    return handleRouteError(err);
  }
}
