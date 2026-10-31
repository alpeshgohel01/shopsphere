import { CartPageContent } from "@/components/shop/CartPageContent";

export const metadata = { title: "Your bag" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display mb-10 text-5xl leading-none sm:text-6xl">Your bag</h1>
      <CartPageContent />
    </div>
  );
}
