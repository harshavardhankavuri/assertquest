import { useState } from "react";
import type { BulkActionResponse, BulkShipmentAction, Shipment } from "@assertquest/shared";
import { Alert, Button, Card, StatTile } from "../ui/index.js";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";

interface BulkActionsPanelProps {
  shipments: Shipment[];
  onChanged: () => void;
}

// Bulk approve/cancel (FR-1102) with visible partial-failure reporting — the
// endpoint always returns 200, so success/failure per item is shown explicitly
// rather than inferred from the HTTP status.
export function BulkActionsPanel({ shipments, onChanged }: BulkActionsPanelProps) {
  const { accessToken } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<BulkActionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runAction(action: BulkShipmentAction) {
    if (!accessToken || selected.size === 0) return;
    setError(null);
    setResult(null);
    try {
      const res = await api.bulkShipmentAction({ action, shipmentIds: [...selected] }, accessToken);
      setResult(res);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Bulk action failed.");
    }
  }

  return (
    <section aria-labelledby="bulk-actions-heading">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="bulk-actions-heading" className="text-[15px] font-bold tracking-tight text-ink-900">
            Shipments &middot; {selected.size} selected
          </h2>
          <div className="flex gap-2">
            <Button variant="primary" disabled={selected.size === 0} onClick={() => runAction("approve")}>
              Approve selected
            </Button>
            <Button variant="danger" disabled={selected.size === 0} onClick={() => runAction("cancel")}>
              Cancel selected
            </Button>
          </div>
        </div>
        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg border border-hairline">
          {shipments.map((s) => (
            <li key={s.id} className="border-b border-hairline px-3 py-2 last:border-b-0 hover:bg-surface-row">
              <label className="flex items-center gap-2 text-sm text-ink-600">
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                  className="h-4 w-4 rounded border-hairline text-brand-500 focus:outline focus:outline-2 focus:outline-brand-100"
                />
                <span className="font-mono text-xs text-brand-600">{s.id}</span>
                {s.origin.label} &rarr; {s.destination.label} ({s.status})
              </label>
            </li>
          ))}
        </ul>
        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        {result && (
          <div role="status" aria-live="polite" className="mt-4 rounded-lg border border-hairline bg-surface-row p-4">
            <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
              <StatTile value={result.succeeded} label="Succeeded" />
              <StatTile value={result.failed} label="Failed" />
            </div>
            <ul className="mt-4 flex flex-col gap-1">
              {result.results.map((r) => (
                <li key={r.shipmentId} className="font-mono text-xs text-faint">
                  {r.shipmentId}: {r.success ? "ok" : `failed — ${r.error}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </section>
  );
}
