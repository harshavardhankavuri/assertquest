#!/usr/bin/env node
// Thin wrapper around the local dev Postgres cluster in .devdata/, so npm scripts
// don't have to deal with shell-quoting a "C:\Program Files\..." path with spaces.
// Temporary until the containerized (docker-compose / podman-compose) setup is the
// primary dev path — see docs/self-host.md.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = path.join(repoRoot, ".devdata", "pgdata");
const logFile = path.join(repoRoot, ".devdata", "pg.log");

const PG_CTL_CANDIDATES = [
  "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_ctl.exe",
  "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_ctl.exe",
  "C:\\Program Files\\PostgreSQL\\15\\bin\\pg_ctl.exe",
  "pg_ctl", // fall back to PATH (macOS/Linux, or PATH-configured Windows installs)
];

const pgCtl = PG_CTL_CANDIDATES.find((p) => p === "pg_ctl" || existsSync(p));

const command = process.argv[2];
if (!["start", "stop", "status"].includes(command)) {
  console.error("Usage: node scripts/db.mjs <start|stop|status>");
  process.exit(1);
}

const args = ["-D", dataDir, "-o", "-p 5433"];
if (command === "start") args.push("-l", logFile, "start");
else args.push(command);

try {
  execFileSync(pgCtl, args, { stdio: "inherit" });
} catch (err) {
  process.exit(err.status ?? 1);
}
