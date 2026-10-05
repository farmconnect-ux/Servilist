import "server-only";
import { createDb } from "@/lib/db/server";
import { toMinorUnits } from "@/lib/money";
import type { SessionUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";
import { getOfferById, makeOffer, respondToOffer } from "../repositories/offers";
import { getListingById } from "../repositories/listings";
import { CreateOfferSchema, RespondOfferSchema } from "../validators/offer";
import { fail, ok, type Result } from "./result";

/**
 * The checks here give a clear message early. The database functions repeat
 * every one of them and are what actually enforces the rules.
 */

function reason(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export async function createOfferAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not permitted to make offers.");
  }

  const parsed = CreateOfferSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid offer");
  }
  const { listingId, amountMajor, message } = parsed.data;

  try {
    const db = await createDb();
    const listing = await getListingById(db, listingId);
    if (!listing) return fail("NOT_FOUND", "Listing not found");

    const id = await makeOffer(db, {
      listingId,
      amountMinor: toMinorUnits(amountMajor, listing.currency),
      message,
    });
    return ok({ id });
  } catch (err) {
    return fail("OFFER_REFUSED", reason(err, "The offer could not be submitted."));
  }
}

export async function respondOfferAction(
  user: SessionUser,
  offerId: string,
  rawInput: unknown,
): Promise<Result<{ status: string; offerId: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not permitted to respond to offers.");
  }

  const parsed = RespondOfferSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid response");
  }
  const { action, counterAmountMajor, counterMessage } = parsed.data;

  try {
    const db = await createDb();
    // Row-level security hides offers the member is not a party to
    const existing = await getOfferById(db, offerId);
    if (!existing) return fail("NOT_FOUND", "Offer not found");

    const resultId = await respondToOffer(db, {
      offerId,
      action,
      counterAmountMinor:
        action === "counter" && counterAmountMajor !== undefined
          ? toMinorUnits(counterAmountMajor, existing.currency)
          : undefined,
      message: action === "counter" ? counterMessage : undefined,
    });

    const status = { accept: "accepted", reject: "rejected", counter: "countered", cancel: "cancelled" }[
      action
    ];
    return ok({ status, offerId: resultId });
  } catch (err) {
    return fail("OFFER_REFUSED", reason(err, "The offer could not be updated."));
  }
}
