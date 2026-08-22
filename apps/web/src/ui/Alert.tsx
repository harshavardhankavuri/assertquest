import type { ReactNode } from "react";

export type AlertTone = "info" | "success" | "error";

const TONE_CLASSES: Record<AlertTone, string> = {
  info: "bg-brand-50 border-brand-200 text-brand-700",
  success: "bg-positive-50 border-positive-600/20 text-positive-700",
  error: "bg-negative-50 border-negative-100 text-negative-700",
};

export function Alert({ tone = "info", children }: { tone?: AlertTone; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`rounded-lg border px-4 py-3 text-sm ${TONE_CLASSES[tone]}`}
    >
      {children}
    </p>
  );
}
