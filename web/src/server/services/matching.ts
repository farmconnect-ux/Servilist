import "server-only";
import { createDb } from "@/lib/db/server";
import {
  MatchQuerySchema,
  UnifiedSearchSchema,
  type UnifiedSearchInput,
} from "../validators/matching";
import {
  findMatchingListingsForRequest,
  findMatchingRequestsForSeller,
  type MatchedListing,
  type MatchedRequest,
} from "../repositories/matching";

export async function getSuggestedListingsForRequestAction(
  requestId: string,
  limit: number = 10,
): Promise<MatchedListing[]> {
  const db = await createDb();
  return findMatchingListingsForRequest(db, requestId, limit);
}

export async function getSuggestedRequestsForSellerAction(
  sellerId: string,
  limit: number = 10,
): Promise<MatchedRequest[]> {
  const db = await createDb();
  return findMatchingRequestsForSeller(db, sellerId, limit);
}

export async function unifiedSearchAction(
  rawInput: UnifiedSearchInput,
): Promise<{
  listings: any[];
  requests: any[];
  services: any[];
  auctions: any[];
}> {
  const input = UnifiedSearchSchema.parse(rawInput);
  const db = await createDb();

  const term = `%${input.q}%`;

  const [listingsRes, requestsRes, servicesRes, auctionsRes] = await Promise.all([
    input.entityType === "all" || input.entityType === "listings"
      ? db
          .from("listings")
          .select("id, title, slug, amount_minor, currency, category, city, image_url, condition")
          .ilike("title", term)
          .eq("status", "active")
          .limit(input.limit)
      : Promise.resolve({ data: [] }),
    input.entityType === "all" || input.entityType === "requests"
      ? db
          .from("buyer_requests")
          .select("id, title, budget_minor, currency, category, city, status")
          .ilike("title", term)
          .eq("status", "active")
          .limit(input.limit)
      : Promise.resolve({ data: [] }),
    input.entityType === "all" || input.entityType === "services"
      ? db
          .from("services")
          .select("id, title, slug, starting_price_minor, currency, category_slug, city")
          .ilike("title", term)
          .eq("status", "active")
          .limit(input.limit)
      : Promise.resolve({ data: [] }),
    input.entityType === "all" || input.entityType === "auctions"
      ? db
          .from("auctions")
          .select("id, current_amount_minor, currency, ends_at, status, listings(title, image_url, city)")
          .eq("status", "active")
          .limit(input.limit)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    listings: listingsRes.data || [],
    requests: requestsRes.data || [],
    services: servicesRes.data || [],
    auctions: (auctionsRes.data || []).filter(
      (a: any) => !input.q || a.listings?.title?.toLowerCase().includes(input.q.toLowerCase()),
    ),
  };
}
