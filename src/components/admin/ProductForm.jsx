"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_NAMES } from "@/lib/shop/constants";
import { dollarsToCents } from "@/lib/shop/money";
import { cn } from "@/lib/utils";

const SELECT_CLASS =
  "h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30 [&>option]:bg-popover [&>option]:text-popover-foreground";

const centsToDollars = (cents) =>
  cents == null ? "" : (Number(cents) / 100).toFixed(2);

/**
 * Create / edit product form.
 * Prices are typed in dollars and converted to integer cents before sending.
 *
 * @param {{ product?: any }} props pass a serialized product to edit; omit to create
 */
export function ProductForm({ product }) {
  const router = useRouter();
  const isEdit = Boolean(product?.id);

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(centsToDollars(product?.price));
  const [compareAt, setCompareAt] = useState(centsToDollars(product?.compareAtPrice));
  const [category, setCategory] = useState(product?.category ?? CATEGORY_NAMES[0]);
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [variants, setVariants] = useState(
    product?.variants?.length
      ? product.variants.map((v) => ({ size: v.size, stock: String(v.stock ?? 0) }))
      : [{ size: "", stock: "0" }],
  );
  const [featured, setFeatured] = useState(Boolean(product?.featured));
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [images, setImages] = useState(product?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Keep a legacy/custom category selectable when editing.
  const categoryOptions = CATEGORY_NAMES.includes(category)
    ? CATEGORY_NAMES
    : [category, ...CATEGORY_NAMES];

  function updateVariant(index, patch) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function buildPayload() {
    const priceCents = dollarsToCents(price);
    if (!title.trim()) throw new Error("Title is required");
    if (!(priceCents > 0)) throw new Error("Price must be greater than $0.00");

    let compareAtCents = null;
    if (compareAt.trim() !== "") {
      compareAtCents = dollarsToCents(compareAt);
      if (compareAtCents <= priceCents) {
        throw new Error("Compare-at price must be greater than price");
      }
    }

    const cleanVariants = variants
      .map((v) => ({ size: v.size.trim(), stock: Math.floor(Number(v.stock)) }))
      .filter((v) => v.size !== "");
    if (!cleanVariants.length) throw new Error("Add at least one size");
    if (cleanVariants.some((v) => !Number.isFinite(v.stock) || v.stock < 0)) {
      throw new Error("Stock must be 0 or more");
    }
    const seen = new Set(cleanVariants.map((v) => v.size.toLowerCase()));
    if (seen.size !== cleanVariants.length) throw new Error("Duplicate sizes are not allowed");

    return {
      title: title.trim(),
      description: description.trim(),
      price: priceCents,
      compareAtPrice: compareAtCents,
      category,
      brand: brand.trim(),
      images: images.map((i) => ({ url: i.url, publicId: i.publicId ?? "" })),
      variants: cleanVariants,
      featured,
      isActive,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    let payload;
    try {
      payload = buildPayload();
    } catch (err) {
      setError(err.message);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/products/${product.id}` : "/api/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Could not save product (${res.status})`);
      }
      toast.success(isEdit ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className={SELECT_CLASS}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categoryOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                maxLength={80}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price (USD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compareAt">Compare-at price (optional)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="compareAt"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                value={compareAt}
                onChange={(e) => setCompareAt(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Shown struck through. Must be higher than the price.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sizes &amp; stock</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {variants.map((variant, index) => (
            <div key={index} className="flex items-end gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                {index === 0 ? <Label htmlFor="size-0">Size</Label> : null}
                <Input
                  id={`size-${index}`}
                  placeholder="e.g. M, 42, One size"
                  value={variant.size}
                  onChange={(e) => updateVariant(index, { size: e.target.value })}
                  maxLength={30}
                  aria-label={`Size ${index + 1}`}
                />
              </div>
              <div className="w-28 space-y-1.5">
                {index === 0 ? <Label htmlFor="stock-0">Stock</Label> : null}
                <Input
                  id={`stock-${index}`}
                  type="number"
                  min="0"
                  step="1"
                  value={variant.stock}
                  onChange={(e) => updateVariant(index, { stock: e.target.value })}
                  aria-label={`Stock ${index + 1}`}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="mb-0.5 text-muted-foreground hover:text-destructive"
                disabled={variants.length === 1}
                onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
                aria-label={`Remove size ${index + 1}`}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVariants((prev) => [...prev, { size: "", stock: "0" }])}
          >
            <Plus />
            Add size
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader images={images} onChange={setImages} disabled={saving} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="featured">Featured</Label>
              <p className="mt-1 text-xs text-muted-foreground">Highlight on the home page.</p>
            </div>
            <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="active">Active</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Inactive products are hidden from the storefront.
              </p>
            </div>
            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Link
          href="/admin/products"
          className={cn(buttonVariants({ variant: "ghost" }), "h-10 px-4")}
        >
          Cancel
        </Link>
        <Button type="submit" className="h-10 px-5" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : null}
          {isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
