import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Crown, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Hero } from "@/components/shop/Hero";
import { Newsletter } from "@/components/shop/Newsletter";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ProductRail } from "@/components/shop/ProductRail";
import { Reveal } from "@/components/shop/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/shop/constants";
import { BENEFITS, EDITORIAL, EMPTY, SECTIONS } from "@/lib/shop/copy";
import {
  getCategoriesWithCounts,
  getFeaturedProducts,
  getNewArrivals,
  getTopRatedProducts,
  listProducts,
} from "@/lib/shop/products";
import { cn } from "@/lib/utils";

export const metadata = {
  title: { absolute: "ShopSphere - Sneakers & Streetwear" },
};

const BENEFIT_ICONS = {
  shipping: Truck,
  returns: RotateCcw,
  secure: ShieldCheck,
  access: Crown,
};

/** Run a loader; on failure log and return the fallback so the page still renders. */
async function safe(label, fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    console.error(`[home] failed to load ${label}`, err);
    return fallback;
  }
}

async function loadHomeData() {
  const [featured, newArrivals, topRated, counts] = await Promise.all([
    safe(
      "featured",
      async () => {
        const items = await getFeaturedProducts(8);
        return items.length ? items : (await listProducts({ limit: 8 })).items;
      },
      [],
    ),
    safe("new arrivals", () => getNewArrivals(8), []),
    safe("top rated", () => getTopRatedProducts(4), []),
    safe("categories", () => getCategoriesWithCounts(), []),
  ]);
  return { featured, newArrivals, topRated, counts };
}

function SectionHeader({ eyebrow, title, href, cta }) {
  return (
    <Reveal className="mb-10 flex items-end justify-between gap-6 sm:mb-12">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
          {eyebrow}
        </p>
        <h2 className="font-display mt-3 text-4xl leading-none sm:text-5xl">{title}</h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="hidden shrink-0 items-center gap-1.5 text-sm font-medium hover:underline sm:inline-flex"
        >
          {cta} <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </Reveal>
  );
}

function toHeroSlides(products) {
  return products
    .filter((p) => p?.images?.[0]?.url || p?.image)
    .slice(0, 6)
    .map((p) => ({
      id: String(p.id || p._id),
      slug: p.slug,
      title: p.title,
      brand: p.brand || "",
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      image: p.images?.[0]?.url || p.image,
      category: p.category || "",
    }));
}

export default async function HomePage() {
  const { featured, newArrivals, topRated, counts } = await loadHomeData();
  const countMap = new Map(counts.map((c) => [c.category.toLowerCase(), c.count]));
  const heroSlides = toHeroSlides(
    featured.length ? featured : newArrivals.length ? newArrivals : [],
  );

  return (
    <>
      <Hero slides={heroSlides} />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <SectionHeader
          eyebrow={SECTIONS.featured.eyebrow}
          title={SECTIONS.featured.title}
          href="/products"
          cta={SECTIONS.featured.cta}
        />
        {featured.length ? (
          <ProductGrid products={featured} priorityCount={4} />
        ) : (
          <p className="rounded-xl bg-muted px-6 py-12 text-center text-sm text-muted-foreground">
            {EMPTY.homeNoProducts}
          </p>
        )}
      </section>

      {newArrivals.length ? (
        <section className="mx-auto max-w-7xl overflow-hidden px-4 pb-20 sm:px-6 sm:pb-28">
          <SectionHeader
            eyebrow={SECTIONS.newArrivals.eyebrow}
            title={SECTIONS.newArrivals.title}
            href="/products?sort=newest"
            cta={SECTIONS.newArrivals.cta}
          />
          <ProductRail products={newArrivals} label={SECTIONS.newArrivals.title} />
        </section>
      ) : null}

      <section className="bg-foreground text-background dark:bg-card dark:text-foreground">
        <div className="mx-auto grid max-w-7xl md:grid-cols-2">
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[34rem]">
            <Image
              src={EDITORIAL.image}
              alt=""
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <Reveal className="flex flex-col justify-center px-6 py-14 sm:px-12 md:py-20 lg:px-16">
            <p className="text-xs font-semibold tracking-[0.16em] text-highlight uppercase">
              {EDITORIAL.eyebrow}
            </p>
            <h2 className="font-display mt-4 max-w-md text-4xl leading-[1.02] sm:text-5xl">
              {EDITORIAL.headline}
            </h2>
            <p className="mt-5 max-w-sm text-sm opacity-75 sm:text-base">{EDITORIAL.text}</p>
            <div className="mt-8">
              <Link
                href={EDITORIAL.cta.href}
                className={cn(
                  buttonVariants(),
                  "h-12 rounded-xl bg-highlight px-7 text-sm font-semibold text-highlight-foreground hover:bg-highlight/90",
                )}
              >
                {EDITORIAL.cta.label}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <SectionHeader
          eyebrow={SECTIONS.categories.eyebrow}
          title={SECTIONS.categories.title}
        />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => {
            const n = countMap.get(c.name.toLowerCase());
            return (
              <Reveal key={c.slug} delay={i * 0.08}>
                <Link
                  href={`/products?category=${encodeURIComponent(c.name)}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-muted"
                >
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070c0a]/80 via-[#070c0a]/10 to-transparent" />
                  <div className="absolute inset-x-4 bottom-4 text-white">
                    <p className="font-display text-2xl">{c.label}</p>
                    <p className="mt-0.5 flex items-center justify-between text-xs text-white/75">
                      <span>{n ? `${n} pieces` : c.description}</span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {topRated.length ? (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
          <SectionHeader
            eyebrow={SECTIONS.topRated.eyebrow}
            title={SECTIONS.topRated.title}
            href="/products?sort=rating"
            cta={SECTIONS.topRated.cta}
          />
          <ProductGrid products={topRated} />
        </section>
      ) : null}

      <section className="border-y border-border/70" aria-label="Store benefits">
        <ul className="mx-auto grid max-w-7xl divide-y divide-border/70 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {BENEFITS.map(({ key, title, text }) => {
            const Icon = BENEFIT_ICONS[key] ?? ShieldCheck;
            return (
              <li key={key} className="flex items-start gap-4 py-7 lg:px-6 lg:first:pl-0">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <Newsletter />
    </>
  );
}
