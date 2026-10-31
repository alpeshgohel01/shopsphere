import { WishlistView } from "@/components/shop/WishlistView";
import { getSession } from "@/lib/session";
import { getWishlistProducts } from "@/lib/shop/profiles";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  let serverProducts = null;
  try {
    const session = await getSession();
    if (session?.user?.id) {
      serverProducts = await getWishlistProducts(session.user.id);
    }
  } catch {
    serverProducts = null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display mb-10 text-5xl leading-none sm:text-6xl">Wishlist</h1>
      <WishlistView serverProducts={serverProducts} />
    </div>
  );
}
