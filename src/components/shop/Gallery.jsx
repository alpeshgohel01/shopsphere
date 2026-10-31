"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * @param {{ images: { url: string }[], title: string, className?: string }} props
 */
export function Gallery({ images, title, className }) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const list = images?.length ? images : [];

  if (!list.length) {
    return (
      <div
        className={cn(
          "flex aspect-[4/5] items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground",
          className,
        )}
      >
        No image
      </div>
    );
  }

  const go = (dir) => setIndex((i) => (i + dir + list.length) % list.length);
  const current = list[index];

  return (
    <div className={cn("flex flex-col gap-3 lg:flex-row-reverse", className)}>
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-xl bg-muted">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.button
            key={current.url}
            type="button"
            className="absolute inset-0 cursor-zoom-in"
            onClick={() => setZoomOpen(true)}
            aria-label={`Enlarge ${title} image ${index + 1}`}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={current.url}
              alt={`${title} - view ${index + 1}`}
              fill
              priority={index === 0}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </motion.button>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <span className="pointer-events-none inline-flex items-center gap-1.5 rounded-xl bg-background/90 px-2.5 py-1.5 text-[11px] font-medium backdrop-blur">
            <Expand className="size-3" aria-hidden />
            Tap to zoom
          </span>
          {list.length > 1 ? (
            <div className="pointer-events-auto flex gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous image"
                className="flex size-10 items-center justify-center rounded-xl bg-background/90 backdrop-blur transition hover:bg-background"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next image"
                className="flex size-10 items-center justify-center rounded-xl bg-background/90 backdrop-blur transition hover:bg-background"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {list.length > 1 ? (
        <div className="flex gap-2.5 overflow-x-auto lg:w-20 lg:flex-col lg:overflow-visible">
          {list.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-2 ring-offset-2 ring-offset-background transition lg:w-full",
                i === index ? "ring-primary" : "opacity-70 ring-transparent hover:opacity-100",
              )}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[95vh] w-[min(96vw,56rem)] overflow-hidden border-0 bg-background/95 p-0 sm:max-w-4xl"
        >
          <DialogTitle className="sr-only">
            {title} — image {index + 1}
          </DialogTitle>
          <div className="relative flex min-h-[70vh] items-center justify-center bg-muted/40 p-4 sm:p-8">
            <DialogClose
              aria-label="Close zoom"
              className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-xl bg-background/90 backdrop-blur hover:bg-background"
            >
              <X className="size-4" />
            </DialogClose>
            {list.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous image"
                  className="absolute top-1/2 left-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl bg-background/90 backdrop-blur hover:bg-background"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next image"
                  className="absolute top-1/2 right-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl bg-background/90 backdrop-blur hover:bg-background"
                >
                  <ChevronRight className="size-4" />
                </button>
              </>
            ) : null}
            <div className="relative h-[min(78vh,48rem)] w-full">
              <Image
                src={current.url}
                alt={`${title} enlarged`}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
