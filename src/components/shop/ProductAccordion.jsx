"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accessible accordion. Single-open by default; `defaultOpen` is an item id.
 * @param {{ items: { id: string, title: string, content: import("react").ReactNode }[], defaultOpen?: string }} props
 */
export function ProductAccordion({ items, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? null);
  const base = useId();

  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((item) => {
        const isOpen = open === item.id;
        const panelId = `${base}-${item.id}-panel`;
        const buttonId = `${base}-${item.id}-button`;
        return (
          <section key={item.id}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {item.title}
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="pb-5 text-sm leading-relaxed text-foreground/80"
            >
              {item.content}
            </div>
          </section>
        );
      })}
    </div>
  );
}
