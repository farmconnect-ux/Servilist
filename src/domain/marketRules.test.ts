import { describe, it, expect } from 'vitest';
import { listingActions, listingState, requestActions, topBid } from './marketRules';
import type { BuyerRequest, Listing } from '../types';

const NOW = 1_000_000;

const profile = (id: string) => ({
  id,
  name: id,
  avatar: 'X',
  rating: 5,
  reviewsCount: 0,
  verified: false,
});

function listing(overrides: Partial<Listing> = {}, bids: [string, number][] = []): Listing {
  return {
    id: 'l1',
    title: 'Item',
    category: 'electronics',
    format: 'auction',
    status: 'active',
    amountMinor: 1000,
    currency: 'NGN',
    bidsCount: bids.length,
    endTime: NOW + 60_000,
    city: 'Lagos, Nigeria',
    country: 'Nigeria',
    fulfillment: 'both',
    imageUrl: '',
    description: '',
    seller: profile('seller'),
    bidHistory: bids.map(([bidderId, amountMinor], i) => ({
      id: `b${i}`,
      listingId: 'l1',
      bidderId,
      bidderName: bidderId,
      amountMinor,
      currency: 'NGN',
      createdAt: i,
    })),
    createdAt: 0,
    ...overrides,
  };
}

function request(overrides: Partial<BuyerRequest> = {}, quotedBy: string[] = []): BuyerRequest {
  return {
    id: 'r1',
    title: 'Need',
    category: 'solar',
    requestType: 'good',
    budgetAmountMinor: 5000,
    currency: 'NGN',
    urgency: 'This Week',
    rateType: 'flat',
    city: 'Lagos, Nigeria',
    country: 'Nigeria',
    fulfillment: 'both',
    description: '',
    buyer: profile('buyer'),
    offers: quotedBy.map((providerId, i) => ({
      id: `q${i}`,
      requestId: 'r1',
      providerId,
      providerName: providerId,
      providerAvatar: 'P',
      providerRating: 5,
      amountMinor: 4000,
      currency: 'NGN',
      timeline: '',
      message: '',
      status: 'pending',
      createdAt: i,
    })),
    status: 'open',
    createdAt: 0,
    ...overrides,
  };
}

describe('listing rules', () => {
  it('derives state from status and the auction clock', () => {
    expect(listingState(listing(), NOW)).toBe('active');
    expect(listingState(listing({ endTime: NOW - 1 }), NOW)).toBe('ended');
    expect(listingState(listing({ status: 'sold' }), NOW)).toBe('sold');
    expect(listingState(listing({ status: 'cancelled' }), NOW)).toBe('cancelled');
    expect(listingState(listing({ format: 'buy_now', endTime: null }), NOW)).toBe('active');
  });

  it('picks the highest bid, earliest first on a tie', () => {
    const l = listing({}, [
      ['a', 1200],
      ['b', 1500],
      ['c', 1500],
    ]);
    expect(topBid(l)?.bidderId).toBe('b');
    expect(topBid(listing())).toBeNull();
  });

  it('lets other members bid on a running auction, never the seller or a guest-less owner', () => {
    expect(listingActions(listing(), 'buyer', NOW).canBid).toBe(true);
    expect(listingActions(listing(), 'seller', NOW).canBid).toBe(false);
    expect(listingActions(listing({ endTime: NOW - 1 }), 'buyer', NOW).canBid).toBe(false);
    // Guests see the bid form; signing in is asked for when they submit
    expect(listingActions(listing(), null, NOW).canBid).toBe(true);
  });

  it('offers buy only on priced fixed listings that are not your own', () => {
    const fixed = listing({ format: 'buy_now', endTime: null });
    expect(listingActions(fixed, 'buyer', NOW).canBuy).toBe(true);
    expect(listingActions(fixed, 'seller', NOW).canBuy).toBe(false);
    expect(listingActions(listing({ format: 'free_barter', amountMinor: 0 }), 'buyer').canBuy).toBe(
      false
    );
    expect(listingActions(listing(), 'buyer', NOW).canBuy).toBe(false);
  });

  it('lets a seller withdraw only before any bid', () => {
    expect(listingActions(listing(), 'seller', NOW).canWithdraw).toBe(true);
    expect(listingActions(listing({}, [['a', 1200]]), 'seller', NOW).canWithdraw).toBe(false);
    expect(listingActions(listing(), 'buyer', NOW).canWithdraw).toBe(false);
  });

  it('lets only the seller or the winner settle an ended auction', () => {
    const ended = listing({ endTime: NOW - 1, reserveAmountMinor: 1400 }, [
      ['a', 1200],
      ['b', 1500],
    ]);
    expect(listingActions(ended, 'b', NOW)).toMatchObject({
      canSettle: true,
      isTopBidder: true,
      settlement: 'sale',
    });
    expect(listingActions(ended, 'seller', NOW).canSettle).toBe(true);
    expect(listingActions(ended, 'a', NOW).canSettle).toBe(false);
    expect(listingActions(listing(), 'seller', NOW).canSettle).toBe(false);
  });

  it('reports no sale when the reserve was not met or nobody bid', () => {
    const belowReserve = listing({ endTime: NOW - 1, reserveAmountMinor: 2000 }, [['a', 1200]]);
    expect(listingActions(belowReserve, 'seller', NOW).settlement).toBe('no_sale');
    expect(listingActions(listing({ endTime: NOW - 1 }), 'seller', NOW).settlement).toBe('no_sale');
  });
});

describe('request rules', () => {
  it('lets other members quote once on an open request', () => {
    expect(requestActions(request(), 'vendor').canQuote).toBe(true);
    expect(requestActions(request(), 'buyer').canQuote).toBe(false);
    expect(requestActions(request({}, ['vendor']), 'vendor')).toMatchObject({
      canQuote: false,
      hasQuoted: true,
    });
    expect(requestActions(request({ status: 'matched' }), 'vendor').canQuote).toBe(false);
  });

  it('lets only the buyer accept quotes or cancel', () => {
    expect(requestActions(request(), 'buyer')).toMatchObject({
      canAcceptQuotes: true,
      canCancel: true,
      canMessage: false,
    });
    expect(requestActions(request(), 'vendor')).toMatchObject({
      canAcceptQuotes: false,
      canCancel: false,
      canMessage: true,
    });
  });
});
