import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
}

// This spec asserts an exact status transition ("booked" -> "in_transit" from a
// single Advance click), so it needs the API's background GPS feed disabled
// (TRACKING_SIMULATION_ENABLED=false) — otherwise the live simulation loop can
// advance the shipment before or between the test's own assertions. The vitest
// suite disables this via vitest.config.ts; run the API the same way for this
// spec (see docs/self-host.md).
test.describe("Module 3 — Tracking dashboard", () => {
  test.beforeEach(async ({ baseURL }) => {
    // Reset to a fresh "booked" shipment so this test isn't racing the live
    // background GPS feed (FR-802), which may already have advanced a
    // previously-seeded shipment before this test gets to click Advance itself.
    const apiOrigin = new URL(baseURL ?? "http://localhost:5173").origin;
    await fetch(`${apiOrigin}/api/test/reset?module=auth`, { method: "POST" });
    await fetch(`${apiOrigin}/api/test/reset?module=booking`, { method: "POST" });
  });

  test("dispatcher sees live status update after advancing a shipment", async ({ page }) => {
    await login(page, "dispatcher@swiftcargo.test");
    await page.getByRole("link", { name: "Tracking" }).click();
    await expect(page.getByRole("heading", { name: "Shipment Tracking" })).toBeVisible();

    await expect(page.getByText("Connecting to live updates…")).toHaveCount(0, { timeout: 5000 });

    const firstRow = page.locator("tbody tr").first();
    const statusCell = firstRow.locator("td").nth(3);
    await expect(statusCell).toHaveText("booked", { timeout: 5000 });

    await firstRow.getByRole("button", { name: "Advance" }).click();
    await expect(statusCell).toHaveText("in_transit", { timeout: 5000 });
  });
});
