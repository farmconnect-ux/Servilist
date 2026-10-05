"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { safeNextPath } from "@/lib/security/redirect";
import * as accounts from "@/server/services/accounts";
import * as auth from "@/server/services/auth";
import type { ActionState } from "@/server/services/result";

/** Thin form handlers: read the form, call the service, redirect. No rules live here. */

export async function signInAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await auth.signIn({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!result.ok) return result;
  redirect(safeNextPath(form.get("next") as string | null));
}

export async function signUpAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await auth.signUp({
    displayName: form.get("displayName"),
    email: form.get("email"),
    password: form.get("password"),
  });
  // A message means the member still has to confirm their email
  if (!result.ok || result.message) return result;
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  await auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  return auth.requestPasswordReset({ email: form.get("email") });
}

export async function resetPasswordAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const result = await auth.updatePassword({ password: form.get("password") });
  if (!result.ok) return result;
  redirect("/dashboard");
}

export async function saveProfileAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await accounts.saveOwnProfile({
    displayName: form.get("displayName"),
    city: form.get("city") ?? "",
    country: form.get("country") ?? "",
    bio: form.get("bio") ?? "",
  });
  if (result.ok) revalidatePath("/dashboard", "layout");
  return result;
}

export async function setMemberStatusAction(form: FormData): Promise<void> {
  await accounts.setMemberStatus(String(form.get("memberId")), String(form.get("status")));
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit-logs");
}
