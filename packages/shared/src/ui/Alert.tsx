import type { ReactNode } from "react";

export type AlertTone = "info" | "success" | "error";

const TONE_CLASSES: Record<AlertTone, string> = {
  info: "bg-teal-50 border-teal-200 text-teal-800",
  success: "bg-teal-50 border-teal-300 text-teal-800",
  error: "bg-coral-50 border-coral-300 text-coral-800",
};

export function Alert({ tone = "info", children }: { tone?: AlertTone; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`rounded-xl border px-4 py-3 text-sm ${TONE_CLASSES[tone]}`}
    >
      {children}
    </p>
  );
}
