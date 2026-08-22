import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "teal" | "coral" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-mist-100 text-navy-600",
  teal: "bg-teal-50 text-teal-700",
  coral: "bg-coral-50 text-coral-700",
  success: "bg-teal-50 text-teal-700",
  warning: "bg-coral-50 text-coral-700",
  danger: "bg-coral-100 text-coral-800",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
