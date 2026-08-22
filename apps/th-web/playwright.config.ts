import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Every spec shares one live API + one Postgres instance, several of which
  // reset shared demo/platform data in beforeEach — see apps/web/playwright.config.ts
  // for the identical rationale.
  workers: 1,
  webServer: {
    command: "npm run dev",
    port: 5174,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:5174",
  },
});
