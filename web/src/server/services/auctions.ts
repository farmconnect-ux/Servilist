import "server-only";
import { createDb } from "@/lib/db/server";
import { isUuid } from "@/lib/ids";
import { formatMoney, toMinorUnits } from "@/lib/money";
import type { SessionUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";
import {
  getAuctionBids,
  listAuctions,
  placeBid,
  settleAuction,
  type AuctionSummary,
  type BidRecord,
} from "../repositories/auctions";
import { getListingById } from "../repositories/listings";
import { AuctionQuerySchema, PlaceBidSchema } from "../validators/auction";
import { fail, ok, type Result } from "./result";

/** Auction workflows. The database enforces who may bid, the minimum bid and when an auction closes. */

function reason(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export async function listAuctionsAction(
  rawQuery: unknown,
): Promise<Result<{ auctions: AuctionSummary[]; total: number }>> {
  const parsed = AuctionQuerySchema.safeParse(rawQuery ?? {});
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid search");
  try {
    return ok(await listAuctions(await createDb(), parsed.data));
  } catch (err) {
    return fail("SERVER_ERROR", reason(err, "Auctions could not be loaded."));
  }
}

export async function listBidsAction(listingId: string): Promise<Result<BidRecord[]>> {
  if (!isUuid(listingId)) return fail("NOT_FOUND", "Auction not found");
  try {
    return ok(await getAuctionBids(await createDb(), listingId));
  } catch (err) {
    return fail("SERVER_ERROR", reason(err, "Bids could not be loaded."));
  }
}

export async function placeBidAction(
  user: SessionUser,
  listingId: string,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  if (!canParticipate(user)) return fail("FORBIDDEN", "Your account is not permitted to bid.");
  if (!isUuid(listingId)) return fail("NOT_FOUND", "Auction not found");
  const parsed = PlaceBidSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Enter a bid amount");
  }

  try {
    const db = await createDb();
    const listing = await getListingById(db, listingId);
    if (!listing || listing.format !== "auction") return fail("NOT_FOUND", "Auction not found");
    return ok(await placeBid(db, listing.id, toMinorUnits(parsed.data.amountMajor, listing.currency)));
  } catch (err) {
    // The database reports the minimum in minor units; show it as money
    const message = reason(err, "Your bid could not be placed.");
    const minimum = /at least (\d+) minor units/.exec(message);
    if (minimum) {
      const listing = await getListingById(await createDb(), listingId).catch(() => null);
      if (listing) {
        return fail("BID_TOO_LOW", `Your bid must be at least ${formatMoney(Number(minimum[1]), listing.currency)}.`);
      }
    }
    return fail("BID_REFUSED", message);
  }
}

export async function settleAuctionAction(
  user: SessionUser,
  listingId: string,
): Promise<Result<{ status: string; orderId: string | null }>> {
  if (!canParticipate(user)) return fail("FORBIDDEN", "Your account is restricted.");
  if (!isUuid(listingId)) return fail("NOT_FOUND", "Auction not found");
  try {
    return ok(await settleAuction(await createDb(), listingId));
  } catch (err) {
    return fail("AUCTION_REFUSED", reason(err, "The auction could not be closed."));
  }
}
