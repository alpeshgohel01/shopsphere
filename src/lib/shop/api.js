import { ZodError } from "zod";

/**
 * Error carrying an HTTP status. Thrown by shop server functions and
 * converted to a JSON response by handleRouteError().
 */
export class HttpError extends Error {
  /**
   * @param {string} message
   * @param {number} [status]
   */
  constructor(message, status = 400) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/**
 * @param {unknown} data
 * @param {number} [status]
 */
export function jsonOk(data, status = 200) {
  return Response.json({ ok: true, data }, { status });
}

/**
 * @param {string} message
 * @param {number} [status]
 * @param {unknown} [details]
 */
export function jsonError(message, status = 400, details) {
  return Response.json(
    { ok: false, error: message, ...(details ? { details } : {}) },
    { status },
  );
}

/**
 * Convert any thrown value into a JSON error response.
 * @param {unknown} err
 */
export function handleRouteError(err) {
  if (err instanceof HttpError) {
    return jsonError(err.message, err.status);
  }
  if (err instanceof ZodError) {
    return jsonError(
      err.issues[0]?.message ?? "Invalid input",
      400,
      err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }
  console.error("[shop] unexpected error", err);
  return jsonError("Something went wrong", 500);
}
