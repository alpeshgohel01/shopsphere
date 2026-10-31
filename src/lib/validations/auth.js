import { z } from "zod";
import { normalizeEmail } from "@/lib/email/normalize";

/** Very common passwords blocked at signup / reset / change. */
export const COMMON_PASSWORDS = new Set(
  [
    "password",
    "password1",
    "password123",
    "12345678",
    "123456789",
    "1234567890",
    "qwerty123",
    "qwertyui",
    "letmein1",
    "welcome1",
    "admin123",
    "iloveyou",
    "monkey12",
    "dragon12",
    "baseball",
    "football",
    "abc12345",
    "passw0rd",
    "login123",
    "master12",
    "sunshine",
    "princess",
    "starwars",
    "whatever",
    "trustno1",
  ].map((p) => p.toLowerCase()),
);

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .transform(normalizeEmail);

/**
 * Password policy: 8"128 chars, at least one letter and one number, not common.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .refine((value) => /[A-Za-z]/.test(value), {
    message: "Password must include at least one letter",
  })
  .refine((value) => /[0-9]/.test(value), {
    message: "Password must include at least one number",
  })
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), {
    message: "This password is too common. Choose a stronger one.",
  });

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(128),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
  image: z
    .string()
    .trim()
    .url("Enter a valid image URL")
    .max(2048)
    .optional()
    .or(z.literal("")),
});

export const changeEmailSchema = z.object({
  newEmail: emailSchema,
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

/**
 * @param {import("zod").ZodSchema} schema
 * @param {unknown} data
 * @returns {{ ok: true, data: unknown } | { ok: false, error: string, fieldErrors?: Record<string, string> }}
 */
export function parseOrError(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }

  /** @type {Record<string, string>} */
  const fieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }

  return {
    ok: false,
    error: result.error.issues[0]?.message ?? "Invalid input",
    fieldErrors,
  };
}
