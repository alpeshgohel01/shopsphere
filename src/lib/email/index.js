import "server-only";
import { render } from "@react-email/components";
import { VerificationEmail } from "@/emails/VerificationEmail";
import { ResetPasswordEmail } from "@/emails/ResetPasswordEmail";
import { MagicLinkEmail } from "@/emails/MagicLinkEmail";
import { ChangeEmailConfirmation } from "@/emails/ChangeEmailConfirmation";
import { OrderConfirmationEmail } from "@/emails/OrderConfirmationEmail";
import { createResendProvider } from "@/lib/email/resend";
import { recordDevEmail } from "@/lib/email/dev-store";
import { logger } from "@/lib/logger";
import { normalizeEmail } from "@/lib/email/normalize";

/** @type {import("./interface.js").EmailProvider | null} */
let provider = null;

/**
 * @returns {import("./interface.js").EmailProvider}
 */
export function getEmailProvider() {
  if (!provider) {
    provider = createResendProvider();
  }
  return provider;
}

/** Inject provider for tests / SMTP swap. */
export function setEmailProvider(next) {
  provider = next;
}

/**
 * @param {import("./interface.js").SendEmailInput & { kind?: string, url?: string }} input
 */
export async function sendEmail(input) {
  const to = normalizeEmail(input.to);
  const isDev = process.env.NODE_ENV !== "production";
  const hasKey = Boolean(process.env.RESEND_API_KEY);

  if (isDev && !hasKey) {
    logger.info("Email (dev console -- RESEND_API_KEY missing)", {
      to,
      subject: input.subject,
      kind: input.kind,
      url: input.url,
    });
    if (input.url) {
      console.info(
        `\n[ShopSphere auth] ${input.kind ?? "email"} link for ${to}:\n${input.url}\n`,
      );
    }
    recordDevEmail({
      to,
      subject: input.subject,
      url: input.url,
      kind: input.kind ?? "email",
    });
    return { ok: true, id: "dev-console" };
  }

  const result = await getEmailProvider().send({
    to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (isDev) {
    recordDevEmail({
      to,
      subject: input.subject,
      url: input.url,
      kind: input.kind ?? "email",
    });
    if (input.url) {
      console.info(
        `\n[ShopSphere auth] ${input.kind ?? "email"} link for ${to}:\n${input.url}\n` +
          `(Resend: ${result.ok ? "sent" : `FAILED -- ${result.error}`})\n`,
      );
    }
    if (!result.ok) {
      logger.error(
        "Email provider failed in development; use console link above",
        {
          to,
          kind: input.kind,
          error: result.error,
        },
      );
    }
  }

  return result;
}

/**
 * @param {{ to: string, name?: string, url: string }} opts
 */
export async function sendVerificationEmailMessage(opts) {
  const html = await render(
    VerificationEmail({ name: opts.name, verifyUrl: opts.url }),
  );
  return sendEmail({
    to: opts.to,
    subject: "Verify your email - ShopSphere",
    html,
    text: `Verify your email: ${opts.url}`,
    kind: "verification",
    url: opts.url,
  });
}

/**
 * @param {{ to: string, name?: string, url: string }} opts
 */
export async function sendResetPasswordEmailMessage(opts) {
  const html = await render(
    ResetPasswordEmail({ name: opts.name, resetUrl: opts.url }),
  );
  return sendEmail({
    to: opts.to,
    subject: "Reset your password - ShopSphere",
    html,
    text: `Reset your password: ${opts.url}`,
    kind: "reset-password",
    url: opts.url,
  });
}

/**
 * @param {{ to: string, url: string }} opts
 */
export async function sendMagicLinkEmailMessage(opts) {
  const html = await render(MagicLinkEmail({ magicUrl: opts.url }));
  return sendEmail({
    to: opts.to,
    subject: "Your sign-in link - ShopSphere",
    html,
    text: `Sign in: ${opts.url}`,
    kind: "magic-link",
    url: opts.url,
  });
}

/**
 * @param {{ to: string, name?: string, newEmail: string, url: string }} opts
 */
export async function sendChangeEmailConfirmationMessage(opts) {
  const html = await render(
    ChangeEmailConfirmation({
      name: opts.name,
      newEmail: opts.newEmail,
      confirmUrl: opts.url,
    }),
  );
  return sendEmail({
    to: opts.to,
    subject: "Confirm email change - ShopSphere",
    html,
    text: `Confirm email change to ${opts.newEmail}: ${opts.url}`,
    kind: "change-email",
    url: opts.url,
  });
}

/**
 * @param {{ to: string, name?: string, order: object, orderUrl: string, demo?: boolean }} opts
 */
export async function sendOrderConfirmationEmailMessage(opts) {
  const { order } = opts;
  const html = await render(
    OrderConfirmationEmail({
      name: opts.name,
      orderNumber: order.orderNumber,
      items: order.items,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      tax: order.tax,
      total: order.total,
      orderUrl: opts.orderUrl,
      demo: opts.demo,
    }),
  );
  return sendEmail({
    to: opts.to,
    subject: `Order ${order.orderNumber} confirmed - ShopSphere`,
    html,
    text: `Thanks for your order ${order.orderNumber}. View it here: ${opts.orderUrl}`,
    kind: "order-confirmation",
    url: opts.orderUrl,
  });
}