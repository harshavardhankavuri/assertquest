import { test, expect } from "@playwright/test";

test.describe("Module 5 — Billing", () => {
  test("generates an invoice, retries after a decline, and ends up paid", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("customer@swiftcargo.test");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("link", { name: "Billing" }).click();
    await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();

    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();

    const generateButton = firstRow.getByRole("button", { name: "Generate Invoice" });
    if (await generateButton.isVisible()) {
      await generateButton.click();
    }

    const cardInput = firstRow.locator('input[name="cardNumber"]');
    await expect(cardInput).toBeVisible();

    // Decline test card first.
    await cardInput.fill("4000000000000002");
    await firstRow.getByRole("button", { name: "Pay" }).click();
    await expect(firstRow).toContainText("declined", { timeout: 5000 });

    // Retry with a valid card.
    await cardInput.fill("4242424242424242");
    await firstRow.getByRole("button", { name: "Pay" }).click();
    await expect(firstRow).toContainText("paid", { timeout: 5000 });
    await expect(firstRow.getByRole("link", { name: "Download PDF" })).toBeVisible();
  });
});
