import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  porthole?: boolean;
}

export function Card({ glass = false, porthole = false, className = "", ...rest }: CardProps) {
  const base = porthole
    ? "bg-porthole-surface border border-porthole-border text-white"
    : glass
      ? "bg-white/70 backdrop-blur border border-white/60"
      : "bg-white border border-mist-200";

  return <div className={`rounded-xl p-6 ${base} ${className}`} {...rest} />;
}
