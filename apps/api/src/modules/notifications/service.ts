import { prisma } from "../../core/db.js";
import { ApiError } from "../../core/errors.js";
import { enqueue } from "../../core/queue.js";
import type { Notification, MockMessage, NotificationListResponse } from "@assertquest/shared";
import type {
  Notification as PrismaNotification,
  MockMessage as PrismaMockMessage,
} from "@prisma/client";

function toPublicNotification(n: PrismaNotification): Notification {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

function toPublicMessage(m: PrismaMockMessage): MockMessage {
  return {
    id: m.id,
    channel: m.channel,
    to: m.to,
    subject: m.subject,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  };
}

// No real phone numbers exist anywhere in SwiftCargo — this deterministically
// derives a fake one from the user id so "sms to" is stable and greppable per user.
function mockPhoneForUser(userId: string): string {
  const digits = userId.replace(/-/g, "").slice(0, 7);
  return `+1555${digits}`;
}

interface NotifyOptions {
  email?: boolean;
  sms?: boolean;
}

// Enqueues an in-app notification and, optionally, mock email/SMS delivery
// (FR-1201/FR-1202) — nothing is written until the queued job runs (FR-1203), so
// callers (and testers) must wait/poll rather than assume immediate delivery.
export function notify(userId: string, type: string, title: string, body: string, options: NotifyOptions = {}): void {
  enqueue(async () => {
    await prisma.notification.create({ data: { userId, type, title, body } });

    if (!options.email && !options.sms) return;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    if (options.email) {
      await prisma.mockMessage.create({ data: { channel: "email", to: user.email, subject: title, body } });
    }
    if (options.sms) {
      await prisma.mockMessage.create({ data: { channel: "sms", to: mockPhoneForUser(user.id), body } });
    }
  });
}

export async function listNotifications(userId: string): Promise<NotificationListResponse> {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return { notifications: notifications.map(toPublicNotification), unreadCount };
}

export async function markRead(id: string, userId: string): Promise<Notification> {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw ApiError.notFound("Notification not found");
  if (notification.userId !== userId) throw ApiError.forbidden("You do not have access to this notification");

  const updated = await prisma.notification.update({ where: { id }, data: { read: true } });
  return toPublicNotification(updated);
}

export async function markAllRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  return result.count;
}

export async function listOutbox(to?: string): Promise<MockMessage[]> {
  const messages = await prisma.mockMessage.findMany({
    where: to ? { to } : {},
    orderBy: { createdAt: "desc" },
  });
  return messages.map(toPublicMessage);
}
