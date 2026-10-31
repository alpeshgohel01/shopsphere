"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { authImages } from "@/lib/auth-images";

const ease = [0.22, 1, 0.36, 1];

/** Cinematic brand panel for auth screens. */
export function AuthVisual() {
  const hero = authImages.hero;

  return (
    <aside className="relative hidden min-h-svh overflow-hidden bg-[#070c0a] lg:block">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1.03 }}
        transition={{ duration: 2.4, ease }}
      >
        <Image
          src={hero.src}
          alt={hero.alt}
          fill
          priority
          sizes="56vw"
          className="object-cover object-[center_35%]"
        />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#070c0a] via-[#070c0a]/55 to-[#0d4f3c]/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#070c0a]/40 via-transparent to-transparent" />

      <div className="relative flex h-full min-h-svh flex-col justify-between p-10 xl:p-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.15 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white transition-opacity hover:opacity-90"
          >
            <span className="font-display text-lg font-bold tracking-tight">
              ShopSphere
            </span>
            <span className="size-1.5 rounded-sm bg-highlight" aria-hidden />
          </Link>
        </motion.div>

        <div className="max-w-xl pb-4">
          <motion.p
            className="mb-5 text-[0.7rem] font-semibold tracking-[0.22em] text-highlight uppercase"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.35 }}
          >
            New season / Limited runs
          </motion.p>

          <h2 className="overflow-hidden">
            <motion.span
              className="font-display block text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.9] tracking-[-0.04em] text-white"
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1, ease, delay: 0.25 }}
            >
              Enter the
              <br />
              store.
            </motion.span>
          </h2>

          <motion.p
            className="mt-6 max-w-sm text-sm leading-relaxed text-white/70 sm:text-[0.95rem]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease, delay: 0.65 }}
          >
            Sneakers and streetwear, chosen with intent. Sign in to checkout,
            track orders, and keep your wishlist.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap gap-8 border-t border-white/15 pt-8 text-xs tracking-wide text-white/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <div>
              <p className="font-display text-lg text-white">Free</p>
              <p>Shipping over $100</p>
            </div>
            <div>
              <p className="font-display text-lg text-white">30-day</p>
              <p>Easy returns</p>
            </div>
            <div>
              <p className="font-display text-lg text-white">Secure</p>
              <p>Stripe checkout</p>
            </div>
          </motion.div>
        </div>
      </div>
    </aside>
  );
}
