import { cn } from "@/lib/utils";

/**
 * Editorial auth panel -- no heavy card chrome.
 * @param {{
 *   title: string,
 *   description?: string,
 *   children: React.ReactNode,
 *   footer?: React.ReactNode,
 *   className?: string,
 *   eyebrow?: string,
 * }} props
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
  eyebrow = "ShopSphere",
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-8 space-y-3">
        <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display text-[2.15rem] leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[2.45rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      <div className="space-y-5">{children}</div>

      {footer ? (
        <p className="mt-8 border-t border-border/70 pt-6 text-sm text-muted-foreground">
          {footer}
        </p>
      ) : null}
    </div>
  );
}
