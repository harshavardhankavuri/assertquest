import { prisma } from "../../core/db.js";
import type { LeaderboardQuery } from "./leaderboardSchema.js";
import type { LeaderboardEntry, ActivityEntry } from "@assertquest/shared";

function rangeStart(range: LeaderboardQuery["range"]): Date | undefined {
  const now = Date.now();
  if (range === "week") return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (range === "month") return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return undefined;
}

// Ranks users by challenges cleared (FR-402), anonymized by default — the
// displayName is shown unless the user opted into publicRealName, in which case
// their email is shown instead (FR-403).
export async function getLeaderboard(query: LeaderboardQuery): Promise<LeaderboardEntry[]> {
  const since = rangeStart(query.range);

  const progress = await prisma.tHProgress.findMany({
    where: {
      status: "cleared",
      ...(since ? { clearedAt: { gte: since } } : {}),
      ...(query.module ? { challenge: { module: query.module } } : {}),
    },
    select: { userId: true },
  });

  const countByUser = new Map<string, number>();
  for (const p of progress) {
    countByUser.set(p.userId, (countByUser.get(p.userId) ?? 0) + 1);
  }
  if (countByUser.size === 0) return [];

  const users = await prisma.tHUser.findMany({ where: { id: { in: [...countByUser.keys()] } } });
  const userById = new Map(users.map((u) => [u.id, u]));

  return [...countByUser.entries()]
    .map(([userId, clearedCount]) => {
      const user = userById.get(userId)!;
      return { userId, name: user.publicRealName ? user.email : user.displayName, clearedCount };
    })
    .sort((a, b) => b.clearedCount - a.clearedCount)
    .map((entry, i) => ({ rank: i + 1, ...entry }));
}

// Recent solved-challenge activity across all users, for the Community page
// (FR-401) — same anonymization rule as the leaderboard.
export async function getRecentActivity(limit = 20): Promise<ActivityEntry[]> {
  const recent = await prisma.tHProgress.findMany({
    where: { status: "cleared", clearedAt: { not: null } },
    orderBy: { clearedAt: "desc" },
    take: limit,
    include: { user: true, challenge: true },
  });

  return recent.map((p) => ({
    userId: p.userId,
    name: p.user.publicRealName ? p.user.email : p.user.displayName,
    challengeId: p.challengeId,
    challengeTitle: p.challenge.title,
    clearedAt: p.clearedAt!.toISOString(),
  }));
}
