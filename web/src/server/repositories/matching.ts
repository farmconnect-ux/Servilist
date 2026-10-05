import "server-only";
import type { Db } from "@/lib/db/server";

/**
 * Matching between buyer requests and listings.
 *
 * The database works matches out when asked (supabase/migrations/00020) and
 * only for the signed-in member: listings for a request they posted, or open
 * requests in the categories they sell in. Nothing is stored. Each match
 * carries the plain reasons it was chosen; there is no percentage, because a
 * score is only an ordering, not a likelihood.
 */

export type MatchReason = "category" | "words" | "budget" | "city";

export const MATCH_REASON_LABELS: Record<MatchReason, string> = {
  category: "Same category",
  words: "Similar title",
  budget: "Within budget",
  city: "Same city",
};

export interface MatchedListing {
  listingId: string;
  slug: string;
  title: string;
  amountMinor: number;
  currency: string;
  city: string;
  imageUrl: string | null;
  reasons: MatchReason[];
}

export interface MatchedRequest {
  requestId: string;
  title: string;
  budgetMinor: number;
  currency: string;
  city: string;
  urgency: string;
  reasons: MatchReason[];
}

type Row = Record<string, unknown>;

function safeImage(value: unknown): string | null {
  const url = typeof value === "string" ? value.trim() : "";
  return /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : null;
}

function reasons(value: unknown): MatchReason[] {
  return (Array.isArray(value) ? value : []).filter(
    (item): item is MatchReason => typeof item === "string" && item in MATCH_REASON_LABELS,
  );
}

/** Listings that fit a request. Empty unless the signed-in member posted the request. */
export async function findMatchingListingsForRequest(
  db: Db,
  requestId: string,
  limit = 6,
): Promise<MatchedListing[]> {
  const { data: matches, error } = await db.rpc("match_listings_for_request", {
    p_request_id: requestId,
    p_limit: limit,
  });
  if (error || !Array.isArray(matches) || matches.length === 0) return [];

  const ranked = matches as Row[];
  const { data: rows } = await db
    .from("listings")
    .select("id, slug, title, amount_minor, currency, city, image_url")
    .in(
      "id",
      ranked.map((match) => String(match.listing_id)),
    );
  const byId = new Map(((rows ?? []) as Row[]).map((row) => [String(row.id), row]));

  return ranked.flatMap((match) => {
    const row = byId.get(String(match.listing_id));
    if (!row) return [];
    return [
      {
        listingId: String(row.id),
        slug: String(row.slug ?? row.id),
        title: String(row.title),
        amountMinor: Number(row.amount_minor),
        currency: String(row.currency),
        city: String(row.city ?? ""),
        imageUrl: safeImage(row.image_url),
        reasons: reasons(match.reasons),
      },
    ];
  });
}

/** Open requests in the categories the signed-in member sells in. */
export async function findMatchingRequestsForSeller(db: Db, limit = 6): Promise<MatchedRequest[]> {
  const { data: matches, error } = await db.rpc("match_requests_for_seller", { p_limit: limit });
  if (error || !Array.isArray(matches) || matches.length === 0) return [];

  const ranked = matches as Row[];
  const { data: rows } = await db
    .from("buyer_requests")
    .select("id, title, budget_amount_minor, currency, city, urgency")
    .in(
      "id",
      ranked.map((match) => String(match.request_id)),
    );
  const byId = new Map(((rows ?? []) as Row[]).map((row) => [String(row.id), row]));

  return ranked.flatMap((match) => {
    const row = byId.get(String(match.request_id));
    if (!row) return [];
    return [
      {
        requestId: String(row.id),
        title: String(row.title),
        budgetMinor: Number(row.budget_amount_minor ?? 0),
        currency: String(row.currency),
        city: String(row.city ?? ""),
        urgency: String(row.urgency ?? ""),
        reasons: reasons(match.reasons),
      },
    ];
  });
}
