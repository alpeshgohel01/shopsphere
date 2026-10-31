"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormField } from "@/components/auth/FormField";
import { OrDivider } from "@/components/auth/OrDivider";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { SubmitButton } from "@/components/auth/SubmitButton";
import {
  authClient,
  authErrorMessage,
  mapSignInError,
  normalizeAuthError,
} from "@/components/auth/AuthFormShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAsyncAction } from "@/hooks/use-async-action";
import { publicConfig } from "@/lib/public-config";
import { sanitizeCallbackUrl } from "@/lib/url/callback-url";
import { magicLinkSchema, signInSchema } from "@/lib/validations/auth";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));
  const { busy, actionKey, run } = useAsyncAction();
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);

  const passwordForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const magicForm = useForm({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "" },
  });

  async function onPasswordSubmit(values) {
    await run(async () => {
      setUnverifiedEmail(null);
      try {
        const result = await authClient.signIn.email({
          email: values.email,
          password: values.password,
          callbackURL: callbackUrl,
        });
        if (result?.error) {
          const mapped = mapSignInError(result.error);
          if (mapped.kind === "email_not_verified") {
            setUnverifiedEmail(values.email);
            passwordForm.setError("root", { message: mapped.message });
          } else {
            passwordForm.setError("root", { message: mapped.message });
          }
          return;
        }
        router.push(callbackUrl);
        router.refresh();
      } catch (err) {
        const mapped = mapSignInError(err);
        if (mapped.kind === "email_not_verified") {
          setUnverifiedEmail(values.email);
        }
        passwordForm.setError("root", {
          message:
            mapped.kind === "generic"
              ? mapped.message
              : normalizeAuthError(err).message || "Something went wrong.",
        });
      }
    }, "password");
  }

  async function onMagicSubmit(values) {
    await run(async () => {
      try {
        const result = await authClient.signIn.magicLink({
          email: values.email,
          callbackURL: callbackUrl,
        });
        if (result?.error) {
          magicForm.setError("root", {
            message:
              normalizeAuthError(result.error).message || "Could not send magic link.",
          });
          return;
        }
        router.push(`/check-email?email=${encodeURIComponent(values.email)}&type=magic`);
      } catch (err) {
        magicForm.setError("root", {
          message: normalizeAuthError(err).message || "Could not send magic link.",
        });
      }
    }, "magic");
  }

  async function handleSocial(provider) {
    await run(
      async () => {
        const result = await authClient.signIn.social({
          provider,
          callbackURL: callbackUrl,
        });
        if (result?.error) {
          toast.error(
            authErrorMessage(result.error, "Could not continue with social sign-in."),
          );
          return false;
        }
        return true;
      },
      { key: provider, keepBusy: true },
    );
  }

  const passwordFields = (
    <fieldset disabled={busy} className="min-w-0 space-y-4 border-0 p-0">
      <form
        className="space-y-4"
        method="post"
        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
        noValidate
      >
        {passwordForm.formState.errors.root ? (
          <Alert variant="destructive" className="rounded-xl">
            <AlertTitle>Sign-in failed</AlertTitle>
            <AlertDescription>{passwordForm.formState.errors.root.message}</AlertDescription>
          </Alert>
        ) : null}
        {unverifiedEmail ? (
          <Alert className="rounded-xl border-border/80">
            <AlertTitle>Email not verified</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Check your inbox or resend the verification email.</p>
              <Link
                href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="font-medium text-primary hover:underline"
              >
                Go to verification page
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}
        <FormField
          id="email"
          label="Email"
          error={passwordForm.formState.errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(passwordForm.formState.errors.email)}
            {...passwordForm.register("email")}
          />
        </FormField>
        <FormField
          id="password"
          label="Password"
          error={passwordForm.formState.errors.password?.message}
        >
          <div className="space-y-2">
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={Boolean(passwordForm.formState.errors.password)}
              {...passwordForm.register("password")}
            />
            <p className="text-right text-xs">
              <Link
                href="/forgot-password"
                className="font-medium text-primary hover:underline"
                tabIndex={busy ? -1 : undefined}
              >
                Forgot password?
              </Link>
            </p>
          </div>
        </FormField>
        <SubmitButton loading={actionKey === "password"}>
          Continue to ShopSphere
        </SubmitButton>
      </form>
    </fieldset>
  );

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Sign in"
      description="Access your bag, orders, and wishlist in one place."
      footer={
        <>
          New here?{" "}
          <Link
            href="/sign-up"
            className="font-semibold text-primary underline-offset-4 hover:underline"
            tabIndex={busy ? -1 : undefined}
          >
            Create an account
          </Link>
        </>
      }
    >
      <SocialButtons
        callbackURL={callbackUrl}
        loading={
          actionKey === "google" || actionKey === "github" ? actionKey : null
        }
        disabled={busy}
        onGoogle={() => handleSocial("google")}
        onGitHub={() => handleSocial("github")}
      />
      <OrDivider />
      {publicConfig.enableMagicLink ? (
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="mb-4 w-full rounded-xl">
            <TabsTrigger value="password" className="flex-1 rounded-lg" disabled={busy}>
              Password
            </TabsTrigger>
            <TabsTrigger value="magic" className="flex-1 rounded-lg" disabled={busy}>
              Magic link
            </TabsTrigger>
          </TabsList>
          <TabsContent value="password">{passwordFields}</TabsContent>
          <TabsContent value="magic">
            <fieldset disabled={busy} className="min-w-0 space-y-4 border-0 p-0">
              <form
                className="space-y-4"
                onSubmit={magicForm.handleSubmit(onMagicSubmit)}
                noValidate
              >
                {magicForm.formState.errors.root ? (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription>
                      {magicForm.formState.errors.root.message}
                    </AlertDescription>
                  </Alert>
                ) : null}
                <FormField
                  id="magic-email"
                  label="Email"
                  error={magicForm.formState.errors.email?.message}
                >
                  <Input
                    id="magic-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    {...magicForm.register("email")}
                  />
                </FormField>
                <SubmitButton loading={actionKey === "magic"}>
                  Email me a sign-in link
                </SubmitButton>
              </form>
            </fieldset>
          </TabsContent>
        </Tabs>
      ) : (
        passwordFields
      )}
    </AuthCard>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
