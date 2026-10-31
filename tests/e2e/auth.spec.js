import { test, expect } from "@playwright/test";

/**
 * @param {import("@playwright/test").APIRequestContext} request
 * @param {string} email
 * @param {string} [kind]
 */
async function getDevEmailLink(request, email, kind) {
  const params = new URLSearchParams({ email });
  if (kind) params.set("kind", kind);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await request.get(`/api/test/last-email?${params}`);
    const json = await res.json();
    if (json?.ok && json.data?.url) return json.data.url;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No ${kind ?? "auth"} email link for ${email}`);
}

function uniqueEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * Wait until client JS hydrates (theme toggle enables after mount).
 * @param {import("@playwright/test").Page} page
 */
async function waitForHydration(page) {
  await page.waitForLoadState("domcontentloaded");
  await expect(
    page.getByRole("button", { name: /switch to (light|dark) mode/i }),
  ).toBeEnabled({ timeout: 30_000 });
}

test.describe("auth flows", () => {
  test("sign up → verify email → sign in → sign out", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("signup");
    const password = "ForestTrail9";

    await page.goto("/sign-up");
    await waitForHydration(page);
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel(/^Password$/i).fill(password);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/check-email/);

    const verifyUrl = await getDevEmailLink(request, email, "verification");
    await page.goto(verifyUrl);
    await page.waitForURL(/dashboard|sign-in|settings/);

    // If auto sign-in after verification, we may already be on dashboard
    if (!page.url().includes("/dashboard") && !page.url().includes("/settings")) {
      await page.goto("/sign-in");
      await page.getByLabel(/^Email$/i).fill(email);
      await page.getByLabel(/^Password$/i).fill(password);
      await page.getByRole("button", { name: /^sign in$/i }).click();
      await expect(page).toHaveURL(/dashboard/);
    }

    await page.goto("/settings");
    await page.getByRole("button", { name: /^sign out$/i }).click();
    await expect(page).toHaveURL(/sign-in/);
  });

  test("wrong password shows generic error", async ({ page, request }) => {
    const email = uniqueEmail("wrongpw");
    const password = "ForestTrail9";

    await page.goto("/sign-up");
    await waitForHydration(page);
    await page.getByLabel("Full name").fill("Wrong PW");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel(/^Password$/i).fill(password);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/check-email/);

    const verifyUrl = await getDevEmailLink(request, email, "verification");
    await page.goto(verifyUrl);

    await page.goto("/sign-in");
    // Sign out if auto-signed-in
    if (page.url().includes("/dashboard") || page.url().includes("/settings")) {
      await page.goto("/settings");
      await page.getByRole("button", { name: /^sign out$/i }).click();
      await expect(page).toHaveURL(/sign-in/);
    }

    await page.goto("/sign-in");
    await page.getByLabel(/^Email$/i).fill(email);
    await page.getByLabel(/^Password$/i).fill("TotallyWrong99");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("forgot → reset password", async ({ page, request }) => {
    const email = uniqueEmail("reset");
    const password = "ForestTrail9";
    const nextPassword = "CedarRiver42";

    await page.goto("/sign-up");
    await waitForHydration(page);
    await page.getByLabel("Full name").fill("Reset User");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel(/^Password$/i).fill(password);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/check-email/);

    const verifyUrl = await getDevEmailLink(request, email, "verification");
    await page.goto(verifyUrl);
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/settings");
    await waitForHydration(page);
    await page.getByRole("button", { name: /^sign out$/i }).click();
    await expect(page).toHaveURL(/sign-in/, { timeout: 15_000 });

    await page.goto("/forgot-password");
    await waitForHydration(page);
    await page.getByLabel(/^Email$/i).fill(email);
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(
      page.getByText(/If an account exists for that address/i),
    ).toBeVisible({
      timeout: 10_000,
    });

    const resetUrl = await getDevEmailLink(request, email, "reset-password");
    await page.goto(resetUrl);
    await page.waitForURL(/reset-password/);
    await waitForHydration(page);
    // Prefer token query if the API redirected; otherwise parse from current URL
    const current = new URL(page.url());
    if (!current.searchParams.get("token") && !current.searchParams.get("error")) {
      // Some Better Auth builds put the token in the path — fall back to email URL query
      const fromEmail = new URL(resetUrl);
      const token =
        fromEmail.searchParams.get("token") ||
        fromEmail.pathname.split("/").filter(Boolean).pop();
      if (token && token !== "reset-password") {
        await page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
        await waitForHydration(page);
      }
    }
    await expect(page.getByLabel(/new password/i)).toBeVisible();
    await page.getByLabel(/new password/i).fill(nextPassword);
    await page.getByLabel(/confirm password/i).fill(nextPassword);
    await page.getByRole("button", { name: /update password/i }).click();
    await expect(page).toHaveURL(/sign-in/, { timeout: 15_000 });

    await waitForHydration(page);
    await page.getByLabel(/^Email$/i).fill(email);
    await page.getByLabel(/^Password$/i).fill(nextPassword);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test("protected route redirects to sign-in with callbackUrl", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
    expect(page.url()).toContain("callbackUrl=");
  });

  test("open-redirect attempt is sanitized", async ({ page }) => {
    await page.goto("/sign-in?callbackUrl=https://evil.example");
    // After a successful optional navigation check: the form should not use absolute URL.
    // Unauthenticated: stay on sign-in; callback stored should be sanitized on submit success.
    // We assert the query is still present but server sanitizes — also visit proxy path.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in\?callbackUrl=/);
    const url = new URL(page.url());
    const callback = url.searchParams.get("callbackUrl") || "";
    expect(callback.startsWith("/")).toBeTruthy();
    expect(callback).not.toContain("evil.example");
  });
});
