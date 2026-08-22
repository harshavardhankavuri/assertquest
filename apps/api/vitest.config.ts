import "dotenv/config";
import { defineConfig } from "vitest/config";

// Disable the tracking module's background GPS simulation loop before any test file
// imports app.ts — tracking tests advance shipments explicitly via POST /:id/advance
// so assertions stay deterministic instead of racing a live timer.
process.env.TRACKING_SIMULATION_ENABLED = "false";
// The notification queue (FR-1203) is genuinely async by design — keep the default
// delay short in tests so assertions that wait for it stay fast, without making it
// zero (that would defeat the point of testing async delivery at all).
process.env.NOTIFICATION_QUEUE_DELAY_MS = "50";
// Tests cover the thPlatform module (challenge board auth etc.) even though it's
// off by default — self-hosted deployments don't enable it, only the hosted one does.
process.env.ENABLE_ASSERTQUEST_PLATFORM = "true";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 20000,
    hookTimeout: 20000,
    // Integration tests share one Postgres instance and each module's beforeAll
    // resets shared demo users (e.g. auth's reset() touching customer@swiftcargo.test),
    // so files must not run concurrently or resets race each other.
    fileParallelism: false,
  },
});
