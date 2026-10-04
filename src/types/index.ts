// Core domain types for Servilist Pan-African Marketplace

export type CurrencyCode =
  'USD' | 'NGN' | 'KES' | 'GHS' | 'ZAR' | 'EGP' | 'RWF' | 'TZS' | 'UGX' | 'XOF';

export interface Money {
  amountMinor: bigint | number;
  currency: CurrencyCode;
}

export interface ExchangeRate {
  baseCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  rate: number; // e.g. 1 USD = 1500 NGN -> rate: 1500
  fetchedAt: number; // timestamp
}

export type ListingCategory =
  | 'electronics'
  | 'solar'
  | 'services'
  | 'collectibles'
  | 'vehicles'
  | 'housing'
  | 'home'
  | 'agriculture'
  | 'community';

export type ListingFormat = 'auction' | 'buy_now' | 'service' | 'free_barter';

export type ListingStatus = 'active' | 'sold' | 'ended' | 'cancelled';

export type FulfillmentType = 'pickup' | 'shipping' | 'both';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  city?: string;
  country?: string;
}

export interface Bid {
  id: string;
  listingId: string;
  bidderName: string;
  bidderAvatar?: string;
  amountMinor: number;
  currency: CurrencyCode;
  createdAt: number;
  timeFormatted?: string;
}

export interface Listing {
  id: string;
  title: string;
  category: ListingCategory;
  format: ListingFormat;
  status: ListingStatus;
  amountMinor: number; // starting bid for auctions, fixed price for buy_now, rate for service, 0 for barter
  currency: CurrencyCode;
  buyItNowAmountMinor?: number | null;
  reserveAmountMinor?: number | null;
  bidsCount: number;
  endTime?: number | null; // timestamp for auction close
  city: string;
  country: string;
  neighborhood?: string;
  fulfillment: FulfillmentType;
  imageUrl: string;
  description: string;
  seller: UserProfile;
  bidHistory: Bid[];
  isSold?: boolean;
  createdAt: number;
}

export type RequestType = 'good' | 'service';
export type RequestUrgency =
  'ASAP (Within 24 Hours)' | 'Within 2-3 Days' | 'This Week' | 'Flexible / Anytime';
export type RequestRateType = 'flat' | 'hourly';

export interface Quote {
  id: string;
  requestId: string;
  providerName: string;
  providerAvatar: string;
  providerRating: number;
  amountMinor: number;
  currency: CurrencyCode;
  timeline: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: number;
}

export interface BuyerRequest {
  id: string;
  title: string;
  category: ListingCategory;
  requestType: RequestType;
  budgetAmountMinor: number;
  currency: CurrencyCode;
  urgency: RequestUrgency;
  conditionRequired?: string;
  rateType: RequestRateType;
  city: string;
  country: string;
  neighborhood?: string;
  fulfillment: FulfillmentType;
  imageUrl?: string;
  description: string;
  buyer: UserProfile;
  offers: Quote[];
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  createdAt: number;
}

export type EscrowStatus =
  'funded' | 'inspection' | 'otp_verified' | 'released' | 'disputed' | 'refunded';

export interface EscrowOrder {
  id: string;
  listingId?: string;
  requestId?: string;
  quoteId?: string;
  orderCode: string;
  title: string;
  buyerName: string;
  sellerName: string;
  amountMinor: number;
  currency: CurrencyCode;
  targetCurrency: CurrencyCode;
  safeZone: string;
  status: EscrowStatus;
  otpCode: string;
  fundedAt: number;
  releasedAt?: number;
}

export interface CityLocation {
  city: string;
  country: string;
  countryCode: string;
  currency: CurrencyCode;
  neighborhoods: string[];
  label: string;
}
