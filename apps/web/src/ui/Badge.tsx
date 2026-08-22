import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "teal" | "coral" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-subtle text-muted",
  teal: "bg-brand-50 text-brand-700",
  coral: "bg-negative-50 text-negative-700",
  success: "bg-positive-50 text-positive-700",
  warning: "bg-negative-50 text-negative-700",
  danger: "bg-negative-100 text-negative-700",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
