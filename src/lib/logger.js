import "server-only";

/**
 * @typedef {"debug"|"info"|"warn"|"error"} LogLevel
 */

const SENSITIVE = /password|token|secret|authorization|cookie|session/i;

/**
 * Redact sensitive keys from objects before logging.
 * @param {unknown} value
 * @returns {unknown}
 */
function redact(value) {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redact);

  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE.test(key)) {
      out[key] = "[redacted]";
    } else if (val && typeof val === "object") {
      out[key] = redact(val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

/**
 * @param {LogLevel} level
 * @param {string} message
 * @param {Record<string, unknown>} [meta]
 */
function log(level, message, meta) {
  const payload = meta ? { message, .../** @type {object} */ (redact(meta)) } : { message };
  const line = JSON.stringify({ level, time: new Date().toISOString(), ...payload });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message, meta) => log("debug", message, meta),
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta),
};
