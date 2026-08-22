import { z } from "zod";
import { LEADERBOARD_RANGES } from "@assertquest/shared";

export const leaderboardQuerySchema = z.object({
  module: z.string().optional(),
  range: z.enum(LEADERBOARD_RANGES).default("all"),
});

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
