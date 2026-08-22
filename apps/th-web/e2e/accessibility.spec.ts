import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("AssertQuest platform accessibility", () => {
  test("home page has no axe-core violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

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

  test("challenge board has no axe-core violations", async ({ page }) => {
    await page.goto("/challenges");
    await expect(page.getByRole("heading", { name: "Challenge Board" })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("a challenge page has no axe-core violations", async ({ page }) => {
    await page.goto("/challenges/auth-light-first-voyage");
    await expect(page.getByRole("heading", { name: "First Voyage" })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("leaderboard has no axe-core violations", async ({ page }) => {
    await page.goto("/leaderboard");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("community page has no axe-core violations", async ({ page }) => {
    await page.goto("/community");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
