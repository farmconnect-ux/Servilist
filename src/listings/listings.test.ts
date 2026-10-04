import { describe, it, expect } from 'vitest';
import { filterListings, sortListings } from './index';
import { Listing } from '../types';

const mockListings: Listing[] = [
  {
    id: '1',
    title: 'MacBook Pro 14 M1',
    category: 'electronics',
    format: 'buy_now',
    status: 'active',
    amountMinor: 120000, // $1,200 USD
    currency: 'USD',
    bidsCount: 0,
    city: 'Lagos',
    country: 'Nigeria',
    fulfillment: 'pickup',
    imageUrl: 'https://example.com/mac.jpg',
    description: 'Mint space gray',
    seller: { id: 's1', name: 'John', avatar: 'J', rating: 5, reviewsCount: 1, verified: true },
    bidHistory: [],
    createdAt: 1000,
  },
  {
    id: '2',
    title: 'Solar Panels 400W Mono',
    category: 'solar',
    format: 'auction',
    status: 'active',
    amountMinor: 35000, // $350 USD
    currency: 'USD',
    bidsCount: 12,
    endTime: 20000,
    city: 'Nairobi',
    country: 'Kenya',
    fulfillment: 'both',
    imageUrl: 'https://example.com/solar.jpg',
    description: 'High efficiency',
    seller: { id: 's2', name: 'Amina', avatar: 'A', rating: 4.9, reviewsCount: 8, verified: true },
    bidHistory: [],
    createdAt: 2000,
  },
  {
    id: '3',
    title: 'Toyota Hilux 2020',
    category: 'vehicles',
    format: 'auction',
    status: 'active',
    amountMinor: 1800000, // $18,000 USD
    currency: 'USD',
    bidsCount: 5,
    endTime: 15000,
    city: 'Accra',
    country: 'Ghana',
    fulfillment: 'pickup',
    imageUrl: 'https://example.com/hilux.jpg',
    description: 'Clean truck',
    seller: { id: 's3', name: 'Kofi', avatar: 'K', rating: 4.8, reviewsCount: 15, verified: true },
    bidHistory: [],
    createdAt: 3000,
  },
];

describe('Listings Module', () => {
  describe('filterListings', () => {
    it('filters listings by city', () => {
      const results = filterListings(mockListings, { city: 'Nairobi' });
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Solar Panels 400W Mono');
    });

    it('filters listings by category', () => {
      const results = filterListings(mockListings, { category: 'electronics' });
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('MacBook Pro 14 M1');
    });

    it('filters listings by format pill', () => {
      const results = filterListings(mockListings, { formatPill: 'auction' });
      expect(results.length).toBe(2);
      expect(results.every((r) => r.format === 'auction')).toBe(true);
    });

    it('filters listings by search query across title or description', () => {
      const results = filterListings(mockListings, { searchQuery: 'truck' });
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Toyota Hilux 2020');
    });

    it('filters listings by price range', () => {
      const results = filterListings(mockListings, {
        minPriceMinor: 30000,
        maxPriceMinor: 100000,
      });
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Solar Panels 400W Mono');
    });
  });

  describe('sortListings', () => {
    it('sorts by ending_soonest for auctions', () => {
      const sorted = sortListings(mockListings, 'ending_soon');
      // Auction with endTime 15000 should come before endTime 20000
      expect(sorted[0].title).toBe('Toyota Hilux 2020');
      expect(sorted[1].title).toBe('Solar Panels 400W Mono');
    });

    it('sorts by newest based on createdAt', () => {
      const sorted = sortListings(mockListings, 'newest');
      expect(sorted[0].title).toBe('Toyota Hilux 2020'); // createdAt 3000
      expect(sorted[1].title).toBe('Solar Panels 400W Mono'); // createdAt 2000
      expect(sorted[2].title).toBe('MacBook Pro 14 M1'); // createdAt 1000
    });

    it('sorts by price_low', () => {
      const sorted = sortListings(mockListings, 'price_low');
      expect(sorted[0].title).toBe('Solar Panels 400W Mono'); // $350
      expect(sorted[1].title).toBe('MacBook Pro 14 M1'); // $1,200
      expect(sorted[2].title).toBe('Toyota Hilux 2020'); // $18,000
    });

    it('sorts by price_high', () => {
      const sorted = sortListings(mockListings, 'price_high');
      expect(sorted[0].title).toBe('Toyota Hilux 2020');
      expect(sorted[1].title).toBe('MacBook Pro 14 M1');
      expect(sorted[2].title).toBe('Solar Panels 400W Mono');
    });

    it('sorts by most_bids', () => {
      const sorted = sortListings(mockListings, 'most_bids');
      expect(sorted[0].title).toBe('Solar Panels 400W Mono'); // 12 bids
      expect(sorted[1].title).toBe('Toyota Hilux 2020'); // 5 bids
      expect(sorted[2].title).toBe('MacBook Pro 14 M1'); // 0 bids
    });
  });
});
