"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Delete via DELETE /api/products/:id.
 * Active products are archived (soft delete, keeps order history intact);
 * already-archived products are removed permanently (?hard=true).
 *
 * @param {{ id: string, title: string, isActive: boolean }} props
 */
export function DeleteProductButton({ id, title, isActive }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    const message = isActive
      ? `Archive "${title}"? It will be hidden from the store. Past orders are kept.`
      : `Permanently delete "${title}"? This cannot be undone.`;
    if (!window.confirm(message)) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/products/${id}${isActive ? "" : "?hard=true"}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Delete failed (${res.status})`);
      }
      toast.success(isActive ? "Product archived" : "Product deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleClick}
      disabled={busy}
      aria-label={isActive ? `Archive ${title}` : `Delete ${title} permanently`}
    >
      {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
      {isActive ? "Delete" : "Delete forever"}
    </Button>
  );
}
