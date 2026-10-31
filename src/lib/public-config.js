export const publicConfig = {
  enableMagicLink: process.env.NEXT_PUBLIC_ENABLE_MAGIC_LINK === "true",
  /**
   * Optional hint only. Prefer `window.location.origin` for redirects so local
   * and Vercel never fight over NEXT_PUBLIC_APP_URL.
   */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "",
};
