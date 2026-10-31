import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { requireSession } from "@/lib/session";
import { getProfile } from "@/lib/shop/profiles";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  // Redirects to /sign-in?callbackUrl=/checkout when signed out.
  const session = await requireSession("/checkout");

  let addresses = [];
  try {
    addresses = (await getProfile(session.user.id)).addresses;
  } catch {
    addresses = [];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display mb-10 text-5xl leading-none sm:text-6xl">Checkout</h1>
      <CheckoutForm addresses={addresses} defaultName={session.user.name ?? ""} />
    </div>
  );
}
