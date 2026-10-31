"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NEWSLETTER } from "@/lib/shop/copy";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    if (busy) return;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error("Enter a valid email");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Could not subscribe. Try again.");
      }
      setDone(true);
      setEmail("");
      toast.success(NEWSLETTER.success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="grid items-end gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl leading-[1.05] sm:text-5xl">
            {NEWSLETTER.title}
          </h2>
          <p className="mt-4 max-w-sm text-muted-foreground">{NEWSLETTER.text}</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row" noValidate>
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <Input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className="h-12 flex-1 bg-card px-4"
          />
          <Button
            type="submit"
            disabled={busy}
            className="h-12 rounded-xl bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/85"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {done ? "Subscribed" : "Subscribe"}
            {busy ? null : <ArrowRight className="size-4" />}
          </Button>
        </form>
      </div>
    </section>
  );
}
