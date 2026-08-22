import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
}

async function apiLogin(apiOrigin: string, email: string): Promise<string> {
  const res = await fetch(`${apiOrigin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Password123!" }),
  });
  const body = await res.json();
  return body.tokens.accessToken;
}

test.describe("Module 4 — Fleet & Scheduling", () => {
  let apiOrigin: string;

  test.beforeEach(async ({ baseURL }) => {
    apiOrigin = new URL(baseURL ?? "http://localhost:5173").origin;
    await fetch(`${apiOrigin}/api/test/reset?module=auth`, { method: "POST" });
    await fetch(`${apiOrigin}/api/test/reset?module=booking`, { method: "POST" });
    await fetch(`${apiOrigin}/api/test/reset?module=fleet`, { method: "POST" });
  });

  test("assigns a shipment via drag-and-drop onto a vehicle column", async ({ page }) => {
    await login(page, "dispatcher@swiftcargo.test");
    await page.getByRole("link", { name: "Fleet & Scheduling" }).click();
    await expect(page.getByRole("heading", { name: "Fleet & Scheduling" })).toBeVisible();

    const card = page.locator('li[draggable="true"]').first();
    await expect(card).toBeVisible();
    const vehicleColumn = page.locator("h3", { hasText: "Van 1" }).locator("xpath=..");

    await card.dragTo(vehicleColumn);

    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(1, { timeout: 5000 });
  });

  test("shows a visible conflict banner for a double-booked driver (fleet-heavy-silent-alarm)", async ({
    page,
  }) => {
    const dispatcherToken = await apiLogin(apiOrigin, "dispatcher@swiftcargo.test");
    const customerToken = await apiLogin(apiOrigin, "customer@swiftcargo.test");

    const origin = { label: "Port of Los Angeles, CA, USA", lat: 33.7395, lng: -118.2597 };
    const destination = { label: "Port of Rotterdam, Netherlands", lat: 51.9496, lng: 4.1453 };
    const pkg = { weightKg: 100, lengthCm: 50, widthCm: 40, heightCm: 30 };

    async function bookShipment() {
      const res = await fetch(`${apiOrigin}/api/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({ origin, destination, package: pkg }),
      });
      return (await res.json()).shipment.id as string;
    }

    const shipmentA = await bookShipment();
    const shipmentB = await bookShipment();

    const vehiclesRes = await fetch(`${apiOrigin}/api/fleet/vehicles`, {
      headers: { Authorization: `Bearer ${dispatcherToken}` },
    });
    const vehicles = (await vehiclesRes.json()).vehicles;
    const driversRes = await fetch(`${apiOrigin}/api/fleet/drivers`, {
      headers: { Authorization: `Bearer ${dispatcherToken}` },
    });
    const driver = (await driversRes.json()).drivers[0];

    async function assign(shipmentId: string, vehicleId: string, start: string, end: string) {
      await fetch(`${apiOrigin}/api/fleet/assignments/${shipmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${dispatcherToken}` },
        body: JSON.stringify({ vehicleId, driverId: driver.id, scheduledStart: start, scheduledEnd: end }),
      });
    }

    await assign(shipmentA, vehicles[0].id, "2026-09-05T08:00:00.000Z", "2026-09-05T10:00:00.000Z");
    await assign(shipmentB, vehicles[1].id, "2026-09-05T09:00:00.000Z", "2026-09-05T11:00:00.000Z");

    await login(page, "dispatcher@swiftcargo.test");
    await page.getByRole("link", { name: "Fleet & Scheduling" }).click();

    const banner = page.getByRole("alert");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("double-booked");
  });
});
