import Link from "next/link";
import { Search } from "lucide-react";
import { Pagination } from "@/components/admin/Pagination";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/shop/format";
import { listUsersAdmin } from "@/lib/shop/users";
import { cn } from "@/lib/utils";

export const metadata = { title: "Users" };

const first = (v) => (Array.isArray(v) ? v[0] : v);

export default async function AdminUsersPage({ searchParams }) {
  const sp = await searchParams;
  const q = first(sp?.q)?.trim() || "";
  const result = await listUsersAdmin({ q, page: first(sp?.page), limit: 25 });

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          {result.total.toLocaleString("en-US")} {result.total === 1 ? "account" : "accounts"}
          {q ? ` matching ${q}` : ""} | read-only
        </p>
      </header>

      <form action="/admin/users" method="get" className="flex max-w-md gap-2" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search name or email"
            className="pl-9"
            aria-label="Search users"
          />
        </div>
        <Button type="submit" variant="secondary" className="h-10 px-4">
          Search
        </Button>
        {q ? (
          <Link href="/admin/users" className={cn(buttonVariants({ variant: "ghost" }), "h-10")}>
            Clear
          </Link>
        ) : null}
      </form>

      {result.items.length ? (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-muted/60 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Verified</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {result.items.map((u) => (
                <tr key={u.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{u.name || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
                        u.role === "admin"
                          ? "bg-primary/10 text-primary ring-primary/25"
                          : "bg-muted text-muted-foreground ring-foreground/10",
                      )}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u.emailVerified ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No users found.
        </p>
      )}

      <Pagination
        basePath="/admin/users"
        page={result.page}
        totalPages={result.totalPages}
        params={{ q }}
      />
    </>
  );
}
