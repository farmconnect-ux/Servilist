import type { ZodError } from "zod";

/** What a form action reports back: success, or a message and per-field problems. */
export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const idle: ActionState = { ok: false };

export function failure(message: string, fieldErrors?: Record<string, string>): ActionState {
  return { ok: false, message, fieldErrors };
}

export function success(message?: string): ActionState {
  return { ok: true, message };
}

/** First problem per field, in the shape the forms display. */
export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; error: string; details?: unknown };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T = never>(code: string, error: string, details?: unknown): Result<T> {
  return { ok: false, code, error, details };
}
