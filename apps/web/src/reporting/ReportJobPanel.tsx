import { useState } from "react";
import type { ReportJob, ReportSummaryRequest } from "@assertquest/shared";
import { Alert, Badge, Button, Card } from "../ui/index.js";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";

const POLL_MS = 1000;

interface ReportJobPanelProps {
  query: ReportSummaryRequest;
}

function jobTone(status: ReportJob["status"]): "success" | "danger" | "warning" {
  if (status === "ready") return "success";
  if (status === "failed") return "danger";
  return "warning";
}

// Scheduled report generation (FR-1303) — the job is asynchronous, so the UI must
// show a genuine pending/ready state rather than pretending the CSV is ready
// immediately.
export function ReportJobPanel({ query }: ReportJobPanelProps) {
  const { accessToken } = useAuth();
  const [job, setJob] = useState<ReportJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onRequest() {
    if (!accessToken) return;
    setError(null);
    setJob(null);
    try {
      const res = await api.createReportJob(query, accessToken);
      setJob(res.job);
      poll(res.job.id);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not request the report.");
    }
  }

  function poll(id: string) {
    const interval = setInterval(async () => {
      if (!accessToken) return;
      const res = await api.getReportJob(id, accessToken);
      setJob(res.job);
      if (res.job.status === "ready" || res.job.status === "failed") {
        clearInterval(interval);
      }
    }, POLL_MS);
  }

  return (
    <section aria-labelledby="report-job-heading">
      <Card>
        <h2 id="report-job-heading" className="mb-4 text-[15px] font-bold tracking-tight text-ink-900">
          Scheduled report
        </h2>
        <Button type="button" variant="secondary" onClick={onRequest}>
          Generate CSV report
        </Button>
        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        {job && (
          <p role="status" aria-live="polite" className="mt-4 flex items-center gap-2 text-sm text-ink-600">
            Status: <Badge tone={jobTone(job.status)}>{job.status}</Badge>
            {job.status === "ready" && (
              <a href={api.reportJobDownloadUrl(job.id)} className="font-medium text-brand-600 hover:underline">
                Download CSV
              </a>
            )}
          </p>
        )}
      </Card>
    </section>
  );
}
