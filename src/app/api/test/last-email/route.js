import { NextResponse } from "next/server";
import { getRecentDevEmails } from "@/lib/email/dev-store";
import { normalizeEmail } from "@/lib/email/normalize";

/**
 * Dev/test-only hook to read the last outbound auth email link.
 * Enabled when NODE_ENV !== production OR ENABLE_TEST_HOOKS=true.
 */
export async function GET(request) {
  const allowed =
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_TEST_HOOKS === "true";

  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const email = request.nextUrl.searchParams.get("email");
  const kind = request.nextUrl.searchParams.get("kind");
  const entries = getRecentDevEmails(
    email ? normalizeEmail(email) : undefined,
  );
  const filtered = kind ? entries.filter((e) => e.kind === kind) : entries;
  const latest = filtered[0] ?? null;

  return NextResponse.json({
    ok: true,
    data: latest,
  });
}
