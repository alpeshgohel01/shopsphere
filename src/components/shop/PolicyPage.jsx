import Link from "next/link";
import { FOOTER } from "@/lib/shop/copy";
import { cn } from "@/lib/utils";

/**
 * Shell for static help pages (shipping, returns, size guide, contact).
 * @param {{ title: string, intro?: string, sections?: { heading: string, body: string }[], children?: import("react").ReactNode }} props
 */
export function PolicyPage({ title, intro, sections = [], children }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Help</p>
      <h1 className="font-display mt-3 text-5xl leading-none sm:text-6xl">{title}</h1>
      {intro ? <p className="mt-4 max-w-prose text-muted-foreground">{intro}</p> : null}

      <div className="mt-12 grid gap-12 md:grid-cols-[1fr_12rem]">
        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.heading} className="border-t border-border pt-6">
              <h2 className="font-display text-2xl">{s.heading}</h2>
              <p className="mt-2 max-w-prose leading-relaxed text-foreground/80">{s.body}</p>
            </section>
          ))}
          {children}
        </div>

        <nav aria-label="Help pages" className="md:sticky md:top-24 md:self-start">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            More help
          </p>
          <ul className="mt-3 space-y-2">
            {FOOTER.help.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "text-sm text-foreground/80 transition hover:text-primary hover:underline",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
