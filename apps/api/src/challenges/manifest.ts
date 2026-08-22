import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Challenge } from "@assertquest/shared";

// docs/challenges/<module>/*.json is the single source of truth for challenge
// metadata (FR-1402) — loaded here rather than duplicated in seed code.
const CHALLENGES_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../docs/challenges",
);

export async function loadModuleChallenges(moduleName: string): Promise<Challenge[]> {
  const dir = path.join(CHALLENGES_ROOT, moduleName);
  let files: string[];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }

  const challenges: Challenge[] = [];
  for (const file of files) {
    const raw = await readFile(path.join(dir, file), "utf-8");
    challenges.push(JSON.parse(raw) as Challenge);
  }
  return challenges.sort((a, b) => a.id.localeCompare(b.id));
}
