import "server-only";
import { createDb } from "@/lib/db/server";
import { isUuid } from "@/lib/ids";
import { isReleased } from "@/lib/release";
import { listAuctions } from "../repositories/auctions";
import { searchListings } from "../repositories/listings";
import { listOpenRequests } from "../repositories/marketplace";
import {
  findMatchingListingsForRequest,
  findMatchingRequestsForSeller,
  type MatchedListing,
  type MatchedRequest,
} from "../repositories/matching";
import { listServices } from "../repositories/services";
import { MatchQuerySchema, UnifiedSearchSchema } from "../validators/matching";
import { fail, ok, type Result } from "./result";

/** Matching and cross-marketplace search. The database limits matches to the signed-in member. */

export async function getSuggestedListingsForRequestAction(
  requestId: string,
  rawQuery: unknown,
): Promise<Result<MatchedListing[]>> {
  if (!isUuid(requestId)) return fail("NOT_FOUND", "Request not found");
  const parsed = MatchQuerySchema.safeParse(rawQuery ?? {});
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid limit");
  return ok(await findMatchingListingsForRequest(await createDb(), requestId, parsed.data.limit));
}

export async function getSuggestedRequestsForSellerAction(
  rawQuery: unknown,
): Promise<Result<MatchedRequest[]>> {
  const parsed = MatchQuerySchema.safeParse(rawQuery ?? {});
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid limit");
  return ok(await findMatchingRequestsForSeller(await createDb(), parsed.data.limit));
}

export interface UnifiedSearchResult {
  listings: { id: string; slug: string; title: string; amountMinor: number; currency: string; city: string }[];
  services: { id: string; slug: string; title: string; city: string }[];
  requests: { id: string; title: string; budgetMinor: number; currency: string; city: string }[];
  auctions: { id: string; slug: string; title: string; currentBidMinor: number; currency: string; endsAt: string }[];
}

/** One search across listings, services, requests and auctions, by title. Only open areas are searched. */
export async function unifiedSearchAction(rawInput: unknown): Promise<Result<UnifiedSearchResult>> {
  const parsed = UnifiedSearchSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid search");
  }
  const { q, type, limit } = parsed.data;
  const wants = (kind: typeof type, path: string) => (type === "all" || type === kind) && isReleased(path);

  try {
    const db = await createDb();
    const [listings, services, requests, auctions] = await Promise.all([
      wants("listings", "/api/v1/listings") ? searchListings(db, { q, limit, page: 1 }) : null,
      wants("services", "/api/v1/services") ? listServices(db, { q, limit, page: 1 }) : null,
      wants("requests", "/api/v1/requests") ? listOpenRequests(db, { query: q, limit }) : null,
      wants("auctions", "/api/v1/auctions") ? listAuctions(db, { q, limit, page: 1 }) : null,
    ]);

    return ok({
      listings: (listings?.listings ?? [])
        .filter((item) => item.format !== "auction")
        .map((item) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          amountMinor: item.amountMinor,
          currency: item.currency,
          city: item.city,
        })),
      services: (services?.services ?? []).map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        city: item.city ?? "",
      })),
      requests: (requests ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        budgetMinor: item.budgetMinor,
        currency: item.currency,
        city: item.city,
      })),
      auctions: (auctions?.auctions ?? []).map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        currentBidMinor: item.currentBidMinor,
        currency: item.currency,
        endsAt: item.endsAt,
      })),
    });
  } catch {
    return fail("SERVER_ERROR", "Search is unavailable right now. Please try again.");
  }
}
