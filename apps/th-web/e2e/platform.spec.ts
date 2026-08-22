import { test, expect } from "@playwright/test";

test.describe("AssertQuest platform", () => {
  test.beforeEach(async ({ baseURL }) => {
    const apiOrigin = new URL(baseURL ?? "http://localhost:5174").origin.replace(":5174", ":4000");
    await fetch(`${apiOrigin}/api/test/seed?module=auth`, { method: "POST" });
    await fetch(`${apiOrigin}/api/test/reset?module=thPlatform`, { method: "POST" });
  });

  test("filtering the board updates the URL, and a filtered link reproduces the same view", async ({ page }) => {
    await page.goto("/challenges");
    await page.getByLabel("Module").fill("auth");
    await expect(page).toHaveURL(/module=auth/);
    await expect(page.getByRole("cell", { name: "auth" }).first()).toBeVisible();

    // Reload the same URL fresh — the filtered view must reproduce identically (FR-204).
    await page.reload();
    await expect(page.getByLabel("Module")).toHaveValue("auth");
    await expect(page.getByRole("cell", { name: "auth" }).first()).toBeVisible();
  });

  test("registering, clearing a challenge, and seeing it reflected in profile and leaderboard", async ({ page }) => {
    const email = `learner-${Date.now()}@example.test`;
    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("PracticeMakesPerfect1");
    const [registerResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/th/auth/register")),
      page.getByRole("button", { name: "Register" }).click(),
    ]);
    expect(registerResponse.status()).toBe(201);
    await expect(page.getByRole("heading", { name: "AssertQuest" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("th_access_token"))).toBeTruthy();

    await page.goto("/challenges/auth-light-first-voyage");
    await expect(page.getByRole("heading", { name: "First Voyage" })).toBeVisible();

    // Progressive hints: only the first hint shows until revealed.
    const hints = page.locator("#hints-heading ~ ol li");
    await expect(hints).toHaveCount(1);
    await page.getByRole("button", { name: /Show next hint/ }).click();
    await expect(hints).toHaveCount(2);

    await page.getByRole("button", { name: "Reset this scenario" }).click();
    await expect(page.getByText("Scenario reset.")).toBeVisible();

    await page.getByRole("button", { name: "Mark cleared" }).click();
    await expect(page.getByText("cleared")).toBeVisible();

    // Post to the discussion thread. The body is unique per run (discussion posts
    // are never reset between test runs) and the assertion targets the post's <li>
    // specifically — a bare getByText would also match the textarea's own value
    // text, which is ambiguous while it's still holding what was just typed.
    const postBody = `Registered, logged in, checked the token. (${email})`;
    await page.getByLabel("Share your approach").fill(postBody);
    await page.getByRole("button", { name: "Post" }).click();
    await expect(page.locator("li", { hasText: postBody })).toBeVisible();

    // Profile reflects the clear. The nav's account area holds exactly one link
    // (the display-name link to the caller's own profile) before the logout button.
    await page.locator("header div").last().locator("a").first().click();
    await expect(page.getByText(/1 of \d+ challenges cleared/)).toBeVisible();

    // Leaderboard shows this learner.
    await page.goto("/leaderboard");
    await expect(page.locator("tbody tr", { hasText: "1" }).first()).toBeVisible();
  });
});
