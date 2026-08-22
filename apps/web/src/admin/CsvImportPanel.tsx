import { useState, type ChangeEvent } from "react";
import type { ImportReport } from "@assertquest/shared";
import { Alert, Card, StatTile } from "../ui/index.js";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";

// CSV bulk import (FR-1103) — row-level accepted/rejected report, not an
// all-or-nothing result.
export function CsvImportPanel({ onImported }: { onImported: () => void }) {
  const { accessToken } = useAuth();
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !accessToken) return;
    setError(null);
    setUploading(true);
    try {
      const res = await api.importShipmentsCsv(file, accessToken);
      setReport(res);
      onImported();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Import failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section aria-labelledby="csv-import-heading">
      <Card>
        <h2 id="csv-import-heading" className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
          CSV import
        </h2>
        <label
          htmlFor="csv-file"
          className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-hairline px-4 py-6 text-center"
        >
          <span className="text-sm font-medium text-ink-600">Drop a CSV file here, or click to browse</span>
          <span className="text-xs text-faint">Shipments only &mdash; header row required</span>
          <input
            id="csv-file"
            name="csv-file"
            type="file"
            accept=".csv,text/csv"
            disabled={uploading}
            onChange={onFileChange}
            className="mt-2 text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
        </label>
        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        {report && (
          <div role="status" aria-live="polite" className="mt-4 rounded-lg border border-hairline bg-surface-row p-4">
            <div className="grid grid-cols-3 gap-3 sm:max-w-sm">
              <StatTile value={report.accepted} label="Accepted" />
              <StatTile value={report.rejected} label="Rejected" />
              <StatTile value={report.totalRows} label="Total rows" />
            </div>
            <ul className="mt-4 flex flex-col gap-1">
              {report.rows
                .filter((r) => r.status === "rejected")
                .map((r) => (
                  <li key={r.row} className="font-mono text-xs text-negative-700">
                    Row {r.row}: {r.errors?.join("; ")}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </Card>
    </section>
  );
}
