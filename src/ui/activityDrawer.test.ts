import { describe, it, expect } from 'vitest';
import { activityCounts, buildActivityView, renderActivityBody } from './activityDrawer';
import type { BuyerRequest, EscrowOrder, Listing } from '../types';

const profile = (id: string, name: string) => ({
  id,
  name,
  avatar: 'XX',
  rating: 5,
  reviewsCount: 0,
  verified: false,
});

const listing = (id: string, sellerId: string, bids: [string, number][] = []): Listing => ({
  id,
  title: `Listing ${id}`,
  category: 'electronics',
  format: 'auction',
  status: 'active',
  amountMinor: 1000,
  currency: 'NGN',
  bidsCount: bids.length,
  city: 'Lagos, Nigeria',
  country: 'Nigeria',
  fulfillment: 'both',
  imageUrl: 'https://example.com/a.jpg',
  description: '',
  seller: profile(sellerId, 'Seller'),
  bidHistory: bids.map(([bidderId, amountMinor], i) => ({
    id: `${id}-b${i}`,
    listingId: id,
    bidderId,
    bidderName: bidderId,
    amountMinor,
    currency: 'NGN',
    createdAt: i,
  })),
  createdAt: 0,
});

const request = (id: string, buyerId: string, quoteBy?: string): BuyerRequest => ({
  id,
  title: `<b>Request ${id}</b>`,
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
  buyer: profile(buyerId, 'Buyer'),
  offers: quoteBy
    ? [
        {
          id: `${id}-q`,
          requestId: id,
          providerId: quoteBy,
          providerName: 'P',
          providerAvatar: 'P',
          providerRating: 5,
          amountMinor: 4500,
          currency: 'NGN',
          timeline: '2 days',
          message: '',
          status: 'pending',
          createdAt: 0,
        },
      ]
    : [],
  status: 'open',
  createdAt: 0,
});

const order = (id: string, buyerId: string, sellerId: string, otpCode: string): EscrowOrder => ({
  id,
  buyerId,
  sellerId,
  orderCode: `ESC-${id}`,
  title: 'Phone',
  buyerName: 'Buyer',
  sellerName: 'Seller',
  amountMinor: 31000000,
  currency: 'NGN',
  targetCurrency: 'NGN',
  safeZone: 'Ikeja City Mall',
  status: 'funded',
  otpCode,
  fundedAt: 0,
});

describe('member activity', () => {
  const data = {
    userId: 'me',
    listings: [
      listing('l1', 'me'),
      listing('l2', 'other', [
        ['me', 1200],
        ['rival', 1500],
      ]),
      listing('l3', 'other', [['me', 2000]]),
    ],
    requests: [request('r1', 'me'), request('r2', 'other', 'me'), request('r3', 'other', 'rival')],
    escrowOrders: [
      order('o1', 'me', 'other', '123456'),
      order('o2', 'other', 'me', ''),
      order('o3', 'a', 'b', ''),
    ],
    watchlistIds: new Set(['l3']),
    messages: [],
  };
  const view = buildActivityView(data);

  it('collects only what belongs to the member', () => {
    expect(activityCounts(view)).toEqual({
      watchlist: 1,
      my_listings: 1,
      my_bids: 2,
      my_requests: 1,
      my_quotes: 1,
      orders: 2,
      messages: 0,
    });
  });

  it('marks bids as leading or outbid', () => {
    expect(view.myBids.map((b) => [b.listing.id, b.leading])).toEqual([
      ['l2', false],
      ['l3', true],
    ]);
  });

  it('shows the buyer the code and the seller an entry field', () => {
    const html = renderActivityBody('orders', view, 'me');
    expect(html).toContain('123456');
    expect(html).toContain('data-order-id="o2"');
    expect(html).not.toContain('data-order-id="o1"');
  });

  it('escapes member-supplied text', () => {
    const html = renderActivityBody('my_requests', view, 'me');
    expect(html).toContain('&lt;b&gt;Request r1&lt;/b&gt;');
    expect(html).not.toContain('<b>Request');
  });
});
