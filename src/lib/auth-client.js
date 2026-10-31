"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

const enableMagicLink =
  process.env.NEXT_PUBLIC_ENABLE_MAGIC_LINK === "true";

/**
 * No fixed baseURL - same origin as the page (localhost or Vercel).
 * Avoids "Failed to fetch" when NEXT_PUBLIC_APP_URL points elsewhere.
 */
export const authClient = createAuthClient({
  plugins: enableMagicLink ? [magicLinkClient()] : [],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
  changePassword,
  changeEmail,
  updateUser,
  deleteUser,
  linkSocial,
  unlinkAccount,
  listAccounts,
  revokeSessions,
  revokeOtherSessions,
} = authClient;
