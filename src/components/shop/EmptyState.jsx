import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   icon?: import("react").ComponentType<{ className?: string }>,
 *   title: string,
 *   description?: string,
 *   action?: { href: string, label: string },
 *   className?: string,
 *   children?: import("react").ReactNode,
 * }} props
 */
export function EmptyState({ icon: Icon, title, description, action, className, children }) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Icon className="size-6" />
        </span>
      ) : null}
      <h2 className="font-display text-2xl">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-7 h-11 rounded-xl px-6 text-sm",
          )}
        >
          {action.label}
        </Link>
      ) : null}
      {children}
    </div>
  );
}
