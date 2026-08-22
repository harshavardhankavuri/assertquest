import type { AuditLogEntry } from "@assertquest/shared";
import { Card } from "../ui/index.js";

export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <section aria-labelledby="audit-log-heading">
      <Card>
        <h2 id="audit-log-heading" className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
          Audit log
        </h2>
        <div className="flex flex-col gap-1.5">
          {entries.map((e) => (
            <div key={e.id} className="rounded-lg px-2 py-1.5 font-mono text-xs text-ink-500 hover:bg-surface-row">
              <span className="text-faint">{new Date(e.createdAt).toLocaleString()}</span>{" "}
              <span className="text-muted">{e.actorEmail}</span>{" "}
              <span className="text-ink-600">{e.action}</span>{" "}
              <span className="text-faint">
                {e.targetType ? `${e.targetType}${e.targetId ? `:${e.targetId}` : ""}` : "—"}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
