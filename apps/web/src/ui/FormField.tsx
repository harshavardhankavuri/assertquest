import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const CONTROL_CLASSES =
  "w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-faint " +
  "focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-100";

export function FormField({
  label,
  htmlFor,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${CONTROL_CLASSES} ${className}`} {...rest} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  return <select className={`${CONTROL_CLASSES} ${className}`} {...rest} />;
}
