#!/usr/bin/env node
// Opens an interactive psql shell against the local dev Postgres cluster (.devdata/),
// pre-connected to the assertquest DB, so you can practice SQL directly against the
// seeded schema. Temporary until the containerized setup is the primary dev path.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const PSQL_CANDIDATES = [
  "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
  "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
  "C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe",
  "psql", // fall back to PATH (macOS/Linux, or PATH-configured Windows installs)
];

const psql = PSQL_CANDIDATES.find((p) => p === "psql" || existsSync(p));

const args = ["-h", "localhost", "-p", "5433", "-U", "assertquest", "-d", "assertquest", ...process.argv.slice(2)];

try {
  execFileSync(psql, args, {
    stdio: "inherit",
    env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD ?? "assertquest" },
  });
} catch (err) {
  process.exit(err.status ?? 1);
}
