import {
  BuyerRequest,
  Quote,
  UserProfile,
  CurrencyCode,
  ListingCategory,
  RequestType,
  RequestUrgency,
  RequestRateType,
  FulfillmentType,
} from '../types';

export interface CreateRequestInput {
  title: string;
  category: ListingCategory;
  requestType: RequestType;
  budgetAmountMinor: number;
  currency: CurrencyCode;
  urgency?: RequestUrgency;
  conditionRequired?: string;
  rateType?: RequestRateType;
  city: string;
  country: string;
  neighborhood?: string;
  fulfillment?: FulfillmentType;
  imageUrl?: string;
  description: string;
  buyer: UserProfile;
}

export function createBuyerRequest(input: CreateRequestInput): BuyerRequest {
  return {
    id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: input.title,
    category: input.category,
    requestType: input.requestType,
    budgetAmountMinor: input.budgetAmountMinor,
    currency: input.currency,
    urgency: input.urgency || 'Within 2-3 Days',
    conditionRequired: input.conditionRequired,
    rateType: input.rateType || 'flat',
    city: input.city,
    country: input.country,
    neighborhood: input.neighborhood,
    fulfillment: input.fulfillment || 'both',
    imageUrl: input.imageUrl,
    description: input.description,
    buyer: input.buyer,
    offers: [],
    status: 'open',
    createdAt: Date.now(),
  };
}

export interface CreateQuoteInput {
  requestId: string;
  providerName: string;
  providerAvatar?: string;
  providerRating?: number;
  amountMinor: number;
  currency: CurrencyCode;
  timeline: string;
  message: string;
}

export function createQuote(input: CreateQuoteInput): Quote {
  return {
    id: `off-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    requestId: input.requestId,
    providerName: input.providerName,
    providerAvatar: input.providerAvatar || 'JD',
    providerRating: input.providerRating ?? 5.0,
    amountMinor: input.amountMinor,
    currency: input.currency,
    timeline: input.timeline,
    message: input.message,
    status: 'pending',
    createdAt: Date.now(),
  };
}
