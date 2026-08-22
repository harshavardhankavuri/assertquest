export const CHALLENGE_DIFFICULTIES = ["light", "standard", "heavy", "bulk"] as const;
export type ChallengeDifficulty = (typeof CHALLENGE_DIFFICULTIES)[number];

export const CHALLENGE_SURFACES = ["api", "db", "ui"] as const;
export type ChallengeSurface = (typeof CHALLENGE_SURFACES)[number];

export type ChallengeStatus = "open" | "in_progress" | "cleared";

export interface Challenge {
  id: string;
  module: string;
  title: string;
  difficulty: ChallengeDifficulty;
  surfaceTags: ChallengeSurface[];
  estimatedMinutes: number;
  description: string;
  successCondition: string;
  hints: string[];
}
