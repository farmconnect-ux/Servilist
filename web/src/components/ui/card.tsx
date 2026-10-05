import type { ComponentProps } from "react";
import { BadgeCheck, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Surfaces and status chips (docs/UI_UX_SPEC.md sections 5, 6 and 8).
 * Cards are a white surface with a 1px border; shadows are the exception.
 */

export interface CardProps extends ComponentProps<"div"> {
  variant?: "default" | "muted" | "elevated" | "interactive";
}

const cardVariants = {
  default: "rounded-card border border-line bg-surface",
  muted: "rounded-card border border-line bg-surface-muted",
  elevated: "rounded-card border border-line bg-surface shadow-md",
  interactive:
    "rounded-card border border-line bg-surface transition-colors duration-200 hover:border-line-strong",
} as const;

export function Card({ variant = "default", className, ...props }: CardProps) {
  return <div className={cn(cardVariants[variant], className)} {...props} />;
}

const tones = {
  neutral: "bg-surface-muted text-ink-soft border-line",
  brand: "bg-primary-50 text-primary-800 border-primary-200",
  success: "bg-success-soft text-primary-800 border-primary-200",
  warning: "bg-warning-soft text-accent-600 border-accent-200",
  danger: "bg-danger-soft text-danger border-danger/30",
  accent: "bg-accent-100 text-accent-600 border-accent-200",
  info: "bg-info-soft text-info border-info/30",
} as const;

export type BadgeTone = keyof typeof tones;

/** A short status chip. The label carries the meaning; colour only supports it. */
export function Badge({
  tone = "neutral",
  pill = false,
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone; pill?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        pill ? "rounded-pill" : "rounded-control",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Shown beside a member whose identity or business has been verified by staff. */
export function VerifiedBadge({
  text = "Verified",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-primary-700", className)}>
      <BadgeCheck className="size-3.5" aria-hidden="true" />
      {text}
    </span>
  );
}

/** A figure with its label. Pass a note only when it states something measured. */
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
    <Card className="flex flex-col gap-1 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        {change ? (
          <span
            className={cn(
              "text-xs font-medium",
              tone === "positive" ? "text-success" : tone === "negative" ? "text-danger" : "text-ink-soft",
            )}
          >
            {change}
          </span>
        ) : null}
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      {note ? <p className="text-xs text-muted">{note}</p> : null}
    </Card>
  );
}

/** Section 56: every page has a designed empty state with a next step. */
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
    <Card className="flex flex-col items-center justify-center gap-3 border-dashed px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-pill bg-surface-muted text-muted">
        <Inbox className="size-6" aria-hidden="true" />
      </span>
      <p className="text-base font-semibold text-ink">{title}</p>
      {children ? <div className="max-w-md text-sm text-muted">{children}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </Card>
  );
}

/** Section 57: a skeleton block for page-level loading. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-control bg-surface-muted", className)} />;
}
