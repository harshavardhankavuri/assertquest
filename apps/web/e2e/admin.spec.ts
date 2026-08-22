import { test, expect } from "@playwright/test";

test.describe("Module 6 — Admin Console", () => {
  test.beforeEach(async ({ baseURL }) => {
    const apiOrigin = new URL(baseURL ?? "http://localhost:5173").origin;
    await fetch(`${apiOrigin}/api/test/reset?module=auth`, { method: "POST" });
    await fetch(`${apiOrigin}/api/test/reset?module=booking`, { method: "POST" });
    await fetch(`${apiOrigin}/api/test/reset?module=admin`, { method: "POST" });
  });

  test("bulk-cancels a shipment and shows a per-item result", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@swiftcargo.test");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("link", { name: "Admin Console" }).click();
    await expect(page.getByRole("heading", { name: "Admin Console" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Feature Flags" })).toBeVisible();
    await expect(page.locator("li", { hasText: "priorityLane:" })).toBeVisible();

    const firstCheckbox = page.locator('section:has(h2:text("Bulk Shipment Actions")) input[type="checkbox"]').first();
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.check();

    await page.getByRole("button", { name: "Cancel selected" }).click();

    const status = page.getByRole("status").filter({ hasText: "succeeded" });
    await expect(status).toContainText("1 succeeded, 0 failed");
  });
});
