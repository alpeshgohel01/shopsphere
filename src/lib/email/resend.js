import "server-only";
import { Resend } from "resend";
import { logger } from "@/lib/logger";

/**
 * Resend email provider. Swap for SMTP by implementing the EmailProvider interface.
 * @returns {import("./interface.js").EmailProvider}
 */
export function createResendProvider() {
  const apiKey = process.env.RESEND_API_KEY;

  return {
    async send({ to, subject, html, text }) {
      if (!apiKey) {
        return { ok: false, error: "RESEND_API_KEY is not configured" };
      }

      try {
        const resend = new Resend(apiKey);
        // Prefer env; never fall back to a personal Gmail address as "from".
        let from = process.env.EMAIL_FROM || "ShopSphere <onboarding@resend.dev>";
        if (/@gmail\.com>?$/i.test(from) || /@googlemail\.com>?$/i.test(from)) {
          logger.warn("EMAIL_FROM looks like Gmail; using Resend test sender instead");
          from = "ShopSphere <onboarding@resend.dev>";
        }
        const { data, error } = await resend.emails.send({
          from,
          to,
          subject,
          html,
          text,
        });

        if (error) {
          logger.error("Resend send failed", { message: error.message });
          return { ok: false, error: error.message };
        }

        return { ok: true, id: data?.id };
      } catch (error) {
        logger.error("Resend send exception", {
          error: error instanceof Error ? error.message : "unknown",
        });
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Email send failed",
        };
      }
    },
  };
}
