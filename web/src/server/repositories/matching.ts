import "server-only";
import type { Db } from "@/lib/db/server";

export interface MatchedListing {
  listingId: string;
  title: string;
  amountMinor: number;
  currency: string;
  category: string;
  city: string;
  imageUrl: string;
  matchScore: number;
  matchReasons: string[];
}

export interface MatchedRequest {
  requestId: string;
  title: string;
  budgetMinor: number | null;
  currency: string;
  category: string;
  city: string;
  matchScore: number;
  matchReasons: string[];
  buyer: {
    username: string;
    displayName: string;
    rating: number;
  };
}

export async function findMatchingListingsForRequest(
  db: Db,
  requestId: string,
  limit: number = 10,
): Promise<MatchedListing[]> {
  // First attempt RPC function
  const { data: rpcData, error: rpcError } = await db.rpc(
    "find_matching_listings_for_request",
    {
      p_request_id: requestId,
      p_limit: limit,
    },
  );

  if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
    return rpcData.map((row: any) => ({
      listingId: row.listing_id,
      title: row.title,
      amountMinor: Number(row.amount_minor),
      currency: row.currency,
      category: row.category,
      city: row.city,
      imageUrl: row.image_url,
      matchScore: Number(row.match_score),
      matchReasons: (row.match_reasons || []).filter(Boolean),
    }));
  }

  // Fallback programmatic matching if RPC not yet created in memory
  const { data: req } = await db
    .from("buyer_requests")
    .select("category, city, budget_minor, title")
    .eq("id", requestId)
    .single();

  if (!req) return [];

  const { data: listings } = await db
    .from("listings")
    .select("id, title, amount_minor, currency, category, city, image_url")
    .eq("status", "active")
    .eq("category", req.category)
    .limit(limit);

  return (listings || []).map((l: any) => {
    const reasons: string[] = ["category_match"];
    let score = 50;
    if (l.city?.toLowerCase() === req.city?.toLowerCase()) {
      score += 25;
      reasons.push("city_match");
    }
    if (req.budget_minor && l.amount_minor <= req.budget_minor) {
      score += 25;
      reasons.push("within_budget");
    }

    return {
      listingId: l.id,
      title: l.title,
      amountMinor: Number(l.amount_minor),
      currency: l.currency,
      category: l.category,
      city: l.city,
      imageUrl: l.image_url,
      matchScore: score,
      matchReasons: reasons,
    };
  });
}

export async function findMatchingRequestsForSeller(
  db: Db,
  sellerId: string,
  limit: number = 10,
): Promise<MatchedRequest[]> {
  // Get seller's listing categories
  const { data: sellerListings } = await db
    .from("listings")
    .select("category, city")
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .limit(20);

  if (!sellerListings || sellerListings.length === 0) {
    return [];
  }

  const categories = Array.from(new Set(sellerListings.map((l) => l.category)));
  const cities = Array.from(new Set(sellerListings.map((l) => l.city).filter(Boolean)));

  // Query open buyer requests matching these categories
  const { data: requests, error } = await db
    .from("buyer_requests")
    .select(
      `
      id,
      title,
      budget_minor,
      currency,
      category,
      city,
      buyer:profiles!buyer_id(username, display_name, rating)
    `,
    )
    .in("category", categories)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !requests) return [];

  return requests.map((r: any) => {
    const reasons: string[] = ["category_match"];
    let score = 60;
    if (cities.includes(r.city)) {
      score += 30;
      reasons.push("city_match");
    }

    return {
      requestId: r.id,
      title: r.title,
      budgetMinor: r.budget_minor ? Number(r.budget_minor) : null,
      currency: r.currency || "NGN",
      category: r.category,
      city: r.city,
      matchScore: score,
      matchReasons: reasons,
      buyer: {
        username: r.buyer?.username || "buyer",
        displayName: r.buyer?.display_name || "Verified Buyer",
        rating: Number(r.buyer?.rating || 0),
      },
    };
  });
}
