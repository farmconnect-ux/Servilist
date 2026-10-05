import "server-only";
import type { Db } from "@/lib/db/server";
import type { OfferStatus } from "../validators/offer";

/**
 * Offers are written only by the database functions make_offer() and
 * respond_to_offer(); members have read access to their own offers and
 * nothing else. See supabase/migrations/00014.
 */

const OFFER_COLUMNS = `
  id, listing_id, buyer_id, seller_id, proposer_id, parent_offer_id,
  amount_minor, currency, message, status, expires_at, created_at, updated_at,
  buyer:profiles!buyer_id(id, username, display_name),
  seller:profiles!seller_id(id, username, display_name),
  listing:listings!listing_id(id, title, slug, amount_minor, currency)
`;

interface Party {
  id: string;
  username: string;
  displayName: string;
}

export interface OfferRecord {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  proposerId: string;
  parentOfferId: string | null;
  amountMinor: number;
  currency: string;
  message: string | null;
  /** "expired" is derived: a pending offer past its expiry time. */
  status: OfferStatus | "expired";
  expiresAt: string;
  createdAt: string;
  buyer: Party | null;
  seller: Party | null;
  listing: { id: string; title: string; slug: string | null; priceMinor: number } | null;
}

type Row = Record<string, unknown>;

function one(value: unknown): Row | null {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === "object" ? (row as Row) : null;
}

function party(value: unknown): Party | null {
  const row = one(value);
  if (!row) return null;
  return {
    id: String(row.id),
    username: String(row.username ?? ""),
    displayName: String(row.display_name ?? "Member"),
  };
}

function mapOffer(row: Row): OfferRecord {
  const listing = one(row.listing);
  const expiresAt = String(row.expires_at);
  const stored = row.status as OfferStatus;
  return {
    id: String(row.id),
    listingId: String(row.listing_id),
    buyerId: String(row.buyer_id),
    sellerId: String(row.seller_id),
    proposerId: String(row.proposer_id),
    parentOfferId: row.parent_offer_id ? String(row.parent_offer_id) : null,
    amountMinor: Number(row.amount_minor),
    currency: String(row.currency),
    message: row.message ? String(row.message) : null,
    status: stored === "pending" && new Date(expiresAt) <= new Date() ? "expired" : stored,
    expiresAt,
    createdAt: String(row.created_at),
    buyer: party(row.buyer),
    seller: party(row.seller),
    listing: listing
      ? {
          id: String(listing.id),
          title: String(listing.title),
          slug: listing.slug ? String(listing.slug) : null,
          priceMinor: Number(listing.amount_minor ?? 0),
        }
      : null,
  };
}

export async function makeOffer(
  db: Db,
  params: { listingId: string; amountMinor: number; message?: string },
): Promise<string> {
  const { data, error } = await db.rpc("make_offer", {
    p_listing_id: params.listingId,
    p_amount_minor: params.amountMinor,
    p_message: params.message ?? null,
  });
  if (error) throw new Error(error.message);
  return String(data);
}

export async function respondToOffer(
  db: Db,
  params: {
    offerId: string;
    action: "accept" | "reject" | "counter" | "cancel";
    counterAmountMinor?: number;
    message?: string;
  },
): Promise<string> {
  const { data, error } = await db.rpc("respond_to_offer", {
    p_offer_id: params.offerId,
    p_action: params.action,
    p_counter_amount_minor: params.counterAmountMinor ?? null,
    p_message: params.message ?? null,
  });
  if (error) throw new Error(error.message);
  return String(data);
}

/** Row-level security returns an offer only to its buyer, its seller or a moderator. */
export async function getOfferById(db: Db, id: string): Promise<OfferRecord | null> {
  const { data, error } = await db.from("offers").select(OFFER_COLUMNS).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapOffer(data as Row);
}

export async function listOffersForUser(
  db: Db,
  userId: string,
  filter: { role?: "buyer" | "seller" | "all"; listingId?: string } = {},
): Promise<OfferRecord[]> {
  let query = db
    .from("offers")
    .select(OFFER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter.role === "buyer") query = query.eq("buyer_id", userId);
  else if (filter.role === "seller") query = query.eq("seller_id", userId);
  else query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

  if (filter.listingId) query = query.eq("listing_id", filter.listingId);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load offers: ${error.message}`);
  return ((data ?? []) as Row[]).map(mapOffer);
}
