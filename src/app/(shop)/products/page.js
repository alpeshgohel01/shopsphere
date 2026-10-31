import { Suspense } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { ActiveFilterChips } from "@/components/shop/ActiveFilterChips";
import { EmptyState } from "@/components/shop/EmptyState";
import { Filters } from "@/components/shop/Filters";
import { Pagination } from "@/components/shop/Pagination";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES } from "@/lib/shop/constants";
import { EMPTY } from "@/lib/shop/copy";
import { getCategoriesWithCounts, listProducts } from "@/lib/shop/products";

export const metadata = { title: "Shop" };

const PAGE_SIZE = 12;
const first = (v) => (Array.isArray(v) ? v[0] : v);

/** Sale and rating filters are applied in the database by listProducts. */
function loadProducts(sp) {
  return listProducts({
    q: first(sp.q),
    category: first(sp.category),
    minPrice: first(sp.minPrice),
    maxPrice: first(sp.maxPrice),
    sort: first(sp.sort),
    sale: first(sp.sale),
    rating: first(sp.rating),
    page: first(sp.page),
    limit: PAGE_SIZE,
  });
}

async function Results({ sp }) {
  const result = await loadProducts(sp);
  const params = {
    q: first(sp.q),
    category: first(sp.category),
    minPrice: first(sp.minPrice),
    maxPrice: first(sp.maxPrice),
    sort: first(sp.sort),
    rating: first(sp.rating),
    sale: first(sp.sale),
  };

  if (!result.items.length) {
    return (
      <EmptyState
        icon={SearchX}
        title={EMPTY.noProducts.title}
        description={EMPTY.noProducts.description}
        action={{ href: "/products", label: "Clear filters" }}
      >
        <ul className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Shop by category">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/products?category=${encodeURIComponent(c.name)}`}
                className="inline-flex h-9 items-center rounded-xl border border-border bg-card px-4 text-sm transition hover:border-foreground/40"
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </EmptyState>
    );
  }

  const from = (result.page - 1) * result.limit + 1;
  const to = from + result.items.length - 1;

  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground" data-testid="results-count">
        {result.total === 1
          ? "1 result"
          : `Showing ${from}-${to} of ${result.total} results`}
      </p>
      <ProductGrid products={result.items} columns={3} priorityCount={3} />
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/products"
        params={params}
      />
    </>
  );
}

async function Sidebar() {
  let counts = [];
  try {
    counts = await getCategoriesWithCounts();
  } catch {
    counts = [];
  }
  return <Filters categoryCounts={counts} />;
}

export default async function ProductsPage({ searchParams }) {
  const sp = await searchParams;
  const q = first(sp.q);
  const sale = first(sp.sale) === "1";
  const category = first(sp.category);

  const title = q ? `Results for ${q}` : sale ? "Sale" : category || "All products";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-8 sm:mb-10">
        <h1 className="font-display text-5xl leading-none sm:text-6xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sneakers, apparel and accessories. Curated, limited, ready to ship.
        </p>
      </header>

      <Suspense fallback={null}>
        <ActiveFilterChips />
      </Suspense>

      <div className="grid gap-10 lg:grid-cols-[17rem_1fr] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Suspense fallback={<Skeleton className="h-11 w-full rounded-xl" />}>
            <Sidebar />
          </Suspense>
        </aside>
        <section aria-live="polite">
          <Suspense
            key={JSON.stringify(sp)}
            fallback={
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
                ))}
              </div>
            }
          >
            <Results sp={sp} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
