import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  porthole?: boolean;
}

export function Card({ glass: _glass = false, porthole = false, className = "", ...rest }: CardProps) {
  const base = porthole
    ? "bg-ink-900 border border-ink-700 text-white"
    : "bg-white border border-hairline shadow-card";

  return <div className={`rounded-xl p-6 ${base} ${className}`} {...rest} />;
}
