import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends ComponentProps<"div"> {
  variant?: "default" | "muted" | "elevated" | "interactive";
}

export function Card({ variant = "default", className, ...props }: CardProps) {
  const variants = {
    default: "rounded-xl border border-zinc-200 bg-white shadow-xs",
    muted: "rounded-xl border border-zinc-200 bg-zinc-50",
    elevated: "rounded-xl border border-zinc-200 bg-white shadow-md",
    interactive:
      "rounded-xl border border-zinc-200 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300",
  };

  return <div className={cn(variants[variant], className)} {...props} />;
}

const tones = {
  neutral: "bg-zinc-100 text-zinc-700 border-zinc-200",
  brand: "bg-emerald-50 text-emerald-800 border-emerald-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-800 border-red-200",
  accent: "bg-amber-100 text-amber-900 border-amber-300",
  info: "bg-blue-50 text-blue-800 border-blue-200",
} as const;

export type BadgeTone = keyof typeof tones;

/** A short status chip: tinted background, subtle border, bold coloured text. */
export function Badge({
  tone = "neutral",
  pill = false,
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone; pill?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap",
        pill ? "rounded-full" : "rounded-md",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

/** Verified seller or business shield badge. */
export function VerifiedBadge({
  text = "Verified",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200",
        className
      )}
      title="Verified Identity / Registered Business"
    >
      <svg
        className="size-3 text-emerald-600 fill-emerald-600"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
      {text}
    </span>
  );
}

/** A figure with its label and optional trend/note for dashboards. */
export function Metric({
  label,
  value,
  note,
  change,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note?: string;
  change?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <Card className="flex flex-col gap-2 p-5 bg-white">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</p>
        {change ? (
          <span
            className={cn(
              "text-xs font-bold",
              tone === "positive"
                ? "text-emerald-600"
                : tone === "negative"
                ? "text-red-600"
                : "text-zinc-600"
            )}
          >
            {change}
          </span>
        ) : null}
      </div>
      <p className="text-3xl font-extrabold text-zinc-900 tracking-tight">{value}</p>
      {note ? <p className="text-xs text-zinc-500">{note}</p> : null}
    </Card>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center bg-white border-dashed border-2 border-zinc-200">
      <div className="flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
        <svg
          className="size-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </div>
      <p className="text-base font-bold text-zinc-900">{title}</p>
      {children ? <div className="max-w-md text-sm text-zinc-500">{children}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </Card>
  );
}
