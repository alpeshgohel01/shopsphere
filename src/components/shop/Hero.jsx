"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HERO } from "@/lib/shop/copy";
import { formatPrice } from "@/lib/shop/format";
import { cn } from "@/lib/utils";

const AUTO_MS = 5500;
const ease = [0.22, 1, 0.36, 1];

/**
 * @typedef {{
 *   id: string,
 *   slug: string,
 *   title: string,
 *   brand?: string,
 *   price: number,
 *   compareAtPrice?: number | null,
 *   image: string,
 *   category?: string,
 * }} HeroSlide
 */

/**
 * Full-bleed product hero slideshow.
 * @param {{ slides?: HeroSlide[] }} props
 */
export function Hero({ slides = [] }) {
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const timerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [direction, setDirection] = useState(1);

  const count = slides.length;
  const slide = count ? slides[index % count] : null;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  const goTo = useCallback(
    (next, dir = 1) => {
      if (!count) return;
      setDirection(dir);
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1, -1), [goTo, index]);

  useEffect(() => {
    if (!playing || reduced || count < 2) return undefined;
    timerRef.current = window.setTimeout(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [playing, reduced, count, index]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const fallbackImage =
    "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=2400&q=80";

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[calc(100svh-6.5rem)] items-end overflow-hidden bg-[#070c0a]"
      aria-roledescription="carousel"
      aria-label="Featured products"
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
    >
      <div className="absolute inset-0 -z-20">
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.div
            key={slide?.id ?? "fallback"}
            className="absolute inset-0"
            style={reduced ? undefined : { y: parallaxY }}
            custom={direction}
            variants={{
              enter: (dir) => ({
                opacity: 0,
                scale: 1.08,
                x: reduced ? 0 : dir > 0 ? "5%" : "-5%",
              }),
              center: { opacity: 1, scale: 1.03, x: "0%" },
              exit: (dir) => ({
                opacity: 0,
                scale: 1.1,
                x: reduced ? 0 : dir > 0 ? "-4%" : "4%",
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduced ? 0.01 : 0.95, ease }}
          >
            <motion.div
              className="absolute inset-0"
              initial={reduced ? false : { scale: 1.06 }}
              animate={reduced ? undefined : { scale: 1.12 }}
              transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
            >
              <Image
                src={slide?.image || fallbackImage}
                alt={slide ? `${slide.brand || ""} ${slide.title}`.trim() : ""}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#070c0a]/88 via-[#070c0a]/50 to-transparent" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#070c0a]/85 via-transparent to-[#070c0a]/30" />

      {/* Side nav arrows - always visible, no scrollbar UI */}
      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous product"
            className="absolute top-1/2 left-3 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-xl border border-white/30 bg-black/35 text-white backdrop-blur-md transition hover:bg-highlight hover:text-highlight-foreground sm:left-5 sm:size-14"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next product"
            className="absolute top-1/2 right-3 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-xl border border-white/30 bg-black/35 text-white backdrop-blur-md transition hover:bg-highlight hover:text-highlight-foreground sm:right-5 sm:size-14"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-28 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <div className="max-w-xl lg:max-w-2xl">
          <motion.p
            className="mb-4 inline-flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-white uppercase sm:text-sm"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease }}
          >
            <span className="h-px w-8 bg-highlight" aria-hidden />
            {HERO.eyebrow}
            {slide?.category ? (
              <>
                <span className="text-white/35" aria-hidden>
                  /
                </span>
                <span className="text-white/70">{slide.category}</span>
              </>
            ) : null}
          </motion.p>

          {/* Full brand name - no overflow clip */}
          <motion.h1
            className="font-display text-[clamp(2.75rem,9vw,6.5rem)] leading-[0.95] tracking-[-0.04em] break-words text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease, delay: 0.08 }}
          >
            {HERO.brand}
          </motion.h1>

          <div className="relative mt-6 min-h-[6.75rem]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={slide?.id ?? "static"}
                custom={direction}
                initial={{ opacity: 0, y: 16 * (direction || 1) }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 * (direction || 1) }}
                transition={{ duration: 0.4, ease }}
                className="text-white"
              >
                {slide ? (
                  <>
                    <p className="text-xs font-semibold tracking-[0.16em] text-highlight uppercase">
                      {slide.brand || "Featured"}
                    </p>
                    <p className="font-display mt-2 text-2xl leading-snug sm:text-3xl">
                      {slide.title}
                    </p>
                    <div className="mt-3 flex flex-wrap items-baseline gap-3">
                      <span className="text-lg font-semibold">
                        {formatPrice(slide.price)}
                      </span>
                      {slide.compareAtPrice &&
                      slide.compareAtPrice > slide.price ? (
                        <span className="text-sm text-white/50 line-through">
                          {formatPrice(slide.compareAtPrice)}
                        </span>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-display text-2xl leading-snug sm:text-3xl">
                      {HERO.headline}
                    </p>
                    <p className="mt-3 text-sm text-white/75 sm:text-base">
                      {HERO.line}
                    </p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={slide ? `/products/${slide.slug}` : HERO.primaryCta.href}
              className={cn(
                buttonVariants(),
                "h-12 rounded-xl bg-highlight px-7 text-sm font-semibold text-highlight-foreground hover:bg-highlight/90",
              )}
            >
              {slide ? "Shop this piece" : HERO.primaryCta.label}
              <ChevronRight className="size-4" />
            </Link>
            <Link
              href={HERO.secondaryCta.href}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 rounded-xl border-white/35 bg-white/10 px-7 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 hover:text-white dark:border-white/35 dark:bg-white/10",
              )}
            >
              {HERO.secondaryCta.label}
            </Link>
          </div>
        </div>

        {count > 1 ? (
          <div className="mt-10 flex items-center gap-4">
            <p className="font-mono text-sm tabular-nums text-white/70">
              {String(index + 1).padStart(2, "0")}
              <span className="text-white/35"> / </span>
              {String(count).padStart(2, "0")}
            </p>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="flex size-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition hover:bg-white/20"
              aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            >
              {playing ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
            </button>
            <div className="flex gap-2" role="tablist" aria-label="Slides">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show ${s.title}`}
                  onClick={() => goTo(i, i > index ? 1 : -1)}
                  className={cn(
                    "size-2.5 rounded-full transition",
                    i === index
                      ? "bg-highlight scale-110"
                      : "bg-white/35 hover:bg-white/60",
                  )}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
