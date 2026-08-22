import { test, expect } from "@playwright/test";

test.describe("Module 8 — Reporting", () => {
  test.beforeEach(async ({ baseURL }) => {
    const apiOrigin = new URL(baseURL ?? "http://localhost:5173").origin;
    await fetch(`${apiOrigin}/api/test/reset?module=auth`, { method: "POST" });
    await fetch(`${apiOrigin}/api/test/reset?module=booking`, { method: "POST" });
    await fetch(`${apiOrigin}/api/test/reset?module=reporting`, { method: "POST" });
  });

  test("shows chart data and generates a downloadable scheduled report", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("dispatcher@swiftcargo.test");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("link", { name: "Reporting" }).click();
    await expect(page.getByRole("heading", { name: "Reporting" })).toBeVisible();

    await expect(page.getByText(/shipments,.*total revenue/)).toBeVisible();
    await expect(page.getByRole("img", { name: /Shipment volume/ })).toBeVisible();

    await page.getByRole("button", { name: "Generate CSV Report" }).click();
    await expect(page.getByRole("link", { name: "Download CSV" })).toBeVisible({ timeout: 10000 });
  });
});
