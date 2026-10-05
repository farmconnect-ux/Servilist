import "server-only";
import type { Db } from "@/lib/db/server";
import { likePattern } from "./marketplace";

/**
 * Auctions.
 *
 * An auction is a listing with format "auction"; its bids are rows in
 * public.bids. Bidding goes through place_bid(), which both sites share
 * (supabase/migrations/00010, 00018). Closing goes through close_auction()
 * (00022), which gives the winner an unpaid order in public.orders. Nothing
 * here writes a bid or a price directly.
 */

export interface AuctionSummary {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  currency: string;
  currentBidMinor: number;
  bidsCount: number;
  endsAt: string;
  city: string;
}

export interface BidRecord {
  id: string;
  bidderId: string;
  bidderName: string;
  amountMinor: number;
  currency: string;
  createdAt: string;
}

type Row = Record<string, unknown>;

function safeImage(value: unknown): string | null {
  const url = typeof value === "string" ? value.trim() : "";
  return /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : null;
}

/** The lowest bid the database will accept next: the start, then 5% (at least 100 minor units) more. */
export function minimumNextBid(currentMinor: number, bidsCount: number): number {
  if (bidsCount === 0) return Math.max(1, currentMinor);
  return currentMinor + Math.max(100, Math.ceil(currentMinor * 0.05));
}

/** Auctions that are still running, soonest to end first. */
export async function listAuctions(
  db: Db,
  params: { q?: string; city?: string; page?: number; limit?: number } = {},
): Promise<{ auctions: AuctionSummary[]; total: number }> {
  const limit = Math.min(params.limit ?? 20, 50);
  const page = Math.max(params.page ?? 1, 1);

  let query = db
    .from("listings")
    .select("id, slug, title, image_url, currency, amount_minor, bids_count, auction_end_at, city", {
      count: "exact",
    })
    .eq("format", "auction")
    .eq("status", "active")
    .gt("auction_end_at", new Date().toISOString())
    .order("auction_end_at", { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (params.q) query = query.ilike("title", likePattern(params.q));
  if (params.city) query = query.ilike("city", likePattern(params.city));

  const { data, count, error } = await query;
  if (error) throw new Error(`Could not load auctions: ${error.message}`);

  return {
    total: count ?? 0,
    auctions: ((data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      slug: String(row.slug ?? row.id),
      title: String(row.title),
      imageUrl: safeImage(row.image_url),
      currency: String(row.currency),
      currentBidMinor: Number(row.amount_minor),
      bidsCount: Number(row.bids_count ?? 0),
      endsAt: String(row.auction_end_at),
      city: String(row.city ?? ""),
    })),
  };
}

/** Bids on a listing, highest first. Bids are public; bidders are shown by display name. */
export async function getAuctionBids(db: Db, listingId: string, limit = 20): Promise<BidRecord[]> {
  const { data, error } = await db
    .from("bids")
    .select("id, bidder_id, amount_minor, currency, created_at, bidder:profiles!bidder_id(display_name)")
    .eq("listing_id", listingId)
    .order("amount_minor", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load bids: ${error.message}`);

  return ((data ?? []) as Row[]).map((row) => {
    const bidder = (Array.isArray(row.bidder) ? row.bidder[0] : row.bidder) as Row | null;
    return {
      id: String(row.id),
      bidderId: String(row.bidder_id),
      bidderName: String(bidder?.display_name ?? "A member"),
      amountMinor: Number(row.amount_minor),
      currency: String(row.currency),
      createdAt: String(row.created_at),
    };
  });
}

/** Where an auction's end time and reserve stand, for its page. */
export async function getAuctionState(
  db: Db,
  listingId: string,
): Promise<{ endsAt: string | null; hasReserve: boolean; reserveMet: boolean } | null> {
  const { data, error } = await db
    .from("listings")
    .select("auction_end_at, reserve_amount_minor, amount_minor, bids_count")
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data) return null;
  const reserve = data.reserve_amount_minor === null ? null : Number(data.reserve_amount_minor);
  return {
    endsAt: data.auction_end_at ? String(data.auction_end_at) : null,
    hasReserve: reserve !== null,
    // The reserve amount itself stays private; only whether it has been met is shown
    reserveMet: reserve === null || (Number(data.bids_count) > 0 && Number(data.amount_minor) >= reserve),
  };
}

export async function placeBid(db: Db, listingId: string, amountMinor: number): Promise<{ id: string }> {
  const { data, error } = await db.rpc("place_bid", {
    p_listing_id: listingId,
    p_amount_minor: amountMinor,
  });
  if (error) throw new Error(error.message);
  return { id: String((data as Row | null)?.id ?? "") };
}

/**
 * Close an auction that has ended. "sold" comes with the winner's unpaid
 * order; "ended" means there were no bids or the reserve was not met.
 */
export async function settleAuction(
  db: Db,
  listingId: string,
): Promise<{ status: string; orderId: string | null }> {
  const { data, error } = await db.rpc("close_auction", { p_listing_id: listingId });
  if (error) throw new Error(error.message);
  const result = (data ?? {}) as Row;
  return {
    status: String(result.status ?? "ended"),
    orderId: result.order_id ? String(result.order_id) : null,
  };
}
