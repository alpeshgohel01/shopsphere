import "server-only";
import { createHash } from "node:crypto";

/**
 * Minimal Cloudinary helper using the REST API (no SDK dependency).
 * Env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
 * Optional: CLOUDINARY_FOLDER (default "shopsphere").
 */

export class CloudinaryNotConfiguredError extends Error {
  constructor() {
    super(
      "Cloudinary is not configured: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET",
    );
    this.name = "CloudinaryNotConfiguredError";
  }
}

function getConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: process.env.CLOUDINARY_FOLDER || "shopsphere",
  };
}

export function isCloudinaryConfigured() {
  return getConfig() !== null;
}

/**
 * @param {Record<string, string | number>} params
 * @param {string} apiSecret
 */
function sign(params, apiSecret) {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

/**
 * Signed parameters for a direct browser -> Cloudinary upload.
 * POST them (plus `file`) as multipart form data to `uploadUrl`.
 * Throws CloudinaryNotConfiguredError when env vars are missing.
 *
 * @param {{ folder?: string }} [options]
 */
export function getUploadSignature({ folder } = {}) {
  const config = getConfig();
  if (!config) throw new CloudinaryNotConfiguredError();

  const timestamp = Math.floor(Date.now() / 1000);
  const targetFolder = folder || config.folder;
  const signature = sign({ folder: targetFolder, timestamp }, config.apiSecret);

  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    timestamp,
    folder: targetFolder,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
  };
}

/**
 * Upload an image server-side (data URI, remote URL, or Blob/File).
 * Returns null when Cloudinary is not configured (uploads are optional).
 *
 * @param {string | Blob} file
 * @param {{ folder?: string }} [options]
 * @returns {Promise<{ url: string, publicId: string } | null>}
 */
export async function uploadImage(file, { folder } = {}) {
  const config = getConfig();
  if (!config) return null;

  const sig = getUploadSignature({ folder });
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  const res = await fetch(sig.uploadUrl, { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message || `Cloudinary upload failed (${res.status})`);
  }
  return { url: json.secure_url, publicId: json.public_id };
}

/**
 * Delete an image by public id. Returns null when Cloudinary is not configured.
 * @param {string} publicId
 * @returns {Promise<boolean | null>}
 */
export async function deleteImage(publicId) {
  const config = getConfig();
  if (!config) return null;
  if (!publicId) return false;

  const timestamp = Math.floor(Date.now() / 1000);
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", config.apiKey);
  form.append("timestamp", String(timestamp));
  form.append(
    "signature",
    sign({ public_id: publicId, timestamp }, config.apiSecret),
  );

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
    { method: "POST", body: form },
  );
  const json = await res.json().catch(() => ({}));
  return res.ok && json.result === "ok";
}
