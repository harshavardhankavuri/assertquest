import "dotenv/config";
import "../src/modules/auth/seed.js";
import "../src/modules/booking/seed.js";
import "../src/modules/tracking/seed.js";
import "../src/modules/billing/seed.js";
import "../src/modules/fleet/seed.js";
import "../src/modules/admin/seed.js";
import "../src/modules/notifications/seed.js";
import "../src/modules/reporting/seed.js";
// selfhost-mirror:strip-start
import "../src/modules/thPlatform/seed.js";
// selfhost-mirror:strip-end
import { allModuleNames, getModule } from "../src/core/moduleRegistry.js";

async function main() {
  for (const name of allModuleNames()) {
    console.log(`Seeding module: ${name}`);
    await getModule(name)!.seed();
  }
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
