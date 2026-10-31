import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/session";
import { SettingsContent } from "./SettingsContent";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await requireSession("/settings");
  let initialAccounts = [];

  try {
    initialAccounts =
      (await auth.api.listUserAccounts({
        headers: await headers(),
      })) ?? [];
  } catch {
    initialAccounts = [];
  }

  return <SettingsContent user={session.user} initialAccounts={initialAccounts} />;
}
