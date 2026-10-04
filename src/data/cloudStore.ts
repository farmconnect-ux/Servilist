import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser } from '../auth/authService';
import type { Bid, BuyerRequest, EscrowOrder, Listing, Quote, UserProfile } from '../types';

// Only the columns other members are allowed to read (see migration 00010).
const PROFILE_COLUMNS =
  'id, display_name, avatar_url, rating, reviews_count, is_verified, city, country';

const LISTING_SELECT = `*, seller:profiles!seller_id(${PROFILE_COLUMNS}), bids(id, bidder_id, amount_minor, currency, created_at, bidder:profiles!bidder_id(display_name))`;

const REQUEST_SELECT = `*, buyer:profiles!buyer_id(${PROFILE_COLUMNS}), quotes(id, request_id, provider_id, currency, amount_minor, timeline, message, status, created_at, provider:profiles!provider_id(display_name, rating))`;

const ESCROW_SELECT =
  '*, otp:escrow_otps(otp_code), buyer:profiles!buyer_id(display_name), seller:profiles!seller_id(display_name)';

export const GUEST_USER: AuthUser = {
  id: 'guest',
  name: 'Guest',
  displayName: 'Guest',
  avatar: 'G',
  rating: 0,
  reviewsCount: 0,
  verified: false,
  role: 'user',
};

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SM'
  );
}

/** "Lagos, Nigeria" -> "Nigeria"; city selectors store the full label. */
export function countryFromCity(city: string): string {
  return city.split(',')[1]?.trim() || 'Africa';
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function mapProfile(row: any): UserProfile {
  const name = row?.display_name || 'Servilist member';
  return {
    id: row?.id || '',
    name,
    displayName: name,
    avatar: initials(name),
    rating: Number(row?.rating ?? 5),
    reviewsCount: Number(row?.reviews_count ?? 0),
    verified: Boolean(row?.is_verified),
    city: row?.city || undefined,
    country: row?.country || undefined,
  };
}

export function mapListing(row: any): Listing {
  const bidHistory: Bid[] = (row.bids || [])
    .map((b: any) => ({
      id: b.id,
      listingId: row.id,
      bidderId: b.bidder_id,
      bidderName: first<any>(b.bidder)?.display_name || 'Bidder',
      amountMinor: Number(b.amount_minor),
      currency: b.currency,
      createdAt: Date.parse(b.created_at),
    }))
    .sort((a: Bid, b: Bid) => b.createdAt - a.createdAt);

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    format: row.format,
    status: row.status,
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    buyItNowAmountMinor:
      row.buy_it_now_amount_minor == null ? null : Number(row.buy_it_now_amount_minor),
    reserveAmountMinor: row.reserve_amount_minor == null ? null : Number(row.reserve_amount_minor),
    bidsCount: Number(row.bids_count ?? 0),
    endTime: row.auction_end_at ? Date.parse(row.auction_end_at) : null,
    city: row.city,
    country: row.country,
    neighborhood: row.neighborhood || undefined,
    fulfillment: row.fulfillment,
    imageUrl: row.image_url,
    description: row.description,
    seller: mapProfile(first(row.seller)),
    bidHistory,
    isSold: row.status === 'sold',
    createdAt: Date.parse(row.created_at),
  };
}

export function mapRequest(row: any): BuyerRequest {
  const offers = (row.quotes || [])
    .map((q: any) => {
      const provider = first<any>(q.provider);
      const providerName = provider?.display_name || 'Provider';
      const quote: Quote = {
        id: q.id,
        requestId: q.request_id,
        providerName,
        providerAvatar: initials(providerName),
        providerRating: Number(provider?.rating ?? 5),
        amountMinor: Number(q.amount_minor),
        currency: q.currency,
        timeline: q.timeline,
        message: q.message,
        status: q.status,
        createdAt: Date.parse(q.created_at),
        providerId: q.provider_id,
      };
      return quote;
    })
    .sort((a: Quote, b: Quote) => b.createdAt - a.createdAt);

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    requestType: row.request_type,
    budgetAmountMinor: Number(row.budget_amount_minor),
    currency: row.currency,
    urgency: row.urgency,
    conditionRequired: row.condition_required || undefined,
    rateType: row.rate_type || 'flat',
    city: row.city,
    country: row.country,
    neighborhood: row.neighborhood || undefined,
    fulfillment: row.fulfillment,
    imageUrl: row.image_url || undefined,
    description: row.description,
    buyer: mapProfile(first(row.buyer)),
    offers,
    status: row.status,
    createdAt: Date.parse(row.created_at),
  };
}

export function mapEscrowOrder(row: any): EscrowOrder {
  return {
    id: row.id,
    listingId: row.listing_id || undefined,
    requestId: row.request_id || undefined,
    quoteId: row.quote_id || undefined,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    orderCode: row.order_code,
    title: row.title,
    buyerName: first<any>(row.buyer)?.display_name || 'Buyer',
    sellerName: first<any>(row.seller)?.display_name || 'Seller',
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    targetCurrency: row.currency,
    safeZone: row.safe_zone,
    status: row.status,
    // Row-level security returns the code to the buyer only
    otpCode: first<any>(row.otp)?.otp_code || '',
    fundedAt: Date.parse(row.funded_at),
    releasedAt: row.released_at ? Date.parse(row.released_at) : undefined,
  };
}

export function mapAuthUser(row: any, email?: string): AuthUser {
  return { ...mapProfile(row), email, role: 'user' };
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

/** All reads and writes against Supabase. Row-level security decides what each member sees. */
export class CloudStore {
  constructor(private readonly client: SupabaseClient) {}

  async fetchListings(): Promise<Listing[]> {
    const rows = unwrap<any[]>(
      await this.client
        .from('listings')
        .select(LISTING_SELECT)
        .order('created_at', { ascending: false })
        .limit(200)
    );
    return rows.map(mapListing);
  }

  async fetchRequests(): Promise<BuyerRequest[]> {
    const rows = unwrap<any[]>(
      await this.client
        .from('buyer_requests')
        .select(REQUEST_SELECT)
        .order('created_at', { ascending: false })
        .limit(200)
    );
    return rows.map(mapRequest);
  }

  async fetchEscrowOrders(): Promise<EscrowOrder[]> {
    const rows = unwrap<any[]>(
      await this.client
        .from('escrow_orders')
        .select(ESCROW_SELECT)
        .order('created_at', { ascending: false })
    );
    return rows.map(mapEscrowOrder);
  }

  async fetchProfile(userId: string, email?: string): Promise<AuthUser | null> {
    const { data } = await this.client
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle();
    return data ? mapAuthUser(data, email) : null;
  }

  async createListing(sellerId: string, listing: Listing): Promise<void> {
    unwrap(
      await this.client.from('listings').insert({
        seller_id: sellerId,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        format: listing.format,
        currency: listing.currency,
        amount_minor: listing.amountMinor,
        buy_it_now_amount_minor: listing.buyItNowAmountMinor ?? null,
        reserve_amount_minor: listing.reserveAmountMinor ?? null,
        auction_end_at: listing.endTime ? new Date(listing.endTime).toISOString() : null,
        city: listing.city,
        country: countryFromCity(listing.city),
        fulfillment: listing.fulfillment,
        image_url: listing.imageUrl,
      })
    );
  }

  async createRequest(buyerId: string, request: BuyerRequest): Promise<void> {
    unwrap(
      await this.client.from('buyer_requests').insert({
        buyer_id: buyerId,
        title: request.title,
        description: request.description,
        category: request.category,
        request_type: request.requestType,
        currency: request.currency,
        budget_amount_minor: request.budgetAmountMinor,
        urgency: request.urgency,
        rate_type: request.rateType,
        city: request.city,
        country: countryFromCity(request.city),
        fulfillment: request.fulfillment,
        image_url: request.imageUrl ?? null,
      })
    );
  }

  async submitQuote(
    providerId: string,
    quote: {
      requestId: string;
      currency: string;
      amountMinor: number;
      timeline: string;
      message: string;
    }
  ): Promise<void> {
    unwrap(
      await this.client.from('quotes').insert({
        request_id: quote.requestId,
        provider_id: providerId,
        currency: quote.currency,
        amount_minor: quote.amountMinor,
        timeline: quote.timeline,
        message: quote.message,
      })
    );
  }

  async placeBid(listingId: string, amountMinor: number): Promise<void> {
    unwrap(
      await this.client.rpc('place_bid', { p_listing_id: listingId, p_amount_minor: amountMinor })
    );
  }

  async acceptQuote(quoteId: string, safeZone: string): Promise<void> {
    unwrap(await this.client.rpc('accept_quote', { p_quote_id: quoteId, p_safe_zone: safeZone }));
  }

  async buyListing(listingId: string, safeZone: string): Promise<void> {
    unwrap(
      await this.client.rpc('create_escrow_for_listing', {
        p_listing_id: listingId,
        p_safe_zone: safeZone,
      })
    );
  }

  /** Resolves to true when the code was right and the order is released. */
  async confirmHandover(orderId: string, otp: string): Promise<boolean> {
    const order = unwrap<any>(
      await this.client.rpc('confirm_escrow_handover', { p_order_id: orderId, p_otp: otp })
    );
    return order?.status === 'released';
  }
}
