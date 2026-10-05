import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-card bg-surface shadow-card", className)} {...props} />;
}

const tones = {
  neutral: "bg-page text-muted",
  brand: "bg-brand-soft text-brand-strong",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  accent: "bg-accent-soft text-accent",
} as const;

export type BadgeTone = keyof typeof tones;

/** A short status label: tinted background, bold coloured text. */
export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-control px-2 py-1 text-xs font-bold whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** A figure with its label, for dashboards. */
export function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="flex flex-col gap-2 p-5">
      <p className="text-[13px] font-semibold text-muted">{label}</p>
      <p className="text-3xl font-extrabold text-ink">{value}</p>
      {note ? <p className="text-xs text-muted">{note}</p> : null}
    </Card>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <p className="text-base font-bold text-ink">{title}</p>
      {children ? <div className="max-w-md text-sm text-muted">{children}</div> : null}
    </Card>
  );
}
