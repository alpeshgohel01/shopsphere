"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  KeyRound,
  Link2,
  Loader2,
  LogOut,
  Mail,
  Shield,
  Trash2,
  Unlink,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { authClient, authErrorMessage } from "@/components/auth/AuthFormShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  changeEmailSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

const providerLabels = {
  google: "Google",
  github: "GitHub",
  credential: "Email & password",
};

const SECTIONS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "security", label: "Password", icon: KeyRound },
  { id: "email", label: "Email", icon: Mail },
  { id: "connections", label: "Connections", icon: Link2 },
  { id: "sessions", label: "Sessions", icon: Shield },
  { id: "danger", label: "Delete", icon: Trash2 },
];

function Section({ id, eyebrow, title, description, children, tone = "default" }) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-28 rounded-2xl border p-5 sm:p-6",
        tone === "danger"
          ? "border-destructive/35 bg-destructive/5"
          : "border-border bg-card",
      )}
    >
      <header className="mb-6 border-b border-border/70 pb-5">
        <p
          className={cn(
            "text-[11px] font-semibold tracking-[0.14em] uppercase",
            tone === "danger" ? "text-destructive" : "text-primary",
          )}
        >
          {eyebrow}
        </p>
        <h2 className="font-display mt-2 text-2xl">{title}</h2>
        {description ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

/**
 * @param {{
 *   user: { id: string, name: string, email: string, image?: string | null, emailVerified: boolean },
 *   initialAccounts: Array<{ id: string, providerId: string, accountId: string }>,
 * }} props
 */
export function SettingsContent({ user, initialAccounts }) {
  const router = useRouter();
  const { busy, actionKey, run } = useAsyncAction();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [activeSection, setActiveSection] = useState("profile");

  const profileForm = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name ?? "",
      image: user.image ?? "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const emailForm = useForm({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: "" },
  });

  const linkedProviders = useMemo(
    () => new Set(accounts.map((account) => account.providerId)),
    [accounts],
  );

  const initials =
    user.name
      ?.split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  async function refreshAccounts() {
    const result = await authClient.listAccounts();
    if (result?.data) setAccounts(result.data);
  }

  async function onProfileSubmit(values) {
    await run(async () => {
      const payload = {
        name: values.name,
        image: values.image?.trim() ? values.image.trim() : null,
      };
      const result = await authClient.updateUser(payload);
      if (result?.error) {
        toast.error(authErrorMessage(result.error, "Could not update profile."));
        return;
      }
      toast.success("Profile updated.");
      router.refresh();
    }, "profile");
  }

  async function onPasswordSubmit(values) {
    await run(async () => {
      const result = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      });
      if (result?.error) {
        toast.error(authErrorMessage(result.error, "Could not change password."));
        return;
      }
      toast.success("Password updated. Other sessions were signed out.");
      passwordForm.reset();
    }, "password");
  }

  async function onEmailSubmit(values) {
    await run(async () => {
      const result = await authClient.changeEmail({
        newEmail: values.newEmail,
        callbackURL: "/settings",
      });
      if (result?.error) {
        toast.error(authErrorMessage(result.error, "Could not start email change."));
        return;
      }
      toast.success("Check your inbox to confirm the new email.");
      emailForm.reset();
    }, "email");
  }

  async function handleLink(provider) {
    await run(
      async () => {
        const result = await authClient.linkSocial({
          provider,
          callbackURL: "/settings",
        });
        if (result?.error) {
          toast.error(authErrorMessage(result.error, "Could not link account."));
          return false;
        }
        return true;
      },
      { key: `link-${provider}`, keepBusy: true },
    );
  }

  async function handleUnlink(accountId) {
    if (accounts.length <= 1) {
      toast.error("You must keep at least one sign-in method.");
      return;
    }
    await run(async () => {
      const result = await authClient.unlinkAccount({ accountId });
      if (result?.error) {
        toast.error(authErrorMessage(result.error, "Could not unlink account."));
        return;
      }
      toast.success("Account unlinked.");
      await refreshAccounts();
      router.refresh();
    }, `unlink-${accountId}`);
  }

  async function handleSignOut() {
    await run(
      async () => {
        await authClient.signOut();
        router.push("/sign-in");
        router.refresh();
        return true;
      },
      { key: "signout", keepBusy: true },
    );
  }

  async function handleRevokeOtherSessions() {
    await run(async () => {
      const result = await authClient.revokeOtherSessions();
      if (result?.error) {
        toast.error(authErrorMessage(result.error, "Could not sign out other devices."));
        return;
      }
      toast.success("Signed out on all other devices.");
    }, "revoke");
  }

  async function handleDeleteAccount() {
    await run(async () => {
      const hasCredential = linkedProviders.has("credential");
      const result = await authClient.deleteUser(
        hasCredential && deletePassword ? { password: deletePassword } : {},
      );
      if (result?.error) {
        toast.error(authErrorMessage(result.error, "Could not delete account."));
        return;
      }
      toast.success("Account deleted.");
      setDeleteOpen(false);
      router.push("/sign-in");
      router.refresh();
    }, "delete");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 border-b border-border pb-8 sm:mb-10">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
          Account settings
        </p>
        <h1 className="font-display mt-3 text-4xl leading-none sm:text-5xl">
          Security & profile
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Manage how you sign in, what others see on your profile, and which
          devices stay connected to ShopSphere.
        </p>

        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="size-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.name || "Account"}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {user.emailVerified ? (
                <Badge className="rounded-lg bg-primary/15 text-primary hover:bg-primary/15">
                  Verified email
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-lg">
                  Email unverified
                </Badge>
              )}
              <Badge variant="secondary" className="rounded-lg">
                {accounts.length} sign-in {accounts.length === 1 ? "method" : "methods"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[14rem_1fr] lg:gap-12">
        <nav
          aria-label="Settings sections"
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      s.id === "danger" && !active && "text-destructive/80",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {s.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-6">
          <Section
            id="profile"
            eyebrow="Identity"
            title="Profile"
            description="This name appears on reviews and order emails."
          >
            <fieldset disabled={busy} className="min-w-0 border-0 p-0">
              <form
                className="space-y-4"
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                noValidate
              >
                <FormField
                  id="displayName"
                  label="Display name"
                  error={profileForm.formState.errors.name?.message}
                >
                  <Input
                    id="displayName"
                    autoComplete="name"
                    className="h-11 rounded-xl"
                    {...profileForm.register("name")}
                  />
                </FormField>
                <FormField
                  id="avatarUrl"
                  label="Avatar URL"
                  error={profileForm.formState.errors.image?.message}
                  hint="Optional HTTPS image URL."
                >
                  <Input
                    id="avatarUrl"
                    type="url"
                    placeholder="https://..."
                    className="h-11 rounded-xl"
                    {...profileForm.register("image")}
                  />
                </FormField>
                <SubmitButton type="submit" loading={actionKey === "profile"} className="rounded-xl">
                  Save profile
                </SubmitButton>
              </form>
            </fieldset>
          </Section>

          <Section
            id="security"
            eyebrow="Access"
            title="Password"
            description="Changing your password signs out other devices."
          >
            <fieldset disabled={busy} className="min-w-0 border-0 p-0">
              <form
                className="space-y-4"
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                noValidate
              >
                <FormField
                  id="currentPassword"
                  label="Current password"
                  error={passwordForm.formState.errors.currentPassword?.message}
                >
                  <PasswordInput
                    id="currentPassword"
                    autoComplete="current-password"
                    className="h-11 rounded-xl"
                    {...passwordForm.register("currentPassword")}
                  />
                </FormField>
                <FormField
                  id="newPassword"
                  label="New password"
                  error={passwordForm.formState.errors.newPassword?.message}
                >
                  <PasswordInput
                    id="newPassword"
                    autoComplete="new-password"
                    showStrength
                    className="h-11 rounded-xl"
                    {...passwordForm.register("newPassword")}
                  />
                </FormField>
                <SubmitButton type="submit" loading={actionKey === "password"} className="rounded-xl">
                  Update password
                </SubmitButton>
              </form>
            </fieldset>
          </Section>

          <Section
            id="email"
            eyebrow="Inbox"
            title="Email address"
            description={`Current address: ${user.email}`}
          >
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{user.email}</span>
              {user.emailVerified ? (
                <Badge className="rounded-lg bg-primary/15 text-primary hover:bg-primary/15">
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-lg">
                  Unverified
                </Badge>
              )}
            </div>
            <fieldset disabled={busy} className="min-w-0 border-0 p-0">
              <form
                className="space-y-4"
                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                noValidate
              >
                <FormField
                  id="newEmail"
                  label="New email address"
                  error={emailForm.formState.errors.newEmail?.message}
                >
                  <Input
                    id="newEmail"
                    type="email"
                    autoComplete="email"
                    className="h-11 rounded-xl"
                    {...emailForm.register("newEmail")}
                  />
                </FormField>
                <SubmitButton type="submit" loading={actionKey === "email"} className="rounded-xl">
                  Send confirmation
                </SubmitButton>
              </form>
            </fieldset>
          </Section>

          <Section
            id="connections"
            eyebrow="Providers"
            title="Connected accounts"
            description="Link Google or GitHub for faster sign-in. Keep at least one method."
          >
            <ul className="space-y-2">
              {accounts.map((account) => (
                <li
                  key={account.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {providerLabels[account.providerId] ?? account.providerId}
                    </p>
                    <p className="text-xs text-muted-foreground">Connected</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={busy || accounts.length <= 1}
                    aria-busy={actionKey === `unlink-${account.id}`}
                    onClick={() => handleUnlink(account.id)}
                  >
                    {actionKey === `unlink-${account.id}` ? (
                      <Loader2 className="size-4 motion-safe:animate-spin" />
                    ) : (
                      <>
                        <Unlink className="size-3.5" />
                        Unlink
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
            {accounts.length <= 1 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                You cannot unlink your only sign-in method.
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
              {!linkedProviders.has("google") ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl"
                  disabled={busy}
                  aria-busy={actionKey === "link-google"}
                  onClick={() => handleLink("google")}
                >
                  {actionKey === "link-google" ? (
                    <Loader2 className="size-4 motion-safe:animate-spin" />
                  ) : (
                    "Link Google"
                  )}
                </Button>
              ) : null}
              {!linkedProviders.has("github") ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl"
                  disabled={busy}
                  aria-busy={actionKey === "link-github"}
                  onClick={() => handleLink("github")}
                >
                  {actionKey === "link-github" ? (
                    <Loader2 className="size-4 motion-safe:animate-spin" />
                  ) : (
                    "Link GitHub"
                  )}
                </Button>
              ) : null}
            </div>
          </Section>

          <Section
            id="sessions"
            eyebrow="Devices"
            title="Sessions"
            description="Sign out here, or revoke every other active session."
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <SubmitButton
                type="button"
                variant="outline"
                loading={actionKey === "signout"}
                disabled={busy}
                onClick={handleSignOut}
                className="h-11 w-full rounded-xl sm:w-auto sm:min-w-[12rem]"
              >
                <LogOut className="size-4" />
                Sign out this device
              </SubmitButton>
              <SubmitButton
                type="button"
                variant="secondary"
                loading={actionKey === "revoke"}
                disabled={busy}
                onClick={handleRevokeOtherSessions}
                className="h-11 w-full rounded-xl sm:w-auto sm:min-w-[14rem]"
              >
                Sign out all other devices
              </SubmitButton>
            </div>
          </Section>

          <Section
            id="danger"
            eyebrow="Irreversible"
            title="Delete account"
            description="Permanently remove your ShopSphere account, sessions, and linked auth data."
            tone="danger"
          >
            <Dialog open={deleteOpen} onOpenChange={busy ? undefined : setDeleteOpen}>
              <DialogTrigger
                render={
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-11 rounded-xl"
                    disabled={busy}
                  >
                    <Trash2 className="size-4" />
                    Delete account
                  </Button>
                }
              />
              <DialogContent className="rounded-xl">
                <DialogHeader>
                  <DialogTitle>Delete your account?</DialogTitle>
                  <DialogDescription>
                    This cannot be undone. All sessions will be revoked immediately.
                  </DialogDescription>
                </DialogHeader>
                {linkedProviders.has("credential") ? (
                  <FormField id="deletePassword" label="Confirm with your password">
                    <PasswordInput
                      id="deletePassword"
                      value={deletePassword}
                      onChange={(event) => setDeletePassword(event.target.value)}
                      autoComplete="current-password"
                      disabled={busy}
                      className="rounded-xl"
                    />
                  </FormField>
                ) : null}
                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        disabled={busy}
                      />
                    }
                  >
                    Cancel
                  </DialogClose>
                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-xl"
                    disabled={busy}
                    aria-busy={actionKey === "delete"}
                    onClick={handleDeleteAccount}
                  >
                    {actionKey === "delete" ? (
                      <>
                        <Loader2 className="size-4 motion-safe:animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Yes, delete forever"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Section>
        </div>
      </div>
    </div>
  );
}
