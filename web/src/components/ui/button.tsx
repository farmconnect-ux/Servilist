import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Buttons (docs/UI_UX_SPEC.md section 7).
 *
 * primary     the one main action: Buy now, Sell, Post request, Accept, Pay, Place bid
 * secondary   supporting actions: Message seller, Make offer, Save, View details
 * ghost       filters, navigation and minor actions
 * danger      destructive only: Delete, Cancel order, Report, Remove listing
 * accent      amber, reserved for auctions and promotions
 */
const base =
  "inline-flex items-center justify-center gap-2 font-semibold select-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 aria-busy:cursor-progress aria-busy:opacity-80";

const variants = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
  secondary:
    "border border-line-strong bg-surface text-ink hover:border-primary-600 hover:text-primary-700 active:bg-surface-muted",
  outline:
    "border border-line-strong bg-surface text-ink hover:border-primary-600 hover:text-primary-700 active:bg-surface-muted",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-muted hover:text-ink active:bg-line",
  accent: "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-600",
  danger: "bg-danger text-white hover:bg-danger/90 active:bg-danger/80",
} as const;

// 44px is the standard height; "lg" is the 48px mobile-friendly size
const sizes = {
  sm: "min-h-11 rounded-input px-3 text-sm",
  md: "min-h-11 rounded-input px-[18px] text-sm",
  lg: "min-h-12 rounded-input px-6 text-base",
  icon: "size-11 rounded-input",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** A link styled as a button, for navigation. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
