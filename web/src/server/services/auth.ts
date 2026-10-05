import "server-only";
import { createDb } from "@/lib/db/server";
import { env } from "@/lib/env";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/server/validators/auth";
import { failure, fieldErrorsFrom, success, type ActionState } from "./result";

/**
 * Account operations. Passwords are handled by the auth provider and never
 * stored or logged here; sessions live in HTTP-only cookies.
 */

export async function signIn(input: unknown): Promise<ActionState> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return failure("Check the details below.", fieldErrorsFrom(parsed.error));

  const db = await createDb();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  // One message for every failure, so the form does not reveal which emails have accounts
  if (error) return failure("That email and password do not match an account.");
  return success();
}

export async function signUp(input: unknown): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return failure("Check the details below.", fieldErrorsFrom(parsed.error));

  const db = await createDb();
  const { data, error } = await db.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${env.appUrl}/auth/callback?next=/dashboard`,
      data: { display_name: parsed.data.displayName },
    },
  });
  if (error) return failure(error.message);

  return data.session
    ? success()
    : success("Check your email and follow the link to confirm your account.");
}

export async function signOut(): Promise<void> {
  const db = await createDb();
  await db.auth.signOut();
}

export async function requestPasswordReset(input: unknown): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return failure("Check the details below.", fieldErrorsFrom(parsed.error));

  const db = await createDb();
  await db.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.appUrl}/auth/callback?next=/reset-password`,
  });
  // Same answer whether or not the email has an account
  return success("If that email has an account, a reset link is on its way.");
}

export async function updatePassword(input: unknown): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return failure("Check the details below.", fieldErrorsFrom(parsed.error));

  const db = await createDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return failure("This reset link has expired. Request a new one.");

  const { error } = await db.auth.updateUser({ password: parsed.data.password });
  if (error) return failure(error.message);
  return success();
}
