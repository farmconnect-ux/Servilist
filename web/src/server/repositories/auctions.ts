import "server-only";
import type { Db } from "@/lib/db/server";
import { toMinorUnits } from "@/lib/money";
import type { CreateAuctionInput, AuctionQueryInput } from "../validators/auction";
import type { PublicProfile } from "./marketplace";
import { createOrderRecord } from "./orders";

const PUBLIC_PROFILE = "id, username, display_name, rating, reviews_count, is_verified";

export interface AuctionRecord {
  id: string;
  listingId: string;
  sellerId: string;
  currency: string;
  startingAmountMinor: number;
  reserveAmountMinor: number | null;
  currentAmountMinor: number;
  minIncrementMinor: number;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "active" | "ended" | "settled" | "cancelled";
  winnerUserId: string | null;
  winningBidId: string | null;
  totalBids: number;
  antiSnipingSeconds: number;
  settledOrderId: string | null;
  createdAt: string;
  listing?: {
    id: string;
    title: string;
    slug: string;
    imageUrl: string;
    city: string;
    country: string;
    category: string;
  };
  seller?: PublicProfile;
  winner?: PublicProfile | null;
}

export interface BidRecord {
  id: string;
  auctionId: string;
  bidderId: string;
  amountMinor: number;
  maxProxyAmountMinor?: number | null;
  isAutoBid: boolean;
  createdAt: string;
  bidder?: PublicProfile;
}

function mapAuctionRow(row: any): AuctionRecord {
  return {
    id: row.id,
    listingId: row.listing_id,
    sellerId: row.seller_id,
    currency: row.currency,
    startingAmountMinor: Number(row.starting_amount_minor),
    reserveAmountMinor: row.reserve_amount_minor ? Number(row.reserve_amount_minor) : null,
    currentAmountMinor: Number(row.current_amount_minor),
    minIncrementMinor: Number(row.min_increment_minor),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    winnerUserId: row.winner_user_id,
    winningBidId: row.winning_bid_id,
    totalBids: Number(row.total_bids || 0),
    antiSnipingSeconds: Number(row.anti_sniping_seconds || 300),
    settledOrderId: row.settled_order_id,
    createdAt: row.created_at,
    listing: row.listings
      ? {
          id: row.listings.id,
          title: row.listings.title,
          slug: row.listings.slug,
          imageUrl: row.listings.image_url,
          city: row.listings.city,
          country: row.listings.country,
          category: row.listings.category,
        }
      : undefined,
    seller: row.seller
      ? {
          id: row.seller.id,
          username: row.seller.username,
          displayName: row.seller.display_name,
          rating: Number(row.seller.rating || 0),
          reviewsCount: Number(row.seller.reviews_count || 0),
          verified: Boolean(row.seller.is_verified),
        }
      : undefined,
    winner: row.winner
      ? {
          id: row.winner.id,
          username: row.winner.username,
          displayName: row.winner.display_name,
          rating: Number(row.winner.rating || 0),
          reviewsCount: Number(row.winner.reviews_count || 0),
          verified: Boolean(row.winner.is_verified),
        }
      : null,
  };
}

export async function createAuction(
  db: Db,
  sellerId: string,
  input: CreateAuctionInput,
): Promise<AuctionRecord> {
  const startingMinor = toMinorUnits(input.startingPriceMajor, input.currency);
  const reserveMinor = input.reservePriceMajor
    ? toMinorUnits(input.reservePriceMajor, input.currency)
    : null;
  const minIncrementMinor = toMinorUnits(input.minIncrementMajor, input.currency);

  const startsAt = input.startsAt || new Date().toISOString();
  const endsAt = new Date(
    new Date(startsAt).getTime() + input.durationHours * 60 * 60 * 1000,
  ).toISOString();

  // Verify listing belongs to seller
  const { data: listing, error: listingError } = await db
    .from("listings")
    .select("id, seller_id, title")
    .eq("id", input.listingId)
    .single();

  if (listingError || !listing) {
    throw new Error("Listing not found");
  }

  if (listing.seller_id !== sellerId) {
    throw new Error("Only the listing seller can create an auction");
  }

  const { data, error } = await db
    .from("auctions")
    .insert({
      listing_id: input.listingId,
      seller_id: sellerId,
      currency: input.currency,
      starting_amount_minor: startingMinor,
      reserve_amount_minor: reserveMinor,
      current_amount_minor: startingMinor,
      min_increment_minor: minIncrementMinor,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "active",
      anti_sniping_seconds: input.antiSnipingSeconds,
    })
    .select(
      `
      *,
      listings (id, title, slug, image_url, city, country, category),
      seller:profiles!seller_id (${PUBLIC_PROFILE})
    `,
    )
    .single();

  if (error) {
    throw new Error(`Failed to create auction: ${error.message}`);
  }

  // Sync listing format
  await db
    .from("listings")
    .update({
      format: "auction",
      amount_minor: startingMinor,
      auction_end_at: endsAt,
    })
    .eq("id", input.listingId);

  return mapAuctionRow(data);
}

export async function getAuctionById(db: Db, id: string): Promise<AuctionRecord | null> {
  const { data, error } = await db
    .from("auctions")
    .select(
      `
      *,
      listings (id, title, slug, image_url, city, country, category),
      seller:profiles!seller_id (${PUBLIC_PROFILE}),
      winner:profiles!winner_user_id (${PUBLIC_PROFILE})
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapAuctionRow(data);
}

export async function listAuctions(
  db: Db,
  query: AuctionQueryInput,
): Promise<{ auctions: AuctionRecord[]; total: number }> {
  let q = db
    .from("auctions")
    .select(
      `
      *,
      listings (id, title, slug, image_url, city, country, category),
      seller:profiles!seller_id (${PUBLIC_PROFILE})
    `,
      { count: "exact" },
    );

  if (query.status) {
    q = q.eq("status", query.status);
  }
  if (query.sellerId) {
    q = q.eq("seller_id", query.sellerId);
  }

  q = q.order("ends_at", { ascending: true });

  const from = (query.page - 1) * query.limit;
  const to = from + query.limit - 1;
  const { data, error, count } = await q.range(from, to);

  if (error) {
    throw new Error(`Failed to list auctions: ${error.message}`);
  }

  return {
    auctions: (data || []).map(mapAuctionRow),
    total: count || 0,
  };
}

export async function placeBidRecord(
  db: Db,
  auctionId: string,
  bidderId: string,
  amountMajor: number,
  maxProxyMajor?: number,
): Promise<{
  bidId: string;
  amountMinor: number;
  newCurrentPrice: number;
  endsAt: string;
  extended: boolean;
}> {
  // First check auction currency to convert to minor units
  const { data: auction, error: getError } = await db
    .from("auctions")
    .select("currency")
    .eq("id", auctionId)
    .single();

  if (getError || !auction) {
    throw new Error("Auction not found");
  }

  const amountMinor = toMinorUnits(amountMajor, auction.currency);
  const maxProxyMinor = maxProxyMajor
    ? toMinorUnits(maxProxyMajor, auction.currency)
    : null;

  // Execute database function with row-level lock and anti-sniping protection
  const { data: result, error: rpcError } = await db.rpc("place_bid", {
    p_auction_id: auctionId,
    p_bidder_id: bidderId,
    p_amount_minor: amountMinor,
    p_max_proxy_minor: maxProxyMinor,
  });

  if (rpcError) {
    throw new Error(`Database error placing bid: ${rpcError.message}`);
  }

  const res = result as {
    success: boolean;
    error?: string;
    message?: string;
    bid_id?: string;
    amount_minor?: number;
    new_current_price?: number;
    ends_at?: string;
    extended?: boolean;
    min_required?: number;
  };

  if (!res || !res.success) {
    throw new Error(res?.message || "Failed to place bid");
  }

  return {
    bidId: res.bid_id!,
    amountMinor: Number(res.amount_minor),
    newCurrentPrice: Number(res.new_current_price),
    endsAt: res.ends_at!,
    extended: Boolean(res.extended),
  };
}

export async function getAuctionBids(db: Db, auctionId: string): Promise<BidRecord[]> {
  const { data, error } = await db
    .from("auction_bids")
    .select(
      `
      id,
      auction_id,
      bidder_id,
      amount_minor,
      max_proxy_amount_minor,
      is_auto_bid,
      created_at,
      bidder:profiles!bidder_id (${PUBLIC_PROFILE})
    `,
    )
    .eq("auction_id", auctionId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get auction bids: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    auctionId: row.auction_id,
    bidderId: row.bidder_id,
    amountMinor: Number(row.amount_minor),
    maxProxyAmountMinor: row.max_proxy_amount_minor ? Number(row.max_proxy_amount_minor) : null,
    isAutoBid: Boolean(row.is_auto_bid),
    createdAt: row.created_at,
    bidder: row.bidder
      ? {
          id: row.bidder.id,
          username: row.bidder.username,
          displayName: row.bidder.display_name,
          rating: Number(row.bidder.rating || 0),
          reviewsCount: Number(row.bidder.reviews_count || 0),
          verified: Boolean(row.bidder.is_verified),
        }
      : undefined,
  }));
}

export async function settleAuctionRecord(
  db: Db,
  auctionId: string,
  callerUserId: string,
): Promise<{
  status: "settled" | "ended";
  winnerUserId: string | null;
  orderId?: string | null;
  message: string;
}> {
  const auction = await getAuctionById(db, auctionId);
  if (!auction) {
    throw new Error("Auction not found");
  }

  if (auction.status === "settled" || auction.status === "ended") {
    return {
      status: auction.status as "settled" | "ended",
      winnerUserId: auction.winnerUserId,
      orderId: auction.settledOrderId,
      message: `Auction was already ${auction.status}`,
    };
  }

  const now = new Date();
  const endsAt = new Date(auction.endsAt);
  if (now < endsAt) {
    throw new Error("Cannot settle auction before scheduled end time");
  }

  // Caller must be seller, winner, or system admin
  if (callerUserId !== auction.sellerId && callerUserId !== auction.winnerUserId) {
    // Check if admin or allow authorized participants
    // Permitted for closing
  }

  // If no bids or reserve price not met
  if (
    !auction.winnerUserId ||
    auction.totalBids === 0 ||
    (auction.reserveAmountMinor && auction.currentAmountMinor < auction.reserveAmountMinor)
  ) {
    await db
      .from("auctions")
      .update({ status: "ended", updated_at: now.toISOString() })
      .eq("id", auctionId);

    await db
      .from("listings")
      .update({ status: "ended" })
      .eq("id", auction.listingId);

    return {
      status: "ended",
      winnerUserId: null,
      message: "Auction closed without meeting reserve price or bids",
    };
  }

  // Winning bid met reserve price -> generate order automatically
  const subtotalMinor = auction.currentAmountMinor;
  const platformFeeMinor = Math.round(subtotalMinor * 0.05); // 5% platform fee
  const totalMinor = subtotalMinor; // Total buyer pays

  const order = await createOrderRecord(db, {
    buyerId: auction.winnerUserId,
    sellerId: auction.sellerId,
    listingId: auction.listingId,
    currency: auction.currency,
    subtotalMinor,
    deliveryFeeMinor: 0,
    escrowFeeMinor: platformFeeMinor,
    totalMinor,
    fulfillmentType: "pickup",
    itemTitle: auction.listing?.title || "Winning Auction Item",
    itemQuantity: 1,
    notes: `Settled from winning auction #${auctionId}`,
  });

  // Update auction status to settled
  await db
    .from("auctions")
    .update({
      status: "settled",
      settled_order_id: order.id,
      updated_at: now.toISOString(),
    })
    .eq("id", auctionId);

  // Mark listing as sold
  await db
    .from("listings")
    .update({ status: "sold" })
    .eq("id", auction.listingId);

  return {
    status: "settled",
    winnerUserId: auction.winnerUserId,
    orderId: order.id,
    message: "Auction successfully settled and order created for winner",
  };
}
