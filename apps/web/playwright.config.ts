import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Every spec file shares one live API + one Postgres instance, and several
  // reset shared demo data (auth/booking/fleet) in beforeEach. Running spec files
  // across parallel workers lets those resets interleave and wipe out data another
  // file is mid-test with — same reason apps/api/vitest.config.ts disables
  // fileParallelism. Run serially here too.
  workers: 1,
  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:5173",
  },
});
