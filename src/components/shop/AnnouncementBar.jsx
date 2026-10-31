import { ANNOUNCEMENT } from "@/lib/shop/copy";

/** Slim promo strip above the navbar. Static copy from brand module. */
export function AnnouncementBar() {
  return (
    <div className="bg-primary text-primary-foreground">
      <p
        className="mx-auto flex max-w-7xl items-center justify-center gap-x-3 overflow-hidden px-4 py-2 text-center text-[11px] font-medium tracking-[0.08em] whitespace-nowrap uppercase sm:gap-x-5 sm:text-xs"
        aria-label={ANNOUNCEMENT.join(" | ")}
      >
        {ANNOUNCEMENT.map((item, i) => (
          <span
            key={item}
            className={i === ANNOUNCEMENT.length - 1 ? "hidden sm:inline" : undefined}
          >
            {i > 0 ? (
              <span aria-hidden className="mr-3 opacity-40 sm:mr-5">
                |
              </span>
            ) : null}
            {item}
          </span>
        ))}
      </p>
    </div>
  );
}
