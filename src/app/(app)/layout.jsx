import { AppHeader } from "@/components/layout/AppHeader";
import { requireSession } from "@/lib/session";

export default async function AppRouteLayout({ children }) {
  const session = await requireSession();
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader user={session.user} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
