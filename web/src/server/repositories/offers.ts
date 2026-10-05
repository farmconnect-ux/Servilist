import "server-only";
import type { Db } from "@/lib/db/server";
import { type PublicProfile } from "./marketplace";

const PUBLIC_PROFILE = "id, username, display_name, rating, reviews_count, is_verified, avatar_url, city, country";

export interface OfferRecord {
  id: string;
  listingId?: string | null;
  requestId?: string | null;
  buyerId: string;
  sellerId: string;
  proposerId: string;
  parentOfferId?: string | null;
  amountMinor: number;
  currency: string;
  message?: string | null;
  status: "pending" | "accepted" | "rejected" | "countered" | "expired" | "cancelled";
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  buyer?: PublicProfile;
  seller?: PublicProfile;
  listing?: {
    id: string;
    title: string;
    slug?: string;
    priceMinor: number;
    currency: string;
  } | null;
  request?: {
    id: string;
    title: string;
    budgetMinor: number;
    currency: string;
  } | null;
}

function mapOfferRow(row: any): OfferRecord {
  const buyer = Array.isArray(row.buyer) ? row.buyer[0] : row.buyer;
  const seller = Array.isArray(row.seller) ? row.seller[0] : row.seller;
  const listing = Array.isArray(row.listing) ? row.listing[0] : row.listing;
  const request = Array.isArray(row.request) ? row.request[0] : row.request;

  return {
    id: row.id,
    listingId: row.listing_id,
    requestId: row.request_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    proposerId: row.proposer_id,
    parentOfferId: row.parent_offer_id,
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    message: row.message,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    buyer: buyer ? {
      id: buyer.id,
      username: buyer.username,
      displayName: buyer.display_name,
      rating: Number(buyer.rating || 5.0),
      reviewsCount: Number(buyer.reviews_count || 0),
      verified: Boolean(buyer.is_verified),
    } : undefined,
    seller: seller ? {
      id: seller.id,
      username: seller.username,
      displayName: seller.display_name,
      rating: Number(seller.rating || 5.0),
      reviewsCount: Number(seller.reviews_count || 0),
      verified: Boolean(seller.is_verified),
    } : undefined,
    listing: listing ? {
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      priceMinor: Number(listing.price_minor || 0),
      currency: listing.currency || "NGN",
    } : null,
    request: request ? {
      id: request.id,
      title: request.title,
      budgetMinor: Number(request.budget_amount_minor || 0),
      currency: request.currency || "NGN",
    } : null,
  };
}

export async function createOffer(
  db: Db,
  params: {
    listingId?: string;
    requestId?: string;
    buyerId: string;
    sellerId: string;
    proposerId: string;
    amountMinor: number;
    currency: string;
    message?: string;
    parentOfferId?: string;
    expiresInHours?: number;
  },
): Promise<OfferRecord> {
  const expiresAt = params.expiresInHours
    ? new Date(Date.now() + params.expiresInHours * 3600 * 1000).toISOString()
    : new Date(Date.now() + 48 * 3600 * 1000).toISOString(); // 48h default

  const { data, error } = await db
    .from("offers")
    .insert({
      listing_id: params.listingId || null,
      request_id: params.requestId || null,
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
      proposer_id: params.proposerId,
      amount_minor: params.amountMinor,
      currency: params.currency,
      message: params.message || null,
      parent_offer_id: params.parentOfferId || null,
      status: "pending",
      expires_at: expiresAt,
    })
    .select(`
      *,
      buyer:profiles!buyer_id(${PUBLIC_PROFILE}),
      seller:profiles!seller_id(${PUBLIC_PROFILE})
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create offer: ${error.message}`);
  }

  // If this was a counter-offer, update the parent offer status to 'countered'
  if (params.parentOfferId) {
    await db
      .from("offers")
      .update({ status: "countered", updated_at: new Date().toISOString() })
      .eq("id", params.parentOfferId);
  }

  return mapOfferRow(data);
}

export async function getOfferById(db: Db, id: string): Promise<OfferRecord | null> {
  const { data, error } = await db
    .from("offers")
    .select(`
      *,
      buyer:profiles!buyer_id(${PUBLIC_PROFILE}),
      seller:profiles!seller_id(${PUBLIC_PROFILE}),
      listing:listings!listing_id(id, title, slug, price_minor, currency),
      request:buyer_requests!request_id(id, title, budget_amount_minor, currency)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapOfferRow(data);
}

export async function listOffersForListing(db: Db, listingId: string): Promise<OfferRecord[]> {
  const { data, error } = await db
    .from("offers")
    .select(`
      *,
      buyer:profiles!buyer_id(${PUBLIC_PROFILE}),
      seller:profiles!seller_id(${PUBLIC_PROFILE})
    `)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not list offers: ${error.message}`);
  return (data || []).map(mapOfferRow);
}

export async function listOffersForRequest(db: Db, requestId: string): Promise<OfferRecord[]> {
  const { data, error } = await db
    .from("offers")
    .select(`
      *,
      buyer:profiles!buyer_id(${PUBLIC_PROFILE}),
      seller:profiles!seller_id(${PUBLIC_PROFILE})
    `)
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not list offers: ${error.message}`);
  return (data || []).map(mapOfferRow);
}

export async function listOffersForUser(
  db: Db,
  userId: string,
  role: "buyer" | "seller" | "all" = "all",
): Promise<OfferRecord[]> {
  let query = db
    .from("offers")
    .select(`
      *,
      buyer:profiles!buyer_id(${PUBLIC_PROFILE}),
      seller:profiles!seller_id(${PUBLIC_PROFILE}),
      listing:listings!listing_id(id, title, slug, price_minor, currency),
      request:buyer_requests!request_id(id, title, budget_amount_minor, currency)
    `)
    .order("created_at", { ascending: false });

  if (role === "buyer") {
    query = query.eq("buyer_id", userId);
  } else if (role === "seller") {
    query = query.eq("seller_id", userId);
  } else {
    query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load user offers: ${error.message}`);
  return (data || []).map(mapOfferRow);
}

export async function updateOfferStatus(
  db: Db,
  id: string,
  status: "accepted" | "rejected" | "countered" | "cancelled" | "expired",
): Promise<void> {
  const { error } = await db
    .from("offers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`Failed to update offer status: ${error.message}`);
}
