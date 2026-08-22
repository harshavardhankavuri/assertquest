import { test, expect } from "@playwright/test";

async function loginAsCustomer(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("customer@swiftcargo.test");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
}

test.describe("booking-standard-second-thoughts: wizard back-navigation", () => {
  test("Origin/Destination survives Back, but Package Details is reset (FR-702 bug)", async ({ page }) => {
    await loginAsCustomer(page);
    await page.getByRole("link", { name: "Book a Shipment" }).click();

    const originField = page.getByRole("textbox", { name: "Origin", exact: true });
    const destinationField = page.getByRole("textbox", { name: "Destination", exact: true });
    const weightField = page.getByRole("spinbutton", { name: "Weight (kg)" });
    const lengthField = page.getByRole("spinbutton", { name: "Length (cm)" });
    const widthField = page.getByRole("spinbutton", { name: "Width (cm)" });
    const heightField = page.getByRole("spinbutton", { name: "Height (cm)" });

    await originField.fill("Los Angeles");
    await page.getByRole("button", { name: "Port of Los Angeles, CA, USA" }).click();
    await destinationField.fill("Rotterdam");
    await page.getByRole("button", { name: "Port of Rotterdam, Netherlands" }).click();
    await page.getByRole("button", { name: "Next: Package Details" }).click();

    await weightField.fill("120");
    await lengthField.fill("60");
    await widthField.fill("50");
    await heightField.fill("40");
    await page.getByRole("button", { name: "Next: Pricing" }).click();

    await expect(page.getByText(/km$/)).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("heading", { name: "Package Details" })).toBeVisible();

    // Bug: package fields reset to empty instead of restoring the entered values.
    await expect(weightField).toHaveValue("");
    await expect(lengthField).toHaveValue("");

    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("heading", { name: "Origin & Destination" })).toBeVisible();

    // Correct: origin/destination are preserved across the same kind of back-navigation.
    await expect(originField).toHaveValue("Port of Los Angeles, CA, USA");
    await expect(destinationField).toHaveValue("Port of Rotterdam, Netherlands");
  });
});
