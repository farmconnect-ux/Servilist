import "server-only";
import { createDb } from "@/lib/db/server";
import { requirePermission, requireUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";
import { updateOwnProfile } from "@/server/repositories/accounts";
import { profileSchema } from "@/server/validators/auth";
import { failure, fieldErrorsFrom, success, type ActionState } from "./result";

export async function saveOwnProfile(input: unknown): Promise<ActionState> {
  const user = await requireUser("/dashboard/settings");
  if (!canParticipate(user)) return failure("Your account is restricted and cannot be edited.");

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return failure("Check the details below.", fieldErrorsFrom(parsed.error));

  const db = await createDb();
  try {
    // The member's id comes from the session, never from the form
    await updateOwnProfile(db, user.userId, {
      displayName: parsed.data.displayName,
      city: parsed.data.city ?? "",
      country: parsed.data.country ?? "",
      bio: parsed.data.bio ?? "",
    });
  } catch {
    return failure("Your profile could not be saved. Please try again.");
  }
  return success("Profile saved.");
}

const STATUSES = ["active", "suspended", "banned"] as const;

/**
 * Suspends, bans or restores a member. The page checks the permission for a
 * clear error; the database function checks it again and writes the audit log.
 */
export async function setMemberStatus(memberId: string, status: string): Promise<ActionState> {
  await requirePermission("users.manage", "/admin/users");
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return failure("Unknown status.");
  if (!/^[0-9a-f-]{36}$/i.test(memberId)) return failure("Unknown member.");

  const db = await createDb();
  const { error } = await db.rpc("set_user_status", { p_user_id: memberId, p_status: status });
  if (error) return failure(error.message);
  return success();
}
