import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const control =
  "min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-muted aria-[invalid=true]:border-danger";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "py-2", className)} {...props} />;
}

/** A labelled control with its error, wired together for screen readers. */
export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
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
  children,
}: {
  tone?: "info" | "success" | "danger";
  children: React.ReactNode;
}) {
  const tones = {
    info: "bg-brand-soft text-ink",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-[10px] px-3 py-2.5 text-sm font-semibold", tones[tone])}
    >
      {children}
    </p>
  );
}
