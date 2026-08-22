import type { ReactNode } from "react";

export function StatTile({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-5 text-center shadow-card">
      <div className="font-mono text-2xl font-semibold text-ink-900">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-faint">{label}</div>
    </div>
  );
}
