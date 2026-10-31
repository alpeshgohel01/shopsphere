"use client";

import { useState } from "react";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shop/EmptyState";

const EMPTY_FORM = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
  isDefault: false,
};

const FIELDS = [
  { name: "label", label: "Label", placeholder: "Home, Work...", autoComplete: "off", span: 2 },
  { name: "fullName", label: "Full name", autoComplete: "name", span: 2 },
  { name: "line1", label: "Address", autoComplete: "address-line1", span: 2 },
  { name: "line2", label: "Apartment, suite (optional)", autoComplete: "address-line2", span: 2 },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State / region", autoComplete: "address-level1" },
  { name: "postalCode", label: "Postal code", autoComplete: "postal-code" },
  { name: "country", label: "Country", autoComplete: "country-name" },
  { name: "phone", label: "Phone (optional)", autoComplete: "tel", span: 2 },
];

async function request(method, body) {
  const res = await fetch("/api/account/addresses", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json.data;
}

const toForm = (a) => ({
  ...EMPTY_FORM,
  ...Object.fromEntries(Object.keys(EMPTY_FORM).map((k) => [k, a[k] ?? EMPTY_FORM[k]])),
  isDefault: Boolean(a.isDefault),
});

/**
 * Saved address manager for the account page.
 * Uses POST (add), PUT (edit / set default) and DELETE on /api/account/addresses.
 * @param {{ initialAddresses: object[] }} props
 */
export function AddressManager({ initialAddresses = [] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  /** null = closed, "new" = add form, otherwise the label being edited */
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(null); // "save" | `default:${label}` | `delete:${label}`

  const isNew = editing === "new";
  // The current default cannot be unset directly; pick another default instead.
  const editingIsDefault = Boolean(addresses.find((a) => a.label === editing)?.isDefault);

  function openNew() {
    setForm({ ...EMPTY_FORM, isDefault: addresses.length === 0 });
    setEditing("new");
  }

  function openEdit(address) {
    setForm(toForm(address));
    setEditing(address.label);
  }

  function closeForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function run(key, action, successMessage) {
    setBusy(key);
    try {
      const next = await action();
      setAddresses(next);
      toast.success(successMessage);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const ok = await run(
      "save",
      () => request(isNew ? "POST" : "PUT", form),
      isNew ? "Address added" : "Address updated",
    );
    if (ok) closeForm();
  }

  function makeDefault(address) {
    return run(
      `default:${address.label}`,
      () => request("PUT", { ...toForm(address), isDefault: true }),
      `${address.label} is now your default address`,
    );
  }

  async function remove(address) {
    if (!window.confirm(`Delete the address "${address.label}"?`)) return;
    const ok = await run(
      `delete:${address.label}`,
      () => request("DELETE", { label: address.label }),
      "Address deleted",
    );
    if (ok && editing === address.label) closeForm();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {addresses.length
            ? `${addresses.length} saved ${addresses.length === 1 ? "address" : "addresses"}`
            : "No addresses saved yet."}
        </p>
        {editing === null ? (
          <Button type="button" onClick={openNew} className="h-10 rounded-xl px-4">
            <Plus />
            Add address
          </Button>
        ) : null}
      </div>

      {editing !== null ? (
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-xl border border-border bg-card p-5"
          aria-label={isNew ? "Add address" : "Edit address"}
        >
          <h3 className="font-semibold">{isNew ? "Add address" : `Edit "${editing}"`}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.name} className={f.span === 2 ? "sm:col-span-2" : undefined}>
                <label
                  htmlFor={`addr-${f.name}`}
                  className="mb-1.5 block text-sm font-medium"
                >
                  {f.label}
                </label>
                <Input
                  id={`addr-${f.name}`}
                  name={f.name}
                  value={form[f.name]}
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                  readOnly={f.name === "label" && !isNew}
                  disabled={busy === "save"}
                  required={!["line2", "phone"].includes(f.name)}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              disabled={busy === "save" || (!isNew && editingIsDefault)}
              onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              className="size-4 rounded border-input accent-primary"
            />
            Use as my default address
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy === "save"} className="h-10 rounded-xl px-4">
              {busy === "save" ? <Loader2 className="animate-spin" /> : null}
              {isNew ? "Save address" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
              disabled={busy === "save"}
              className="h-10 rounded-xl px-4"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {addresses.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => {
            const rowBusy = busy === `default:${a.label}` || busy === `delete:${a.label}`;
            return (
              <li
                key={a.label}
                className="flex flex-col rounded-xl border border-border bg-card p-5 text-sm"
              >
                <p className="flex items-center justify-between font-semibold">
                  {a.label}
                  {a.isDefault ? (
                    <span className="rounded-lg bg-highlight px-2 py-0.5 text-xs text-highlight-foreground">
                      Default
                    </span>
                  ) : null}
                </p>
                <address className="mt-3 flex-1 leading-relaxed text-muted-foreground not-italic">
                  {a.fullName}
                  <br />
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                  <br />
                  {a.city}, {a.state} {a.postalCode}
                  <br />
                  {a.country}
                  {a.phone ? (
                    <>
                      <br />
                      {a.phone}
                    </>
                  ) : null}
                </address>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={rowBusy || busy === "save"}
                    onClick={() => openEdit(a)}
                  >
                    <Pencil />
                    Edit
                  </Button>
                  {!a.isDefault ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={rowBusy || busy === "save"}
                      onClick={() => makeDefault(a)}
                    >
                      {busy === `default:${a.label}` ? <Loader2 className="animate-spin" /> : <Star />}
                      Set default
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={rowBusy || busy === "save"}
                    onClick={() => remove(a)}
                  >
                    {busy === `delete:${a.label}` ? <Loader2 className="animate-spin" /> : <Trash2 />}
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : editing === null ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add one here or save it at checkout."
          className="py-12"
        />
      ) : null}
    </div>
  );
}
