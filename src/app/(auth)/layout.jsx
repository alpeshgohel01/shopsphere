import { AuthLayout } from "@/components/auth/AuthLayout";
import { redirectIfAuthenticated } from "@/lib/session";

export default async function AuthRouteLayout({ children }) {
  await redirectIfAuthenticated();
  return <AuthLayout>{children}</AuthLayout>;
}
