import { useCallback, useEffect, useState } from "react";
import type { Shipment, ShipmentStatus, SortOrder, TrackingSortField } from "@assertquest/shared";
import { SHIPMENT_STATUSES } from "@assertquest/shared";
import { Alert, Badge, Button, PageHeader, SelectInput, StatTile } from "../ui/index.js";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";
import { useTrackingSocket } from "./useTrackingSocket.js";
import { TrackingMap } from "./TrackingMap.js";

const PAGE_SIZE = 10;

function statusTone(status: ShipmentStatus): "success" | "warning" | "teal" | "neutral" {
  if (status === "delivered") return "success";
  if (status === "cancelled") return "neutral";
  if (status === "booked") return "warning";
  return "teal";
}

export function TrackingDashboard() {
  const { user, accessToken } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ShipmentStatus | "">("");
  const [sort, setSort] = useState<TrackingSortField>("createdAt");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [error, setError] = useState<string | null>(null);

  const canAdvance = user?.role === "dispatcher" || user?.role === "admin";

  const reload = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await api.listTracking(accessToken, {
        status: status || undefined,
        sort,
        order,
        page,
        pageSize: PAGE_SIZE,
      });
      setShipments(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not load shipments.");
    }
  }, [accessToken, status, sort, order, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  const onSocketUpdate = useCallback((updated: Shipment) => {
    setShipments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const connectionStatus = useTrackingSocket(accessToken, onSocketUpdate);

  async function onAdvance(id: string) {
    if (!accessToken) return;
    try {
      const res = await api.advanceShipment(id, accessToken);
      setShipments((prev) => prev.map((s) => (s.id === id ? res.shipment : s)));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not advance shipment.");
    }
  }

  async function onExportCsv() {
    if (!accessToken) return;
    const res = await fetch(api.trackingExportCsvUrl(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "shipments.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function toggleSort(field: TrackingSortField) {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("asc");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns: { field: TrackingSortField; label: string }[] = [
    { field: "createdAt", label: "Created" },
    { field: "priceCents", label: "Price" },
    { field: "distanceKm", label: "Distance" },
    { field: "status", label: "Status" },
  ];

  return (
    <main>
      <PageHeader
        title="Shipment Tracking"
        actions={
          connectionStatus !== "open" ? (
            <Button type="button" variant="secondary" disabled>
              {connectionStatus === "reconnecting" ? "Reconnecting…" : "Connecting…"}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:max-w-xs">
        <StatTile value={total} label="Total shipments" />
        <StatTile value={shipments.length} label="On this page" />
      </div>

      {connectionStatus !== "open" && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-center gap-2.5 rounded-lg border border-negative-100 bg-negative-50 px-4 py-3"
        >
          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-negative-600 motion-safe:animate-pulse" />
          <span className="text-sm text-negative-700">
            {connectionStatus === "reconnecting" ? "Live updates disconnected — reconnecting…" : "Connecting to live updates…"}
          </span>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <TrackingMap shipments={shipments} />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status-filter" className="text-sm font-medium text-ink-600">
            Status
          </label>
          <SelectInput
            id="status-filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ShipmentStatus | "");
              setPage(1);
            }}
            className="w-44"
          >
            <option value="">All</option>
            {SHIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectInput>
        </div>
        <Button type="button" variant="secondary" onClick={onExportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-hairline bg-white shadow-card">
        <table className="min-w-full divide-y divide-hairline">
          <thead className="bg-surface-subtle font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
            <tr>
              {columns.map(({ field, label }) => (
                <th key={field} className="px-4 py-2 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort(field)}
                    className="inline-flex items-center gap-1 font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-faint transition-colors hover:text-brand-600"
                  >
                    {label}
                    {sort === field ? (order === "asc" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
              ))}
              <th className="px-4 py-2 text-left">Origin</th>
              <th className="px-4 py-2 text-left">Destination</th>
              {canAdvance && <th className="px-4 py-2 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {shipments.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-surface-row">
                <td className="px-4 py-2 font-mono text-sm text-muted">{s.createdAt}</td>
                <td className="px-4 py-2 font-mono text-sm text-ink-700">
                  {(s.priceCents / 100).toFixed(2)} {s.currency}
                </td>
                <td className="px-4 py-2 font-mono text-sm text-ink-700">{s.distanceKm.toFixed(1)} km</td>
                <td className="px-4 py-2">
                  <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                </td>
                <td className="px-4 py-2 text-sm text-ink-700">{s.origin.label}</td>
                <td className="px-4 py-2 text-sm text-ink-700">{s.destination.label}</td>
                {canAdvance && (
                  <td className="px-4 py-2">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={s.status === "delivered"}
                      onClick={() => onAdvance(s.id)}
                    >
                      Advance
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav aria-label="Pagination" className="mt-4 flex items-center gap-3">
        <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <span className="text-sm text-muted">
          Page {page} of {totalPages}
        </span>
        <Button type="button" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </nav>
    </main>
  );
}
