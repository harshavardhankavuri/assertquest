import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Accessibility smoke test (PRD §9 DoD item 5): axe-core must be clean on Module 1's
// primary UI. Extend this file with one check per module as new pages ship.
test.describe("Module 1 — Auth accessibility", () => {
  test("login page has no axe-core violations", async ({ page }) => {
    await page.goto("/login");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("register page has no axe-core violations", async ({ page }) => {
    await page.goto("/register");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Module 2 — Booking accessibility", () => {
  test("booking wizard's first step has no axe-core violations", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("customer@swiftcargo.test");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("link", { name: "Book a Shipment" }).click();
    await expect(page.getByRole("heading", { name: "Origin & Destination" })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Module 3 — Tracking accessibility", () => {
  test("tracking dashboard has no axe-core violations", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("dispatcher@swiftcargo.test");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("link", { name: "Tracking" }).click();
    await expect(page.getByRole("heading", { name: "Shipment Tracking" })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Module 5 — Billing accessibility", () => {
  test("billing page has no axe-core violations", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("customer@swiftcargo.test");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("link", { name: "Billing" }).click();
    await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Module 4 — Fleet accessibility", () => {
  test("fleet board has no axe-core violations", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("dispatcher@swiftcargo.test");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("link", { name: "Fleet & Scheduling" }).click();
    await expect(page.getByRole("heading", { name: "Fleet & Scheduling" })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Module 6 — Admin accessibility", () => {
  test("admin console has no axe-core violations", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@swiftcargo.test");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("link", { name: "Admin Console" }).click();
    await expect(page.getByRole("heading", { name: "Admin Console" })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Module 7 — Notifications accessibility", () => {
  test("the notification bell dropdown has no axe-core violations", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("customer@swiftcargo.test");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("button", { name: "Notifications" }).click();
    await expect(page.getByRole("region", { name: "Notifications" })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Module 8 — Reporting accessibility", () => {
  test("reporting page has no axe-core violations", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("dispatcher@swiftcargo.test");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("link", { name: "Reporting" }).click();
    await expect(page.getByRole("heading", { name: "Reporting" })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
