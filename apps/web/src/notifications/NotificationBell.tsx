import { useCallback, useEffect, useState } from "react";
import type { Notification } from "@assertquest/shared";
import { useAuth } from "../auth/AuthContext.js";
import { api } from "../lib/api.js";

const POLL_MS = 5000;

// In-app notification center (FR-1202) — a small dropdown in the nav. Polls
// rather than pushing, since notifications arrive asynchronously (FR-1203) and
// there's no dedicated notification WebSocket (unlike tracking's).
export function NotificationBell() {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!accessToken) return;
    const res = await api.listNotifications(accessToken);
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  }, [accessToken]);

  useEffect(() => {
    reload();
    const interval = setInterval(reload, POLL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  async function onMarkRead(id: string) {
    if (!accessToken) return;
    await api.markNotificationRead(id, accessToken);
    await reload();
  }

  async function onMarkAllRead() {
    if (!accessToken) return;
    await api.markAllNotificationsRead(accessToken);
    await reload();
  }

  if (!accessToken) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-surface-subtle"
      >
        Notifications
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread`}
            className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-negative-600 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white"
          >
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          role="region"
          aria-label="Notifications"
          className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-hairline bg-white p-3 text-ink-900 shadow-lg"
        >
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="mb-2 text-sm font-medium text-brand-600 hover:underline"
            >
              Mark all read
            </button>
          )}
          <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {notifications.length === 0 && <li className="text-sm text-muted">No notifications yet.</li>}
            {notifications.map((n) => (
              <li key={n.id} className="rounded-lg border border-hairline p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                  {n.title} {!n.read && <span aria-label="unread" className="text-brand-500">•</span>}
                </p>
                <p className="mt-1 text-sm text-ink-600">{n.body}</p>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(n.id)}
                    className="mt-2 text-xs font-medium text-brand-600 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
