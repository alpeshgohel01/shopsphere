import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { Pagination } from "@/components/admin/Pagination";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCents } from "@/lib/shop/money";
import { getCategoriesWithCounts, listProducts, totalStock } from "@/lib/shop/products";
import { LOW_STOCK_THRESHOLD } from "@/lib/shop/stats";
import { cn } from "@/lib/utils";

export const metadata = { title: "Products" };

const first = (v) => (Array.isArray(v) ? v[0] : v);

export default async function AdminProductsPage({ searchParams }) {
  const sp = await searchParams;
  const q = first(sp?.q)?.trim().slice(0, 100) || "";
  const category = first(sp?.category)?.trim().slice(0, 80) || "";

  const [result, categoryRows] = await Promise.all([
    listProducts(
      { q, category, page: first(sp?.page), limit: 20, sort: "newest" },
      { includeInactive: true },
    ),
    getCategoriesWithCounts().catch(() => []),
  ]);
  const categories = categoryRows.map((c) => c.category).filter(Boolean);
  if (category && !categories.some((c) => c.toLowerCase() === category.toLowerCase())) {
    categories.push(category);
  }
  const filtered = Boolean(q || category);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {result.total.toLocaleString("en-US")} {result.total === 1 ? "product" : "products"}
            {category ? ` in ${category}` : ""}
            {q ? ` matching "${q}"` : ""}
          </p>
        </div>
        <Link href="/admin/products/new" className={cn(buttonVariants(), "h-9 px-3.5")}>
          <Plus />
          New product
        </Link>
      </header>

      <form action="/admin/products" method="get" className="flex max-w-2xl flex-wrap gap-2" role="search">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search title, brand, category..."
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <select
          name="category"
          defaultValue={category}
          aria-label="Filter by category"
          className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 [&>option]:bg-popover [&>option]:text-popover-foreground"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" className="h-10 px-4">
          Search
        </Button>
        {filtered ? (
          <Link href="/admin/products" className={cn(buttonVariants({ variant: "ghost" }), "h-10")}>
            Clear
          </Link>
        ) : null}
      </form>

      {result.items.length ? (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/60 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2.5 font-medium">Product</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 text-right font-medium">Price</th>
                <th className="px-4 py-2.5 text-right font-medium">Stock</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {result.items.map((p) => {
                const stock = totalStock(p);
                const image = p.images?.[0]?.url;
                return (
                  <tr key={p.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt=""
                            className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
                          />
                        ) : (
                          <span className="size-10 shrink-0 rounded-lg bg-muted" />
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="block truncate font-medium hover:underline"
                          >
                            {p.title}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {p.brand || p.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.category}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCents(p.price)}
                      {p.compareAtPrice ? (
                        <span className="ml-1.5 text-xs text-muted-foreground line-through">
                          {formatCents(p.compareAtPrice)}
                        </span>
                      ) : null}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        stock < LOW_STOCK_THRESHOLD && "font-medium text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {stock}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                            p.isActive
                              ? "bg-green-100 text-green-800 ring-green-600/20 dark:bg-green-500/15 dark:text-green-300"
                              : "bg-muted text-muted-foreground ring-foreground/10",
                          )}
                        >
                          {p.isActive ? "Active" : "Archived"}
                        </span>
                        {stock === 0 ? (
                          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-500/15 dark:text-red-300">
                            Out of stock
                          </span>
                        ) : stock < LOW_STOCK_THRESHOLD ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                            Low stock
                          </span>
                        ) : null}
                        {p.featured ? (
                          <span className="inline-flex rounded-full bg-highlight px-2.5 py-0.5 text-xs font-medium text-highlight-foreground">
                            Featured
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          <Pencil />
                          Edit
                        </Link>
                        <DeleteProductButton id={p.id} title={p.title} isActive={p.isActive} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {filtered ? "No products match your filters." : "No products found."}
        </p>
      )}

      <Pagination
        basePath="/admin/products"
        page={result.page}
        totalPages={result.totalPages}
        params={{ q, category }}
      />
    </>
  );
}
