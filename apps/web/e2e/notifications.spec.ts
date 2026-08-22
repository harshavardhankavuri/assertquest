import { test, expect } from "@playwright/test";

test.describe("Module 7 — Notifications", () => {
  test.beforeEach(async ({ baseURL }) => {
    const apiOrigin = new URL(baseURL ?? "http://localhost:5173").origin;
    await fetch(`${apiOrigin}/api/test/reset?module=auth`, { method: "POST" });
    await fetch(`${apiOrigin}/api/test/reset?module=booking`, { method: "POST" });
    await fetch(`${apiOrigin}/api/test/reset?module=notifications`, { method: "POST" });
  });

  test("a booking confirmation notification appears in the bell after the async delay", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("customer@swiftcargo.test");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Log in" }).click();

    await page.getByRole("link", { name: "Book a Shipment" }).click();
    await page.getByRole("textbox", { name: "Origin", exact: true }).fill("Los Angeles");
    await page.getByRole("button", { name: "Port of Los Angeles, CA, USA" }).click();
    await page.getByRole("textbox", { name: "Destination", exact: true }).fill("Rotterdam");
    await page.getByRole("button", { name: "Port of Rotterdam, Netherlands" }).click();
    await page.getByRole("button", { name: "Next: Package Details" }).click();
    await page.getByRole("spinbutton", { name: "Weight (kg)" }).fill("100");
    await page.getByRole("spinbutton", { name: "Length (cm)" }).fill("50");
    await page.getByRole("spinbutton", { name: "Width (cm)" }).fill("40");
    await page.getByRole("spinbutton", { name: "Height (cm)" }).fill("30");
    await page.getByRole("button", { name: "Next: Pricing" }).click();
    await page.getByRole("button", { name: "Next: Confirm" }).click();
    await page.getByRole("button", { name: "Confirm booking" }).click();
    await expect(page.getByRole("heading", { name: "Shipment Booked" })).toBeVisible();

    await page.getByRole("button", { name: "Notifications" }).click();
    await expect(page.getByText("Shipment booked")).toBeVisible({ timeout: 10000 });
  });
});
