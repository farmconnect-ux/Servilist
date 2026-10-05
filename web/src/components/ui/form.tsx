import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const control =
  "min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/20";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "py-2.5 resize-y min-h-[90px]", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(control, "cursor-pointer bg-white pr-8", className)} {...props}>
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
        <label htmlFor={id} className="text-sm font-semibold text-zinc-900">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
      </div>
      {children}
      {hint && !error ? <p className="text-xs text-zinc-500">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-semibold text-red-600">
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
    info: "bg-blue-50 text-blue-900 border-blue-200",
    success: "bg-emerald-50 text-emerald-900 border-emerald-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
    danger: "bg-red-50 text-red-900 border-red-200",
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
