"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export { authClient };

/**
 * @param {unknown} error
 * @returns {{ code?: string, status?: number, message?: string }}
 */
export function normalizeAuthError(error) {
  if (!error || typeof error !== "object") {
    return { message: "Something went wrong. Try again." };
  }
  const err = /** @type {Record<string, unknown>} */ (error);
  const code =
    typeof err.code === "string"
      ? err.code
      : typeof err.body === "object" &&
          err.body &&
          typeof /** @type {Record<string, unknown>} */ (err.body).code === "string"
        ? /** @type {Record<string, unknown>} */ (err.body).code
        : undefined;
  const status =
    typeof err.status === "number"
      ? err.status
      : typeof err.statusCode === "number"
        ? err.statusCode
        : undefined;
  const message =
    typeof err.message === "string"
      ? err.message
      : typeof err.body === "object" &&
          err.body &&
          typeof /** @type {Record<string, unknown>} */ (err.body).message === "string"
        ? /** @type {Record<string, unknown>} */ (err.body).message
        : undefined;
  return { code, status, message };
}

/**
 * @param {unknown} error
 * @returns {{ kind: "email_not_verified" | "generic" | "message", message: string }}
 */
export function mapSignInError(error) {
  const { code, status, message } = normalizeAuthError(error);
  if (
    status === 403 ||
    code === "EMAIL_NOT_VERIFIED" ||
    (message && /email not verified/i.test(message))
  ) {
    return {
      kind: "email_not_verified",
      message: "Verify your email before signing in.",
    };
  }
  return {
    kind: "generic",
    message: "Invalid email or password",
  };
}

/**
 * @param {unknown} error
 * @param {string} [fallback]
 */
export function authErrorMessage(error, fallback = "Something went wrong. Try again.") {
  const { message } = normalizeAuthError(error);
  return message || fallback;
}

/**
 * @param {{ data?: unknown, error?: unknown }} result
 */
export function hasAuthError(result) {
  return Boolean(result?.error);
}

/**
 * @param {{
 *   action: (values: Record<string, unknown>) => Promise<{ data?: unknown, error?: unknown } | void>,
 *   onSuccess?: (data?: unknown) => void | Promise<void>,
 *   successMessage?: string,
 *   mapError?: (error: unknown) => string,
 * }} options
 */
export function useAuthAction({
  action,
  onSuccess,
  successMessage,
  mapError = authErrorMessage,
}) {
  const [loading, setLoading] = useState(false);
  const busyRef = useRef(false);

  const run = async (values) => {
    if (busyRef.current) return { ok: false, error: new Error("busy") };
    busyRef.current = true;
    setLoading(true);
    try {
      const result = await action(values);
      if (result && hasAuthError(result)) {
        toast.error(mapError(result.error));
        return { ok: false, error: result.error };
      }
      if (successMessage) {
        toast.success(successMessage);
      }
      await onSuccess?.(result?.data);
      return { ok: true, data: result?.data };
    } catch (err) {
      const message = mapError(err);
      toast.error(message);
      return { ok: false, error: err };
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  };

  return { loading, run };
}
