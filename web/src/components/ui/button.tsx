import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

const variants = {
  primary:
    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 text-white",
  secondary:
    "border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 hover:border-zinc-300",
  outline:
    "border border-zinc-300 bg-transparent text-zinc-800 hover:bg-zinc-100 hover:text-zinc-900",
  ghost:
    "bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  accent:
    "bg-amber-500 text-white shadow-sm hover:bg-amber-600 active:bg-amber-700",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
} as const;

const sizes = {
  sm: "min-h-9 px-3 py-1.5 text-xs rounded-md",
  md: "min-h-11 px-5 py-2.5 text-sm rounded-lg",
  lg: "min-h-12 px-6 py-3 text-base rounded-lg",
  icon: "size-11 p-2.5 rounded-lg",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
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

/** A link styled as a button, for semantic navigation. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
