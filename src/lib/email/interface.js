/**
 * @typedef {object} SendEmailInput
 * @property {string} to
 * @property {string} subject
 * @property {string} html
 * @property {string} [text]
 */

/**
 * @typedef {object} EmailProvider
 * @property {(input: SendEmailInput) => Promise<{ ok: true, id?: string } | { ok: false, error: string }>} send
 */
