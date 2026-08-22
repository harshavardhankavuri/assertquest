import type { ReactNode } from "react";

export function StatTile({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <div className="rounded-xl border border-mist-200 bg-white p-5">
      <div className="font-display text-3xl font-semibold tracking-tight text-navy-900">{value}</div>
      <div className="mt-1 font-mono text-xs uppercase tracking-wide text-navy-400">{label}</div>
    </div>
  );
}
