"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { authClient } from "@/components/auth/AuthFormShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useAsyncAction } from "@/hooks/use-async-action";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const { busy, run } = useAsyncAction();

  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values) {
    await run(async () => {
      try {
        // Always use the site the user is on (local or Vercel) - never a baked env URL.
        const redirectTo = `${window.location.origin}/reset-password`;
        await authClient.requestPasswordReset({
          email: values.email,
          redirectTo,
        });
      } catch {
        // Always show success to avoid account enumeration.
      } finally {
        setSubmitted(true);
      }
    }, "forgot");
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Well email you a secure link to choose a new password."
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
      {submitted ? (
        <Alert className="rounded-xl border-border/80">
          <MailCheck className="size-4" />
          <AlertTitle>Check your email</AlertTitle>
          <AlertDescription>
            If an account exists for that address, we sent password reset instructions.
          </AlertDescription>
        </Alert>
      ) : (
        <fieldset disabled={busy} className="min-w-0 border-0 p-0">
          <form
            className="space-y-4"
            method="post"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <FormField id="email" label="Email" error={form.formState.errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
            </FormField>
            <SubmitButton loading={busy}>Send reset link</SubmitButton>
          </form>
        </fieldset>
      )}
    </AuthCard>
  );
}
