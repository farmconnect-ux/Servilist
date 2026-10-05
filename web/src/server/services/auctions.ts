import "server-only";
import { createDb } from "@/lib/db/server";
import {
  CreateAuctionSchema,
  PlaceBidSchema,
  AuctionQuerySchema,
  type CreateAuctionInput,
  type PlaceBidInput,
  type AuctionQueryInput,
} from "../validators/auction";
import {
  createAuction,
  getAuctionById,
  listAuctions,
  placeBidRecord,
  getAuctionBids,
  settleAuctionRecord,
  type AuctionRecord,
  type BidRecord,
} from "../repositories/auctions";

export async function createAuctionAction(
  sellerId: string,
  rawInput: CreateAuctionInput,
): Promise<AuctionRecord> {
  const input = CreateAuctionSchema.parse(rawInput);
  const db = await createDb();
  return createAuction(db, sellerId, input);
}

export async function getAuctionDetailsAction(
  id: string,
): Promise<{ auction: AuctionRecord; bids: BidRecord[] } | null> {
  const db = await createDb();
  const auction = await getAuctionById(db, id);
  if (!auction) return null;
  const bids = await getAuctionBids(db, id);
  return { auction, bids };
}

export async function listAuctionsAction(
  rawQuery: AuctionQueryInput,
): Promise<{ auctions: AuctionRecord[]; total: number }> {
  const query = AuctionQuerySchema.parse(rawQuery);
  const db = await createDb();
  return listAuctions(db, query);
}

export async function placeBidAction(
  auctionId: string,
  bidderId: string,
  rawInput: PlaceBidInput,
): Promise<{
  bidId: string;
  amountMinor: number;
  newCurrentPrice: number;
  endsAt: string;
  extended: boolean;
}> {
  const input = PlaceBidSchema.parse(rawInput);
  const db = await createDb();
  return placeBidRecord(db, auctionId, bidderId, input.amountMajor, input.maxProxyMajor);
}

export async function settleAuctionAction(
  auctionId: string,
  callerUserId: string,
): Promise<{
  status: "settled" | "ended";
  winnerUserId: string | null;
  orderId?: string | null;
  message: string;
}> {
  const db = await createDb();
  return settleAuctionRecord(db, auctionId, callerUserId);
}
