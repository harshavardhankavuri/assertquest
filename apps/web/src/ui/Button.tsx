import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-ink-900 text-white hover:bg-ink-700 focus-visible:outline-ink-900 disabled:bg-ink-500/40",
  secondary:
    "bg-white text-ink-600 border border-hairline hover:bg-surface-subtle focus-visible:outline-brand-500 disabled:text-faint",
  ghost:
    "bg-transparent text-brand-600 hover:bg-brand-50 focus-visible:outline-brand-500 disabled:text-faint",
  danger:
    "bg-negative-600 text-white hover:bg-negative-700 focus-visible:outline-negative-600 disabled:bg-negative-600/40",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className = "", type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold
        transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    />
  );
}
