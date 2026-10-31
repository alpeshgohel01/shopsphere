import "server-only";
import "@/env";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { nextCookies } from "better-auth/next-js";
import { magicLink, haveIBeenPwned } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { getDbSync, getMongoClientSync } from "@/lib/db";
import {
  sendVerificationEmailMessage,
  sendResetPasswordEmailMessage,
  sendMagicLinkEmailMessage,
  sendChangeEmailConfirmationMessage,
} from "@/lib/email";
import { normalizeEmail } from "@/lib/email/normalize";
import { passwordSchema } from "@/lib/validations/auth";
import {
  ENABLE_MAGIC_LINK,
  buildSocialProviders,
} from "@/lib/auth-features";
import {
  resolveAppUrl,
  resolveTrustedOrigins,
  rewriteToAppOrigin,
} from "@/lib/app-url";
import { logger } from "@/lib/logger";

const appUrl = resolveAppUrl();

/**
 * @param {string | undefined} password
 */
function assertPasswordPolicy(password) {
  if (!password) return;
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    throw new APIError("BAD_REQUEST", {
      message: parsed.error.issues[0]?.message ?? "Invalid password",
    });
  }
}

const client = getMongoClientSync();
const db = getDbSync();
const database = mongodbAdapter(db, { client });

const socialProviders = buildSocialProviders(process.env);

/** @type {unknown[]} */
const plugins = [
  haveIBeenPwned({
    customPasswordCompromisedMessage:
      "This password has appeared in a data breach. Choose a different one.",
  }),
];

if (ENABLE_MAGIC_LINK) {
  plugins.push(
    magicLink({
      expiresIn: 60 * 5,
      storeToken: "hashed",
      sendMagicLink: async ({ email, url }) => {
        const link = rewriteToAppOrigin(url);
        if (process.env.NODE_ENV !== "production") {
          console.info(`\n[ShopSphere auth] magic-link for ${email}:\n${link}\n`);
        }
        const result = await sendMagicLinkEmailMessage({ to: email, url: link });
        if (!result?.ok) {
          logger.error("Magic link email not delivered", {
            error: result?.error ?? "unknown",
          });
          // Surface failure to the client instead of a false "sent" success.
          throw new Error(result?.error || "Failed to send magic link email");
        }
      },
    }),
  );
}

plugins.push(nextCookies());

export const auth = betterAuth({
  appName: "ShopSphere",
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database,
  trustedOrigins: resolveTrustedOrigins(),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      const link = rewriteToAppOrigin(url);
      // Log first so local testing works even if the provider fails.
      if (process.env.NODE_ENV !== "production") {
        console.info(`\n[ShopSphere auth] reset-password link for ${user.email}:\n${link}\n`);
      }
      try {
        await sendResetPasswordEmailMessage({
          to: user.email,
          name: user.name,
          url: link,
        });
      } catch (error) {
        logger.error("Failed to send reset password email", {
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    },
    customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
      ...coreFields,
      role: "user",
      ...additionalFields,
      id,
    }),
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const link = rewriteToAppOrigin(url);
      if (process.env.NODE_ENV !== "production") {
        console.info(`\n[ShopSphere auth] verification link for ${user.email}:\n${link}\n`);
      }
      try {
        await sendVerificationEmailMessage({
          to: user.email,
          name: user.name,
          url: link,
        });
      } catch (error) {
        logger.error("Failed to send verification email", {
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    },
  },
  socialProviders,
  account: {
    accountLinking: {
      enabled: true,
      requireLocalEmailVerified: true,
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
        required: false,
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        const link = rewriteToAppOrigin(url);
        if (process.env.NODE_ENV !== "production") {
          console.info(`\n[ShopSphere auth] change-email link for ${user.email}:\n${link}\n`);
        }
        try {
          await sendChangeEmailConfirmationMessage({
            to: user.email,
            name: user.name,
            newEmail,
            url: link,
          });
        } catch (error) {
          logger.error("Failed to send change-email confirmation", {
            error: error instanceof Error ? error.message : "unknown",
          });
        }
      },
    },
    deleteUser: {
      enabled: true,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    database: {
      joins: true,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            email: normalizeEmail(user.email),
            role: user.role === "admin" ? "admin" : "user",
          },
        }),
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const path = ctx.path || "";

      if (path === "/sign-up/email" && ctx.body?.password) {
        assertPasswordPolicy(ctx.body.password);
        if (ctx.body.email) {
          ctx.body.email = normalizeEmail(ctx.body.email);
        }
      }

      if (path === "/sign-in/email" && ctx.body?.email) {
        ctx.body.email = normalizeEmail(ctx.body.email);
      }

      if (
        (path === "/reset-password" || path === "/change-password") &&
        (ctx.body?.newPassword || ctx.body?.password)
      ) {
        assertPasswordPolicy(ctx.body.newPassword || ctx.body.password);
      }

      if (
        (path === "/forget-password" ||
          path === "/request-password-reset" ||
          path === "/send-verification-email") &&
        ctx.body?.email
      ) {
        ctx.body.email = normalizeEmail(ctx.body.email);
      }
    }),
  },
  onAPIError: {
    onError(error) {
      logger.warn("Auth API error", {
        message: error instanceof Error ? error.message : "unknown",
      });
    },
  },
  plugins,
});
