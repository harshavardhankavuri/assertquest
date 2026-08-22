import { prisma } from "./db.js";
import type { Prisma } from "@prisma/client";

// Audit log (FR-1101, Module 6): a plain "who did what, when" trail. Any module can
// call this — currently auth (login/register) and admin's own bulk/import
// endpoints do.
export async function recordAudit(
  actorId: string,
  action: string,
  options?: { targetType?: string; targetId?: string; metadata?: Prisma.InputJsonValue },
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType: options?.targetType,
      targetId: options?.targetId,
      metadata: options?.metadata,
    },
  });
}
