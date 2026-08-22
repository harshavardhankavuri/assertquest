import { z } from "zod";
import { CHALLENGE_DIFFICULTIES, CHALLENGE_SURFACES } from "@assertquest/shared";

export const listChallengesQuerySchema = z.object({
  module: z.string().optional(),
  class: z.enum(CHALLENGE_DIFFICULTIES).optional(),
  surface: z.enum(CHALLENGE_SURFACES).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListChallengesQuery = z.infer<typeof listChallengesQuerySchema>;
