import { prisma } from "../../core/db.js";
import { ApiError } from "../../core/errors.js";
import { getModule } from "../../core/moduleRegistry.js";
import type { ListChallengesQuery } from "./challengesSchema.js";
import type { Challenge, ChallengeListItem, ChallengeListResponse, ProfileSummary } from "@assertquest/shared";
import type { THChallenge as PrismaTHChallenge, Prisma } from "@prisma/client";

function toChallenge(c: PrismaTHChallenge): Challenge {
  return {
    id: c.id,
    module: c.module,
    title: c.title,
    difficulty: c.difficulty,
    surfaceTags: c.surfaceTags as Challenge["surfaceTags"],
    estimatedMinutes: c.estimatedMinutes,
    description: c.description,
    successCondition: c.successCondition,
    hints: c.hints,
  };
}

// Board listing (FR-201..FR-204): filterable by module/difficulty/surface, free-text
// search across title+description, paginated. `userId` is optional — anonymous
// visitors get the full board (FR-101), just without a `status` column (FR-206).
export async function listChallenges(query: ListChallengesQuery, userId?: string): Promise<ChallengeListResponse> {
  const where: Prisma.THChallengeWhereInput = {
    ...(query.module ? { module: query.module } : {}),
    ...(query.class ? { difficulty: query.class } : {}),
    ...(query.surface ? { surfaceTags: { has: query.surface } } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.tHChallenge.findMany({
      where,
      orderBy: [{ module: "asc" }, { difficulty: "asc" }, { id: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.tHChallenge.count({ where }),
  ]);

  let statusByChallengeId = new Map<string, ChallengeListItem["status"]>();
  if (userId) {
    const progress = await prisma.tHProgress.findMany({
      where: { userId, challengeId: { in: rows.map((r) => r.id) } },
    });
    statusByChallengeId = new Map(progress.map((p) => [p.challengeId, p.status]));
  }

  const challenges: ChallengeListItem[] = rows.map((r) => ({
    ...toChallenge(r),
    ...(userId ? { status: statusByChallengeId.get(r.id) ?? "open" } : {}),
  }));

  return { challenges, total, page: query.page, pageSize: query.pageSize };
}

export async function getChallenge(id: string, userId?: string): Promise<ChallengeListItem> {
  const challenge = await prisma.tHChallenge.findUnique({ where: { id } });
  if (!challenge) throw ApiError.notFound("Challenge not found");

  let status: ChallengeListItem["status"];
  if (userId) {
    const progress = await prisma.tHProgress.findUnique({
      where: { userId_challengeId: { userId, challengeId: id } },
    });
    status = progress?.status ?? "open";
  }

  return { ...toChallenge(challenge), ...(userId ? { status } : {}) };
}

export async function relatedChallenges(id: string): Promise<Challenge[]> {
  const challenge = await prisma.tHChallenge.findUnique({ where: { id } });
  if (!challenge) throw ApiError.notFound("Challenge not found");

  const related = await prisma.tHChallenge.findMany({
    where: { module: challenge.module, id: { not: id } },
    orderBy: { difficulty: "asc" },
  });
  return related.map(toChallenge);
}

// Delegates to the SwiftCargo module's own seed/reset lifecycle (FR-305) — the
// same endpoint the test-control API uses, just scoped to one challenge's module
// and reachable without an account, matching the sandbox's "always resettable"
// design.
export async function resetChallenge(id: string): Promise<void> {
  const challenge = await prisma.tHChallenge.findUnique({ where: { id } });
  if (!challenge) throw ApiError.notFound("Challenge not found");

  const mod = getModule(challenge.module);
  if (!mod) throw ApiError.notFound(`No reset available for module "${challenge.module}"`);
  await mod.reset();
}

export async function startChallenge(id: string, userId: string): Promise<void> {
  const challenge = await prisma.tHChallenge.findUnique({ where: { id } });
  if (!challenge) throw ApiError.notFound("Challenge not found");

  const existing = await prisma.tHProgress.findUnique({ where: { userId_challengeId: { userId, challengeId: id } } });
  if (existing) return; // don't downgrade "cleared" back to "in_progress"

  await prisma.tHProgress.create({ data: { userId, challengeId: id, status: "in_progress" } });
}

export async function clearChallenge(id: string, userId: string): Promise<void> {
  const challenge = await prisma.tHChallenge.findUnique({ where: { id } });
  if (!challenge) throw ApiError.notFound("Challenge not found");

  await prisma.tHProgress.upsert({
    where: { userId_challengeId: { userId, challengeId: id } },
    update: { status: "cleared", clearedAt: new Date() },
    create: { userId, challengeId: id, status: "cleared", clearedAt: new Date() },
  });
}

// Per-module progress reset (FR-104) — clears only this user's THProgress rows,
// never other users' or the underlying challenge/module data itself.
export async function resetProgress(userId: string, module?: string): Promise<void> {
  await prisma.tHProgress.deleteMany({
    where: { userId, ...(module ? { challenge: { module } } : {}) },
  });
}

export async function getProfile(userId: string): Promise<ProfileSummary> {
  const user = await prisma.tHUser.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");

  const [allChallenges, progress] = await Promise.all([
    prisma.tHChallenge.findMany({ select: { id: true, module: true } }),
    prisma.tHProgress.findMany({ where: { userId, status: "cleared" } }),
  ]);

  const clearedIds = new Set(progress.map((p) => p.challengeId));
  const byModuleMap = new Map<string, { totalChallenges: number; cleared: number }>();
  for (const c of allChallenges) {
    const entry = byModuleMap.get(c.module) ?? { totalChallenges: 0, cleared: 0 };
    entry.totalChallenges += 1;
    if (clearedIds.has(c.id)) entry.cleared += 1;
    byModuleMap.set(c.module, entry);
  }

  return {
    userId: user.id,
    displayName: user.displayName,
    totalChallenges: allChallenges.length,
    totalCleared: clearedIds.size,
    byModule: [...byModuleMap.entries()]
      .map(([module, v]) => ({ module, ...v }))
      .sort((a, b) => a.module.localeCompare(b.module)),
  };
}
