import "server-only";
import { createDb } from "@/lib/db/server";
import type { SessionUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";
import {
  getBusinessByOwnerId,
  getBusinessBySlug,
  saveBusinessProfile,
  type BusinessProfileRecord,
} from "../repositories/businesses";
import { BusinessProfileSchema } from "../validators/business";
import { fail, ok, type Result } from "./result";

/** Business page workflows. The database decides who the owner is. */

export async function getBusinessAction(slug: string): Promise<Result<BusinessProfileRecord>> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return fail("NOT_FOUND", "Business not found");
  const business = await getBusinessBySlug(await createDb(), slug);
  return business ? ok(business) : fail("NOT_FOUND", "Business not found");
}

export async function getMyBusinessAction(user: SessionUser): Promise<Result<BusinessProfileRecord | null>> {
  return ok(await getBusinessByOwnerId(await createDb(), user.userId));
}

export async function saveBusinessAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ slug: string }>> {
  if (!canParticipate(user)) return fail("FORBIDDEN", "Your account is restricted.");
  const parsed = BusinessProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Check the form and try again");
  }
  try {
    return ok(await saveBusinessProfile(await createDb(), parsed.data));
  } catch (err) {
    return fail(
      "BUSINESS_REFUSED",
      err instanceof Error && err.message ? err.message : "The business page could not be saved.",
    );
  }
}
