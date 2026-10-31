"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { authClient, normalizeAuthError } from "@/components/auth/AuthFormShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAsyncAction } from "@/hooks/use-async-action";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { AlertTriangle } from "lucide-react";

const resetFormSchema = resetPasswordSchema
  .extend({
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") ?? "";
  const errorParam = searchParams.get("error");
  const { busy, run } = useAsyncAction();
  const invalidToken =
    errorParam === "INVALID_TOKEN" || errorParam === "invalid_token";

  const form = useForm({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { token: tokenParam, password: "", confirm: "" },
  });

  useEffect(() => {
    if (tokenParam) {
      form.setValue("token", tokenParam);
    }
  }, [tokenParam, form]);

  async function onSubmit(values) {
    if (!values.token) {
      form.setError("root", { message: "Reset link is invalid or expired." });
      return;
    }
    await run(async () => {
      try {
        const result = await authClient.resetPassword({
          newPassword: values.password,
          token: values.token,
        });
        if (result?.error) {
          form.setError("root", {
            message:
              normalizeAuthError(result.error).message ||
              "Could not reset your password.",
          });
          return;
        }
        router.push("/sign-in?reset=success");
      } catch (err) {
        form.setError("root", {
          message: normalizeAuthError(err).message || "Could not reset your password.",
        });
      }
    }, "reset");
  }

  if (invalidToken) {
    return (
      <AuthCard
        title="Reset link expired"
        description="Request a new password reset email to continue."
        footer={
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <Alert variant="destructive" className="rounded-xl">
          <AlertTriangle className="size-4" />
          <AlertTitle>Invalid or expired link</AlertTitle>
          <AlertDescription>
            This reset link is no longer valid. Request a new one from the forgot password
            page.
          </AlertDescription>
        </Alert>
        <Link
          href="/forgot-password"
          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background text-sm font-medium hover:bg-muted"
        >
          Request new reset link
        </Link>
      </AuthCard>
    );
  }

  if (!tokenParam) {
    return (
      <AuthCard
        title="Missing reset token"
        description="Open the link from your email or request a new reset."
        footer={
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <Link
          href="/forgot-password"
          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background text-sm font-medium hover:bg-muted"
        >
          Request reset link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      description="Enter a strong password for your ShopSphere account."
      footer={
        <Link
          href="/sign-in"
          className="font-medium text-primary hover:underline"
          tabIndex={busy ? -1 : undefined}
        >
          Back to sign in
        </Link>
      }
    >
      <fieldset disabled={busy} className="min-w-0 border-0 p-0">
        <form
          className="space-y-4"
          method="post"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <input type="hidden" {...form.register("token")} />
          {form.formState.errors.root ? (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          ) : null}
          <FormField
            id="password"
            label="New password"
            error={form.formState.errors.password?.message}
          >
            <PasswordInput
              id="password"
              autoComplete="new-password"
              showStrength
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
          </FormField>
          <FormField
            id="confirm"
            label="Confirm password"
            error={form.formState.errors.confirm?.message}
          >
            <PasswordInput
              id="confirm"
              autoComplete="new-password"
              aria-invalid={Boolean(form.formState.errors.confirm)}
              {...form.register("confirm")}
            />
          </FormField>
          <SubmitButton loading={busy}>Update password</SubmitButton>
        </form>
      </fieldset>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
