import "server-only";
import type { Db } from "@/lib/db/server";

/** Only the profile columns other members may read. */
const PUBLIC_PROFILE = "id, username, display_name, rating, reviews_count, is_verified";

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
}

export interface ListingSummary {
  id: string;
  slug?: string;
  title: string;
  category: string;
  format: "auction" | "buy_now" | "service" | "free_barter";
  currency: string;
  amountMinor: number;
  bidsCount: number;
  auctionEndsAt: string | null;
  city: string;
  imageUrl: string | null;
  createdAt: string;
  seller: PublicProfile;
}

export interface RequestSummary {
  id: string;
  title: string;
  category: string;
  requestType: "good" | "service";
  currency: string;
  budgetMinor: number;
  urgency: string;
  city: string;
  createdAt: string;
  buyer: PublicProfile;
}

type Row = Record<string, unknown>;

function one(value: unknown): Row | null {
  if (Array.isArray(value)) return (value[0] as Row | undefined) ?? null;
  return (value as Row | null) ?? null;
}

function mapProfile(value: unknown): PublicProfile {
  const row = one(value);
  return {
    id: String(row?.id ?? ""),
    username: String(row?.username ?? ""),
    displayName: String(row?.display_name ?? "Servilist member"),
    rating: Number(row?.rating ?? 0),
    reviewsCount: Number(row?.reviews_count ?? 0),
    verified: Boolean(row?.is_verified),
  };
}

/** Image addresses are member-supplied; only plain web addresses are passed on. */
function safeImage(value: unknown): string | null {
  const url = typeof value === "string" ? value.trim() : "";
  return /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : null;
}

/** Escapes the wildcard characters of a LIKE pattern in member-supplied search text. */
export function likePattern(query: string): string {
  return `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function listActiveListings(
  db: Db,
  options: { query?: string; limit?: number } = {},
): Promise<ListingSummary[]> {
  let request = db
    .from("listings")
    .select(
      `id, slug, title, category, format, currency, amount_minor, bids_count, auction_end_at, city, image_url, created_at, seller:profiles!seller_id(${PUBLIC_PROFILE})`,
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 12);

  const query = options.query?.trim();
  if (query) request = request.ilike("title", likePattern(query));

  const { data, error } = await request;
  if (error) throw new Error(`Could not load listings: ${error.message}`);

  return (data as Row[]).map((row) => ({
    id: String(row.id),
    slug: typeof row.slug === "string" ? row.slug : String(row.id),
    title: String(row.title),
    category: String(row.category),
    format: row.format as ListingSummary["format"],
    currency: String(row.currency),
    amountMinor: Number(row.amount_minor),
    bidsCount: Number(row.bids_count ?? 0),
    auctionEndsAt: (row.auction_end_at as string | null) ?? null,
    city: String(row.city),
    imageUrl: safeImage(row.image_url),
    createdAt: String(row.created_at),
    seller: mapProfile(row.seller),
  }));
}

export async function listOpenRequests(
  db: Db,
  options: { query?: string; limit?: number } = {},
): Promise<RequestSummary[]> {
  let request = db
    .from("buyer_requests")
    .select(
      `id, title, category, request_type, currency, budget_amount_minor, urgency, city, created_at, buyer:profiles!buyer_id(${PUBLIC_PROFILE})`,
    )
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 6);

  const query = options.query?.trim();
  if (query) request = request.ilike("title", likePattern(query));

  const { data, error } = await request;
  if (error) throw new Error(`Could not load requests: ${error.message}`);

  return (data as Row[]).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    category: String(row.category),
    requestType: row.request_type as RequestSummary["requestType"],
    currency: String(row.currency),
    budgetMinor: Number(row.budget_amount_minor),
    urgency: String(row.urgency),
    city: String(row.city),
    createdAt: String(row.created_at),
    buyer: mapProfile(row.buyer),
  }));
}
