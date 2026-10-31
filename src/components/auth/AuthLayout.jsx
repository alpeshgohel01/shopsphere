import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AuthVisual } from "@/components/auth/AuthVisual";
import { authImages } from "@/lib/auth-images";
import { cn } from "@/lib/utils";

function BrandMark({ compact = false }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 tracking-tight text-foreground",
        compact ? "text-sm" : "text-base",
      )}
    >
      <span className="font-display font-bold">ShopSphere</span>
      <span className="size-1.5 rounded-sm bg-highlight" aria-hidden />
    </Link>
  );
}

/**
 * Award-level auth shell: cinematic visual + calm form column.
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export function AuthLayout({ children, className }) {
  const hero = authImages.hero;

  return (
    <div className={cn("min-h-svh bg-background", className)}>
      <div className="grid min-h-svh lg:grid-cols-[minmax(0,1.05fr)_minmax(26rem,0.95fr)]">
        <AuthVisual />

        <div className="relative flex min-h-svh flex-col shop-canvas grain-overlay">
          {/* Mobile-only cinematic strip */}
          <div className="relative h-36 overflow-hidden lg:hidden">
            <Image
              src={hero.src}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-[#070c0a]/50" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4">
              <BrandMark compact />
              <ThemeToggle />
            </div>
          </div>

          <header className="relative z-10 hidden items-center justify-between px-5 py-5 sm:px-8 lg:flex lg:px-12">
            <div className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Member access
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Continue shopping
              </Link>
              <ThemeToggle />
            </div>
          </header>

          <div className="relative z-10 flex flex-1 items-center justify-center px-5 pb-12 sm:px-8 lg:px-12">
            <div className="w-full max-w-[26rem] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
              {children}
            </div>
          </div>

          <footer className="relative z-10 px-5 pb-6 text-center text-xs text-muted-foreground sm:px-8 lg:px-12 lg:text-left">
            Protected by secure sessions - ShopSphere
          </footer>
        </div>
      </div>
    </div>
  );
}
