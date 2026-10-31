"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Search } from "lucide-react";
import { formatPrice } from "@/lib/shop/format";
import { cn } from "@/lib/utils";

const RECENT_KEY = "shopsphere:recent-searches";
const MAX_RECENT = 5;

function readRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function pushRecent(term) {
  const t = term.trim();
  if (!t) return;
  const next = [t, ...readRecent().filter((s) => s.toLowerCase() !== t.toLowerCase())].slice(
    0,
    MAX_RECENT,
  );
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

/**
 * Typeahead search with recent queries (marketplace-style).
 * @param {{
 *   value: string,
 *   onChange: (v: string) => void,
 *   onSubmitSearch: (q: string) => void,
 *   className?: string,
 *   inputClassName?: string,
 *   autoFocus?: boolean,
 *   placeholder?: string,
 *   variant?: "inline" | "panel",
 * }} props
 */
export function SearchSuggest({
  value,
  onChange,
  onSubmitSearch,
  className,
  inputClassName,
  autoFocus = false,
  placeholder = "Search sneakers, tees...",
  variant = "inline",
}) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState([]);
  const [recent, setRecent] = useState([]);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=6`);
        const json = await res.json();
        if (cancelled) return;
        setHits(json?.ok ? json.data?.items ?? [] : []);
        setActive(-1);
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value]);

  useEffect(() => {
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function goSearch(q) {
    const term = (q ?? value).trim();
    if (!term) return;
    pushRecent(term);
    setRecent(readRecent());
    setOpen(false);
    onSubmitSearch(term);
  }

  function goProduct(slug) {
    setOpen(false);
    router.push(`/products/${slug}`);
  }

  const showRecent = open && value.trim().length < 2 && recent.length > 0;
  const showHits = open && value.trim().length >= 2;
  const options = showHits ? hits : showRecent ? recent.map((r) => ({ type: "recent", q: r })) : [];

  function onKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
      return;
    }
    if (e.key === "Enter") {
      if (active >= 0 && options[active]) {
        e.preventDefault();
        const opt = options[active];
        if (opt.type === "recent") goSearch(opt.q);
        else if (opt.slug) goProduct(opt.slug);
        else goSearch(value);
      }
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        {variant === "panel" ? (
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        ) : null}
        <input
          type="search"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search products"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          className={cn(
            "h-9 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            variant === "panel" && "h-11 pl-9",
            inputClassName,
          )}
        />
      </div>

      {showRecent || showHits ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-80 w-full min-w-[16rem] overflow-auto rounded-xl border border-border bg-popover p-1.5 shadow-lg"
        >
          {showRecent
            ? recent.map((term, i) => (
                <button
                  key={term}
                  type="button"
                  role="option"
                  aria-selected={active === i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => goSearch(term)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm",
                    active === i ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                  )}
                >
                  <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{term}</span>
                </button>
              ))
            : null}

          {showHits && loading && !hits.length ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">Searching…</p>
          ) : null}

          {showHits && !loading && !hits.length ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              No matches. Press Enter to search all products.
            </p>
          ) : null}

          {showHits
            ? hits.map((p, i) => {
                const img = p.images?.[0]?.url || p.image || "";
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    role="option"
                    aria-selected={active === i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2 py-2 text-sm",
                      active === i ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                    )}
                  >
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {img ? (
                        <Image src={img} alt="" fill sizes="44px" className="object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {p.brand ? `${p.brand} · ` : ""}
                        {formatPrice(p.price)}
                      </span>
                    </span>
                  </Link>
                );
              })
            : null}
        </div>
      ) : null}
    </div>
  );
}
