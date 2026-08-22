import { useEffect, useState } from "react";
import type { ReportGroupBy, ReportSummary } from "@assertquest/shared";
import { Alert, Button, Card, FormField, PageHeader, SelectInput, StatTile, TextInput } from "../ui/index.js";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";
import { BarChart } from "./BarChart.js";
import { ReportJobPanel } from "./ReportJobPanel.js";

const TIME_ZONES = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/Amsterdam", "Asia/Tokyo"];

function defaultFrom(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function ReportingPage() {
  const { accessToken } = useAuth();
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [groupBy, setGroupBy] = useState<ReportGroupBy>("day");
  const [timeZone, setTimeZone] = useState("UTC");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = {
    from: new Date(from).toISOString(),
    to: new Date(to).toISOString(),
    groupBy,
    timeZone,
  };

  async function loadSummary() {
    if (!accessToken) return;
    setError(null);
    try {
      const res = await api.getReportSummary(query, accessToken);
      setSummary(res);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not load the report.");
    }
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  if (!accessToken) return null;

  return (
    <main>
      <PageHeader title="Reporting" />

      <Card className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadSummary();
          }}
          className="flex flex-wrap items-end gap-4"
        >
          <div className="w-40">
            <FormField label="From" htmlFor="report-from">
              <TextInput id="report-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </FormField>
          </div>
          <div className="w-40">
            <FormField label="To" htmlFor="report-to">
              <TextInput id="report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </FormField>
          </div>
          <div className="w-36">
            <FormField label="Group by" htmlFor="report-groupby">
              <SelectInput id="report-groupby" value={groupBy} onChange={(e) => setGroupBy(e.target.value as ReportGroupBy)}>
                <option value="day">Day</option>
                <option value="month">Month</option>
              </SelectInput>
            </FormField>
          </div>
          <div className="w-56">
            <FormField label="Timezone" htmlFor="report-timezone">
              <SelectInput id="report-timezone" value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
                {TIME_ZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>
          <Button type="submit">Update</Button>
        </form>
      </Card>

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {summary && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:max-w-md">
            <StatTile value={summary.totalShipments} label="Shipments" />
            <StatTile value={`$${(summary.totalRevenueCents / 100).toFixed(2)}`} label="Total revenue" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BarChart
              title="Shipment volume"
              bars={summary.buckets.map((b) => ({ label: b.period, value: b.shipmentCount }))}
              formatValue={(v) => String(v)}
              color="#3550a8"
            />
            <BarChart
              title="Revenue"
              bars={summary.buckets.map((b) => ({ label: b.period, value: b.revenueCents }))}
              formatValue={(v) => `$${(v / 100).toFixed(2)}`}
              color="#2c4390"
            />
          </div>

          <h2 className="mb-3 mt-6 text-[15px] font-bold tracking-tight text-ink-900">Data table</h2>
          <div className="overflow-x-auto rounded-xl border border-hairline bg-white shadow-card">
            <table className="min-w-full divide-y divide-hairline">
              <thead className="bg-surface-subtle font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
                <tr>
                  <th className="px-4 py-2 text-left">Period</th>
                  <th className="px-4 py-2 text-left">Shipments</th>
                  <th className="px-4 py-2 text-left">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {summary.buckets.map((b) => (
                  <tr key={b.period} className="hover:bg-surface-row">
                    <td className="px-4 py-2 text-sm text-ink-600">{b.period}</td>
                    <td className="px-4 py-2 font-mono text-sm text-ink-900">{b.shipmentCount}</td>
                    <td className="px-4 py-2 font-mono text-sm text-ink-900">${(b.revenueCents / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-6">
        <ReportJobPanel query={query} />
      </div>
    </main>
  );
}
