"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { authClient, normalizeAuthError } from "@/components/auth/AuthFormShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useAsyncAction } from "@/hooks/use-async-action";
import { resendVerificationSchema } from "@/lib/validations/auth";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

const COOLDOWN_SECONDS = 60;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const [cooldown, setCooldown] = useState(0);
  const { busy, run } = useAsyncAction();

  const form = useForm({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: emailFromQuery },
  });

  useEffect(() => {
    if (emailFromQuery) {
      form.setValue("email", emailFromQuery);
    }
  }, [emailFromQuery, form]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function onSubmit(values) {
    await run(async () => {
      try {
        const result = await authClient.sendVerificationEmail({
          email: values.email,
          callbackURL: "/",
        });
        if (result?.error) {
          toast.error(
            normalizeAuthError(result.error).message ||
              "Could not send verification email.",
          );
          return;
        }
        toast.success("Verification email sent.");
        setCooldown(COOLDOWN_SECONDS);
      } catch (err) {
        toast.error(
          normalizeAuthError(err).message || "Could not send verification email.",
        );
      }
    }, "verify");
  }

  return (
    <AuthCard
      title="Verify your email"
      description="We sent a confirmation link to your inbox."
      footer={
        <Link
          href="/sign-in"
          className="font-medium text-primary hover:underline"
          tabIndex={busy ? -1 : undefined}
        >
          Return to sign in
        </Link>
      }
    >
      <Alert className="rounded-xl border-border/80">
        <MailCheck className="size-4" />
        <AlertTitle>Check your inbox</AlertTitle>
        <AlertDescription>
          Click the link in the email to activate your account. The link expires in 24
          hours.
        </AlertDescription>
      </Alert>
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
              {...form.register("email")}
            />
          </FormField>
          <SubmitButton
            type="submit"
            loading={busy}
            disabled={cooldown > 0}
            variant="outline"
          >
            {cooldown > 0
              ? `Resend available in ${cooldown}s`
              : "Resend verification email"}
          </SubmitButton>
        </form>
      </fieldset>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
