"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  normalizeAuthError,
} from "@/components/auth/AuthFormShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useAsyncAction } from "@/hooks/use-async-action";
import { signUpSchema } from "@/lib/validations/auth";

export default function SignUpPage() {
  const router = useRouter();
  const { busy, actionKey, run } = useAsyncAction();

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values) {
    await run(async () => {
      try {
        const result = await authClient.signUp.email({
          name: values.name,
          email: values.email,
          password: values.password,
          callbackURL: "/",
        });
        if (result?.error) {
          form.setError("root", {
            message:
              normalizeAuthError(result.error).message ||
              "Could not create your account. Try again.",
          });
          return;
        }
        router.push(`/check-email?email=${encodeURIComponent(values.email)}&type=verify`);
      } catch (err) {
        form.setError("root", {
          message: normalizeAuthError(err).message || "Could not create your account.",
        });
      }
    }, "signup");
  }

  async function handleSocial(provider) {
    await run(
      async () => {
        const result = await authClient.signIn.social({
          provider,
          callbackURL: "/",
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

  return (
    <AuthCard
      eyebrow="Join ShopSphere"
      title="Create account"
      description="Track orders, save favourites, and checkout faster."
      footer={
        <>
          Already a member?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-primary underline-offset-4 hover:underline"
            tabIndex={busy ? -1 : undefined}
          >
            Sign in
          </Link>
        </>
      }
    >
      <SocialButtons
        callbackURL="/"
        loading={
          actionKey === "google" || actionKey === "github" ? actionKey : null
        }
        disabled={busy}
        onGoogle={() => handleSocial("google")}
        onGitHub={() => handleSocial("github")}
      />
      <OrDivider />
      <fieldset disabled={busy} className="min-w-0 border-0 p-0">
        <form
          className="space-y-4"
          method="post"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          {form.formState.errors.root ? (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          ) : null}
          <FormField id="name" label="Full name" error={form.formState.errors.name?.message}>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Alex Morgan"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
          </FormField>
          <FormField id="email" label="Work email" error={form.formState.errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
          </FormField>
          <FormField
            id="password"
            label="Password"
            error={form.formState.errors.password?.message}
            hint="Use 8+ characters with letters, numbers, and symbols."
          >
            <PasswordInput
              id="password"
              autoComplete="new-password"
              showStrength
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
          </FormField>
          <SubmitButton loading={actionKey === "signup"}>Create account</SubmitButton>
        </form>
      </fieldset>
    </AuthCard>
  );
}
