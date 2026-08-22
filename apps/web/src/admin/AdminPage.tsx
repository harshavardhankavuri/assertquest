import { useCallback, useEffect, useState } from "react";
import type { AuditLogEntry, FeatureFlags, Shipment } from "@assertquest/shared";
import { Alert, PageHeader } from "../ui/index.js";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";
import { FeatureFlagsPanel } from "./FeatureFlagsPanel.js";
import { BulkActionsPanel } from "./BulkActionsPanel.js";
import { CsvImportPanel } from "./CsvImportPanel.js";
import { AuditLogTable } from "./AuditLogTable.js";
import { OutboxPanel } from "./OutboxPanel.js";

export function AdminPage() {
  const { accessToken } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!accessToken) return;
    const [flagsRes, trackingRes, auditRes] = await Promise.all([
      api.getFeatureFlags(accessToken),
      api.listTracking(accessToken, { pageSize: 100 }),
      api.listAuditLog(accessToken),
    ]);
    setFlags(flagsRes.flags);
    setShipments(trackingRes.items);
    setEntries(auditRes.entries);
  }, [accessToken]);

  useEffect(() => {
    reload().catch((err) => setError(err instanceof ApiRequestError ? err.message : "Could not load admin data."));
  }, [reload]);

  if (!accessToken) return null;

  return (
    <main>
      <PageHeader title="Admin console" />
      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <div className="flex flex-col gap-6">
        <FeatureFlagsPanel flags={flags} />
        <BulkActionsPanel shipments={shipments} onChanged={reload} />
        <CsvImportPanel onImported={reload} />
        <OutboxPanel />
        <AuditLogTable entries={entries} />
      </div>
    </main>
  );
}
