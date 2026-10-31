import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function buildHref(basePath, params, page) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v == null || v === "" || k === "page") continue;
    sp.set(k, String(v));
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function pageList(page, total) {
  const pages = new Set([1, total, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

/**
 * @param {{ page: number, totalPages: number, basePath: string, params?: Record<string, string | undefined> }} props
 */
export function Pagination({ page, totalPages, basePath, params }) {
  if (totalPages <= 1) return null;

  const item =
    "inline-flex size-10 items-center justify-center rounded-xl text-sm font-medium transition";

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link
          href={buildHref(basePath, params, page - 1)}
          aria-label="Previous page"
          className={cn(item, "hover:bg-muted")}
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}
      {pageList(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`g${i}`} className="px-1 text-muted-foreground">
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(basePath, params, p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              item,
              p === page
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link
          href={buildHref(basePath, params, page + 1)}
          aria-label="Next page"
          className={cn(item, "hover:bg-muted")}
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
