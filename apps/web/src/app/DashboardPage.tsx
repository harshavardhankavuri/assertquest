import { useEffect, useMemo, useState } from "react";
import type { Shipment, ShipmentStatus } from "@assertquest/shared";
import { Alert, Badge, Card, PageHeader, StatTile } from "../ui/index.js";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";
import { BarChart } from "../reporting/BarChart.js";
import { usePracticeMode } from "../practice/PracticeModeContext.js";
import { practiceDelay } from "../practice/helpers.js";
import { PracticeSandbox } from "../practice/PracticeSandbox.js";

const STATUS_TONE: Record<ShipmentStatus, "success" | "teal" | "neutral" | "danger"> = {
  delivered: "success",
  in_transit: "teal",
  booked: "neutral",
  cancelled: "danger",
};

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  booked: "Booked",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_BAR_COLOR: Record<ShipmentStatus, string> = {
  booked: "#9aa3ab",
  in_transit: "#3550a8",
  delivered: "#2c6b4f",
  cancelled: "#bd4020",
};

const HISTORY_DAYS = 14;

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100);
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function dayLabel(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function DashboardPage() {
  const { user, accessToken } = useAuth();
  const { toggles } = usePracticeMode();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    (toggles.slowLoadingElements ? practiceDelay(1500) : Promise.resolve())
      .then(() => api.listTracking(accessToken, { pageSize: 100, sort: "createdAt", order: "desc" }))
      .then((res) => {
        if (!cancelled) setShipments(res.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Could not load shipments.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const stats = useMemo(() => {
    const byStatus: Record<ShipmentStatus, number> = { booked: 0, in_transit: 0, delivered: 0, cancelled: 0 };
    let totalValueCents = 0;
    let currency = "USD";
    for (const s of shipments) {
      byStatus[s.status] += 1;
      if (s.status !== "cancelled") totalValueCents += s.priceCents;
      currency = s.currency;
    }
    return { byStatus, totalValueCents, currency };
  }, [shipments]);

  const dailyVolume = useMemo(() => {
    const buckets = new Map<string, number>();
    const now = Date.now();
    for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
      const key = dayKey(new Date(now - i * 86_400_000).toISOString());
      buckets.set(key, 0);
    }
    for (const s of shipments) {
      const key = dayKey(s.createdAt);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries()).map(([key, value]) => ({ label: dayLabel(key), value }));
  }, [shipments]);

  const statusBars = useMemo(
    () =>
      (Object.entries(stats.byStatus) as [ShipmentStatus, number][])
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({ label: STATUS_LABEL[status], value: count })),
    [stats],
  );

  const recent = shipments.slice(0, 6);

  return (
    <main>
      <PageHeader
        title={`Welcome, ${user?.email}`}
        description="All eight SwiftCargo modules are live: Auth & RBAC, Shipment Booking, Dashboard & Tracking, Fleet & Scheduling, Billing & Invoicing, Admin Console, Notifications, and Reporting."
      />

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {loading && (
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Loading…</p>
      )}

      {!loading && !error && shipments.length === 0 && (
        <Card>
          <p className="text-sm text-muted">
            No shipments to show yet for <strong className="font-mono text-ink-900">{user?.role}</strong>. Book a
            shipment, or sign in as a customer/admin/dispatcher to see live data here.
          </p>
        </Card>
      )}

      {shipments.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatTile value={shipments.length} label="Total shipments" />
            <StatTile value={stats.byStatus.in_transit} label="In transit" />
            <StatTile value={stats.byStatus.delivered} label="Delivered" />
            <StatTile value={formatCurrency(stats.totalValueCents, stats.currency)} label="Total value" />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BarChart
              title={`Shipments booked · last ${HISTORY_DAYS} days`}
              bars={dailyVolume}
              formatValue={(v) => String(v)}
              color="#3550a8"
            />
            <figure className="rounded-xl border border-hairline bg-white p-4 shadow-card">
              <figcaption className="mb-3 text-sm font-semibold text-ink-900">Status breakdown</figcaption>
              {statusBars.length === 0 ? (
                <p className="text-sm text-muted">No data yet.</p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {statusBars.map((bar) => {
                    const status = (Object.entries(STATUS_LABEL) as [ShipmentStatus, string][]).find(
                      ([, label]) => label === bar.label,
                    )?.[0] as ShipmentStatus;
                    const pct = Math.round((bar.value / shipments.length) * 100);
                    return (
                      <li key={bar.label}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium text-ink-600">{bar.label}</span>
                          <span className="font-mono text-faint">
                            {bar.value} &middot; {pct}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-subtle">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: STATUS_BAR_COLOR[status] }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </figure>
          </div>

          <div className="rounded-xl border border-hairline bg-white shadow-card">
            <div className="border-b border-hairline px-5 py-3">
              <span className="text-sm font-semibold text-ink-900">Recent shipments</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_110px_100px_90px] gap-3 px-5 py-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
              <span>Route</span>
              <span>Created</span>
              <span>Price</span>
              <span>Status</span>
            </div>
            {recent.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[minmax(0,1fr)_110px_100px_90px] items-center gap-3 border-t border-hairline px-5 py-2.5"
              >
                <span className="truncate text-sm text-ink-600">
                  {s.origin.label} &rarr; {s.destination.label}
                </span>
                <span className="font-mono text-xs text-faint">
                  {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="font-mono text-xs text-ink-900">{formatCurrency(s.priceCents, s.currency)}</span>
                <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
              </div>
            ))}
          </div>
        </>
      )}

      <PracticeSandbox />
    </main>
  );
}
