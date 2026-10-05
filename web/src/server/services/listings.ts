import "server-only";
import { createDb } from "@/lib/db/server";
import { canManage, canParticipate } from "@/server/policies/access";
import type { SessionUser } from "@/server/auth/session";
import {
  CreateListingSchema,
  UpdateListingSchema,
  type CreateListingInput,
  type UpdateListingInput,
} from "../validators/listing";
import {
  createListing,
  getListingById,
  updateListing,
  setListingStatus,
} from "../repositories/listings";
import { fail, ok, type Result } from "./result";

export async function createListingAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string; slug: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not allowed to publish listings.");
  }

  const parsed = CreateListingSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid listing details");
  }

  try {
    const db = await createDb();
    const created = await createListing(db, user.userId, parsed.data);

    // Audit log
    await db.rpc("write_audit_log", {
      p_action: "listing.created",
      p_entity_type: "listing",
      p_entity_id: created.id,
      p_metadata: { slug: created.slug, title: parsed.data.title },
    });

    return ok(created);
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to create listing");
  }
}

export async function updateListingAction(
  user: SessionUser,
  listingId: string,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  const parsed = UpdateListingSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid update data");
  }

  try {
    const db = await createDb();
    const existing = await getListingById(db, listingId);
    if (!existing) {
      return fail("NOT_FOUND", "Listing not found");
    }

    if (!canManage(user, { ownerId: existing.sellerId, moderatePermission: "listings.moderate" })) {
      return fail("FORBIDDEN", "You are not authorized to edit this listing.");
    }

    await updateListing(db, listingId, existing.sellerId, parsed.data);

    await db.rpc("write_audit_log", {
      p_action: "listing.updated",
      p_entity_type: "listing",
      p_entity_id: listingId,
      p_metadata: { title: parsed.data.title },
    });

    return ok({ id: listingId });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to update listing");
  }
}

export async function toggleListingPauseAction(
  user: SessionUser,
  listingId: string,
  pause: boolean,
): Promise<Result<{ status: string }>> {
  try {
    const db = await createDb();
    const existing = await getListingById(db, listingId);
    if (!existing) {
      return fail("NOT_FOUND", "Listing not found");
    }

    if (!canManage(user, { ownerId: existing.sellerId, moderatePermission: "listings.moderate" })) {
      return fail("FORBIDDEN", "You are not authorized to change this listing's status.");
    }

    const nextStatus = pause ? "paused" : "active";
    await setListingStatus(db, listingId, existing.sellerId, nextStatus);

    await db.rpc("write_audit_log", {
      p_action: pause ? "listing.paused" : "listing.resumed",
      p_entity_type: "listing",
      p_entity_id: listingId,
      p_metadata: { previousStatus: existing.status, nextStatus },
    });

    return ok({ status: nextStatus });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to update listing status");
  }
}
