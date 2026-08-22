import { randomInt } from "node:crypto";

const ADJECTIVES = ["swift", "steady", "quiet", "bold", "keen", "brisk", "sharp", "calm"];
const NOUNS = ["harbor", "compass", "anchor", "beacon", "voyager", "cargo", "tide", "current"];

// Generates an anonymized public handle at registration time — the leaderboard
// and discussion threads show this by default, never the account email, unless
// the user opts in to `publicRealName` (FR-403).
export function generateDisplayName(): string {
  const adjective = ADJECTIVES[randomInt(ADJECTIVES.length)];
  const noun = NOUNS[randomInt(NOUNS.length)];
  const suffix = randomInt(1000, 10000);
  return `${adjective}-${noun}-${suffix}`;
}
