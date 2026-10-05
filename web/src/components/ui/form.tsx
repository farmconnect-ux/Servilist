import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const control =
  "min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3.5 text-sm text-ink placeholder:text-disabled shadow-xs transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "py-2.5 resize-y min-h-[90px]", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(control, "cursor-pointer bg-surface pr-8", className)} {...props}>
      {children}
    </select>
  );
}

/** A labelled form field with hint and error connected for accessibility. */
export function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
          {required ? <span className="ml-1 text-danger">*</span> : null}
        </label>
      </div>
      {children}
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: React.ReactNode;
}) {
  const tones = {
    info: "bg-info-soft text-info border-info/40",
    success: "bg-primary-50 text-primary-900 border-primary-200",
    warning: "bg-accent-50 text-accent-600 border-accent-200",
    danger: "bg-danger-soft text-danger border-danger/40",
  };

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-xl border p-4 text-sm leading-relaxed", tones[tone])}
    >
      {title ? <p className="font-bold mb-1">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}
