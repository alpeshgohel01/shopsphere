import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireRole } from "@/lib/session";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s | ShopSphere Admin",
  },
  robots: { index: false, follow: false },
};

/**
 * Admin shell. The proxy only checks for a cookie; this re-verifies the session
 * and the admin role on the server (signed-out -> sign-in, non-admin -> "/").
 */
export default async function AdminLayout({ children }) {
  const { user } = await requireRole("admin", "/admin");

  return (
    <div className="flex min-h-svh flex-col bg-background md:flex-row">
      <AdminSidebar user={{ name: user.name, email: user.email }} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
      </main>
    </div>
  );
}
