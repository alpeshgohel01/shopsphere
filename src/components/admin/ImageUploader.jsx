"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_BYTES = 5 * 1024 * 1024;
/** Hosts the storefront can render directly (see next.config.mjs remotePatterns). */
const TRUSTED_HOSTS = new Set([
  "images.unsplash.com",
  "plus.unsplash.com",
  "res.cloudinary.com",
]);

/**
 * Product image list editor: add by URL, or (optionally) upload a file to /api/upload.
 * Uploads need Cloudinary; URLs on other hosts are imported via /api/upload,
 * which reports a clear error if uploads are not configured.
 *
 * @param {{
 *   images: { url: string, publicId?: string }[],
 *   onChange: (images: { url: string, publicId: string }[]) => void,
 *   max?: number,
 *   disabled?: boolean,
 * }} props
 */
export function ImageUploader({ images, onChange, max = 12, disabled = false }) {
  const fileRef = useRef(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const full = images.length >= max;

  /** @param {Response} res */
  async function readResult(res) {
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) {
      throw new Error(json?.error || `Request failed (${res.status})`);
    }
    return json.data;
  }

  function append(image) {
    onChange([...images, { url: image.url, publicId: image.publicId ?? "" }]);
  }

  async function handleAddUrl() {
    const value = url.trim();
    if (!value) return;
    setError("");

    let parsed;
    try {
      parsed = new URL(value);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
    } catch {
      setError("Enter a valid image URL (https://...).");
      return;
    }
    if (images.some((i) => i.url === parsed.toString())) {
      setError("That image has already been added.");
      return;
    }

    if (TRUSTED_HOSTS.has(parsed.hostname)) {
      append({ url: parsed.toString(), publicId: "" });
      setUrl("");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: parsed.toString() }),
      });
      append(await readResult(res));
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add image");
    } finally {
      setBusy(false);
    }
  }

  async function handleFiles(event) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setError("");

    setBusy(true);
    let next = images;
    try {
      for (const file of files) {
        if (next.length >= max) {
          setError(`You can add up to ${max} images.`);
          break;
        }
        if (file.size > MAX_BYTES) {
          throw new Error(`${file.name} is too large (max 5 MB)`);
        }
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await readResult(res);
        next = [...next, { url: data.url, publicId: data.publicId ?? "" }];
        onChange(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function remove(index) {
    onChange(images.filter((_, i) => i !== index));
  }

  function makePrimary(index) {
    if (index === 0) return;
    const next = [...images];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {images.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <li
              key={`${image.url}-${index}`}
              className="group relative overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={`Product image ${index + 1}`}
                className="aspect-square w-full object-cover"
              />
              {index === 0 ? (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-highlight px-2 py-0.5 text-[10px] font-semibold text-highlight-foreground">
                  Primary
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {index !== 0 ? (
                  <button
                    type="button"
                    onClick={() => makePrimary(index)}
                    disabled={disabled}
                    className="rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-black"
                  >
                    Make primary
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={disabled}
                  aria-label={`Remove image ${index + 1}`}
                  className="rounded-md bg-white/90 p-1 text-red-600"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          <ImagePlus className="size-4" />
          No images yet. Add a URL or upload a file.
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="url"
          inputMode="url"
          placeholder="https://images.unsplash.com/..."
          value={url}
          disabled={disabled || busy || full}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddUrl();
            }
          }}
          aria-label="Image URL"
        />
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10"
            disabled={disabled || busy || full || !url.trim()}
            onClick={handleAddUrl}
          >
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            Add URL
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10"
            disabled={disabled || busy || full}
            onClick={() => fileRef.current?.click()}
          >
            <Upload />
            Upload
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            multiple
            hidden
            onChange={handleFiles}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {images.length}/{max} images. First image is the primary one. File upload requires
          Cloudinary to be configured.
        </p>
      )}
    </div>
  );
}
