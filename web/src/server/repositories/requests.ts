import "server-only";
import type { Db } from "@/lib/db/server";
import { toMinorUnits } from "@/lib/money";
import type { CreateRequestInput, CreateQuoteInput } from "../validators/request";
import { likePattern, type PublicProfile } from "./marketplace";

const PUBLIC_PROFILE = "id, username, display_name, rating, reviews_count, is_verified, avatar_url, city, country";

export interface FullBuyerRequest {
  id: string;
  buyerId: string;
  title: string;
  description: string;
  category: string;
  requestType: string;
  currency: string;
  budgetMinor: number;
  urgency: string;
  conditionRequired?: string | null;
  city: string;
  country: string;
  fulfillment: string;
  status: string;
  createdAt: string;
  deadline?: string | null;
  buyer: PublicProfile;
  quotesCount: number;
}

export interface QuoteItem {
  id: string;
  requestId: string;
  providerId: string;
  amountMinor: number;
  currency: string;
  timeline: string;
  message: string;
  status: string;
  createdAt: string;
  provider: PublicProfile;
}

export async function createBuyerRequest(
  db: Db,
  buyerId: string,
  input: CreateRequestInput,
): Promise<{ id: string }> {
  const budgetMinor = toMinorUnits(input.budgetMajor, input.currency);
  const deadline = new Date(Date.now() + input.deadlineDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from("buyer_requests")
    .insert({
      buyer_id: buyerId,
      title: input.title,
      description: input.description,
      category: input.category,
      request_type: input.requestType === "good" ? "good" : "service",
      currency: input.currency,
      budget_amount_minor: budgetMinor,
      urgency: input.urgency,
      condition_required: input.conditionRequired || null,
      city: input.city,
      country: input.country,
      fulfillment: input.fulfillment,
      response_deadline: deadline,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create request: ${error.message}`);
  }

  return { id: data.id };
}

export async function getBuyerRequestById(db: Db, id: string): Promise<FullBuyerRequest | null> {
  const { data, error } = await db
    .from("buyer_requests")
    .select(`
      *,
      buyer:profiles!buyer_id(${PUBLIC_PROFILE}),
      quotes(id)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const buyer = Array.isArray(data.buyer) ? data.buyer[0] : data.buyer;
  const quotesList = (data.quotes || []) as any[];

  return {
    id: data.id,
    buyerId: data.buyer_id,
    title: data.title,
    description: data.description,
    category: data.category,
    requestType: data.request_type,
    currency: data.currency,
    budgetMinor: Number(data.budget_amount_minor || 0),
    urgency: data.urgency,
    conditionRequired: data.condition_required,
    city: data.city,
    country: data.country,
    fulfillment: data.fulfillment,
    status: data.status,
    createdAt: data.created_at,
    deadline: data.response_deadline,
    quotesCount: quotesList.length,
    buyer: {
      id: buyer?.id || data.buyer_id,
      username: buyer?.username || "",
      displayName: buyer?.display_name || "Buyer",
      rating: Number(buyer?.rating || 5.0),
      reviewsCount: Number(buyer?.reviews_count || 0),
      verified: Boolean(buyer?.is_verified),
    },
  };
}

export async function listBuyerRequests(
  db: Db,
  params: { category?: string; city?: string; q?: string; buyerId?: string; limit?: number; page?: number } = {},
): Promise<{ requests: FullBuyerRequest[]; total: number }> {
  let query = db
    .from("buyer_requests")
    .select(`
      *,
      buyer:profiles!buyer_id(${PUBLIC_PROFILE}),
      quotes(id)
    `, { count: "exact" });

  if (params.buyerId) {
    query = query.eq("buyer_id", params.buyerId);
  } else {
    query = query.eq("status", "open");
  }

  if (params.q) {
    query = query.or(`title.ilike.${likePattern(params.q)},description.ilike.${likePattern(params.q)}`);
  }
  if (params.category && params.category !== "all") {
    query = query.eq("category", params.category);
  }
  if (params.city && params.city !== "all") {
    query = query.ilike("city", likePattern(params.city));
  }

  query = query.order("created_at", { ascending: false });

  const limit = params.limit || 20;
  const page = params.page || 1;
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Could not load requests: ${error.message}`);

  const requests = (data || []).map((row: any) => {
    const buyer = Array.isArray(row.buyer) ? row.buyer[0] : row.buyer;
    const quotesList = (row.quotes || []) as any[];
    return {
      id: row.id,
      buyerId: row.buyer_id,
      title: row.title,
      description: row.description,
      category: row.category,
      requestType: row.request_type,
      currency: row.currency,
      budgetMinor: Number(row.budget_amount_minor || 0),
      urgency: row.urgency,
      conditionRequired: row.condition_required,
      city: row.city,
      country: row.country,
      fulfillment: row.fulfillment,
      status: row.status,
      createdAt: row.created_at,
      deadline: row.response_deadline,
      quotesCount: quotesList.length,
      buyer: {
        id: buyer?.id || row.buyer_id,
        username: buyer?.username || "",
        displayName: buyer?.display_name || "Buyer",
        rating: Number(buyer?.rating || 5.0),
        reviewsCount: Number(buyer?.reviews_count || 0),
        verified: Boolean(buyer?.is_verified),
      },
    };
  });

  return { requests, total: count || 0 };
}

export async function submitQuote(
  db: Db,
  providerId: string,
  input: CreateQuoteInput,
  currency: string,
): Promise<{ id: string }> {
  // A quote is always in the request's currency
  const amountMinor = toMinorUnits(input.amountMajor, currency);

  const { data, error } = await db
    .from("quotes")
    .insert({
      request_id: input.requestId,
      provider_id: providerId,
      amount_minor: amountMinor,
      currency,
      timeline: input.timeline,
      message: input.message,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to submit quote: ${error.message}`);
  }

  return { id: data.id };
}

export async function getQuotesForRequest(db: Db, requestId: string): Promise<QuoteItem[]> {
  const { data, error } = await db
    .from("quotes")
    .select(`
      *,
      provider:profiles!provider_id(${PUBLIC_PROFILE})
    `)
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load quotes: ${error.message}`);

  return (data || []).map((row: any) => {
    const prov = Array.isArray(row.provider) ? row.provider[0] : row.provider;
    return {
      id: row.id,
      requestId: row.request_id,
      providerId: row.provider_id,
      amountMinor: Number(row.amount_minor),
      currency: row.currency,
      timeline: row.timeline,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
      provider: {
        id: prov?.id || row.provider_id,
        username: prov?.username || "",
        displayName: prov?.display_name || "Provider",
        rating: Number(prov?.rating || 5.0),
        reviewsCount: Number(prov?.reviews_count || 0),
        verified: Boolean(prov?.is_verified),
      },
    };
  });
}
