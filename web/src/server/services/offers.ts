import "server-only";
import { createDb } from "@/lib/db/server";
import { canParticipate } from "@/server/policies/access";
import type { SessionUser } from "@/server/auth/session";
import { toMinorUnits } from "@/lib/money";
import {
  CreateOfferSchema,
  RespondOfferSchema,
  type CreateOfferInput,
  type RespondOfferInput,
} from "../validators/offer";
import {
  createOffer,
  getOfferById,
  updateOfferStatus,
} from "../repositories/offers";
import { getListingById } from "../repositories/listings";
import { getBuyerRequestById } from "../repositories/requests";
import { fail, ok, type Result } from "./result";

export async function createOfferAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not permitted to make offers.");
  }

  const parsed = CreateOfferSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid offer data");
  }

  const { listingId, requestId, amountMajor, currency, message, parentOfferId } = parsed.data;

  try {
    const db = await createDb();
    let buyerId: string;
    let sellerId: string;

    if (listingId) {
      const listing = await getListingById(db, listingId);
      if (!listing) return fail("NOT_FOUND", "Listing not found");
      if (listing.sellerId === user.userId) {
        return fail("INVALID_ACTION", "You cannot make an offer on your own listing");
      }
      if (listing.status !== "active") {
        return fail("INVALID_STATUS", "Listing is not currently active");
      }
      buyerId = user.userId;
      sellerId = listing.sellerId;
    } else if (requestId) {
      const request = await getBuyerRequestById(db, requestId);
      if (!request) return fail("NOT_FOUND", "Buyer request not found");
      if (request.buyerId === user.userId) {
        return fail("INVALID_ACTION", "You cannot make an offer on your own request");
      }
      if (request.status !== "open" && request.status !== "receiving_offers") {
        return fail("INVALID_STATUS", "Buyer request is not currently accepting offers");
      }
      buyerId = request.buyerId;
      sellerId = user.userId;
    } else {
      return fail("VALIDATION_ERROR", "Offer must specify listing or request");
    }

    const amountMinor = toMinorUnits(amountMajor, currency);

    const created = await createOffer(db, {
      listingId,
      requestId,
      buyerId,
      sellerId,
      proposerId: user.userId,
      amountMinor,
      currency,
      message,
      parentOfferId,
    });

    await db.rpc("write_audit_log", {
      p_action: "offer.created",
      p_entity_type: "offer",
      p_entity_id: created.id,
      p_metadata: { listingId, requestId, amountMinor, currency },
    });

    return ok({ id: created.id });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to submit offer");
  }
}

export async function respondOfferAction(
  user: SessionUser,
  offerId: string,
  rawInput: unknown,
): Promise<Result<{ status: string; counterOfferId?: string }>> {
  const parsed = RespondOfferSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid response parameters");
  }

  const { action, counterAmountMajor, counterMessage } = parsed.data;

  try {
    const db = await createDb();
    const existing = await getOfferById(db, offerId);
    if (!existing) return fail("NOT_FOUND", "Offer not found");

    if (existing.status !== "pending") {
      return fail("INVALID_STATUS", `This offer is already ${existing.status}`);
    }

    // Cancel action: only the proposer can cancel their own offer
    if (action === "cancel") {
      if (existing.proposerId !== user.userId) {
        return fail("FORBIDDEN", "Only the person who made the offer can cancel it");
      }
      await updateOfferStatus(db, offerId, "cancelled");
      await db.rpc("write_audit_log", {
        p_action: "offer.cancelled",
        p_entity_type: "offer",
        p_entity_id: offerId,
      });
      return ok({ status: "cancelled" });
    }

    // Accept, reject, counter: only the counterparty can perform these
    if (existing.proposerId === user.userId) {
      return fail("FORBIDDEN", "You cannot accept, reject, or counter your own offer");
    }

    if (action === "accept") {
      await updateOfferStatus(db, offerId, "accepted");
      await db.rpc("write_audit_log", {
        p_action: "offer.accepted",
        p_entity_type: "offer",
        p_entity_id: offerId,
        p_metadata: { amountMinor: existing.amountMinor, currency: existing.currency },
      });
      return ok({ status: "accepted" });
    }

    if (action === "reject") {
      await updateOfferStatus(db, offerId, "rejected");
      await db.rpc("write_audit_log", {
        p_action: "offer.rejected",
        p_entity_type: "offer",
        p_entity_id: offerId,
      });
      return ok({ status: "rejected" });
    }

    if (action === "counter") {
      if (!counterAmountMajor || counterAmountMajor <= 0) {
        return fail("VALIDATION_ERROR", "Counter offer amount must be greater than zero");
      }

      const counterMinor = toMinorUnits(counterAmountMajor, existing.currency);
      const counterOffer = await createOffer(db, {
        listingId: existing.listingId || undefined,
        requestId: existing.requestId || undefined,
        buyerId: existing.buyerId,
        sellerId: existing.sellerId,
        proposerId: user.userId,
        amountMinor: counterMinor,
        currency: existing.currency,
        message: counterMessage,
        parentOfferId: existing.id,
      });

      await db.rpc("write_audit_log", {
        p_action: "offer.countered",
        p_entity_type: "offer",
        p_entity_id: existing.id,
        p_metadata: { counterOfferId: counterOffer.id, amountMinor: counterMinor },
      });

      return ok({ status: "countered", counterOfferId: counterOffer.id });
    }

    return fail("INVALID_ACTION", "Unrecognized action");
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to respond to offer");
  }
}
