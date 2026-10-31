import { AnnouncementBar } from "@/components/shop/AnnouncementBar";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { ShopFooter } from "@/components/shop/ShopFooter";
import { ShopNavbar } from "@/components/shop/ShopNavbar";
import { WishlistSync } from "@/components/shop/WishlistSync";
import { getSession } from "@/lib/session";
import { getProfile } from "@/lib/shop/profiles";

export const metadata = {
  title: {
    default: "ShopSphere - Sneakers & Streetwear",
    template: "%s | ShopSphere",
  },
  description:
    "ShopSphere is a modern sneakers and streetwear store. Limited runs, free shipping over $100.",
};

export default async function ShopLayout({ children }) {
  let session = null;
  try {
    session = await getSession();
  } catch {
    session = null;
  }

  let wishlistIds = null;
  if (session?.user?.id) {
    try {
      wishlistIds = (await getProfile(session.user.id)).wishlist;
    } catch {
      wishlistIds = null;
    }
  }

  const user = session?.user
    ? {
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        image: session.user.image ?? null,
        role: session.user.role ?? "user",
      }
    : null;

  return (
    <div className="shop-canvas flex min-h-svh flex-col">
      <AnnouncementBar />
      <ShopNavbar user={user} />
      <main className="flex-1">{children}</main>
      <ShopFooter />
      <CartDrawer />
      <WishlistSync ids={wishlistIds} />
    </div>
  );
}
