import { describe, it, expect } from 'vitest';
import { calculateMinimumNextBid, isReserveMet, validateBid } from './index';
import { Listing } from '../types';

describe('Auctions Module', () => {
  describe('calculateMinimumNextBid', () => {
    it('returns starting bid when there are no prior bids', () => {
      // 100,000 NGN starting bid = 10,000,000 minor kobo
      const result = calculateMinimumNextBid(10000000, 'NGN', false);
      expect(result.minimumNextBidMinor).toBe(10000000);
      expect(result.minimumNextBidMajor).toBe(100000);
    });

    it('adds 5% minimum increment when bids already exist', () => {
      // Current bid: 10,000,000 minor. 5% increment is 500,000 minor. Min next: 10,500,000 minor
      const result = calculateMinimumNextBid(10000000, 'NGN', true);
      expect(result.minimumNextBidMinor).toBe(10500000);
      expect(result.minimumNextBidMajor).toBe(105000);
    });

    it('enforces minimum step of 100 minor units for small values', () => {
      const result = calculateMinimumNextBid(100, 'USD', true);
      expect(result.minimumNextBidMinor).toBe(200);
    });
  });

  describe('isReserveMet', () => {
    it('returns true when no reserve price is configured (null, undefined, or 0)', () => {
      expect(isReserveMet(null, 500000)).toBe(true);
      expect(isReserveMet(undefined, 500000)).toBe(true);
      expect(isReserveMet(0, 500000)).toBe(true);
    });

    it('returns false when current bid is below reserve price', () => {
      expect(isReserveMet(15000000, 14000000)).toBe(false);
    });

    it('returns true when current bid equals or exceeds reserve price', () => {
      expect(isReserveMet(15000000, 15000000)).toBe(true);
      expect(isReserveMet(15000000, 16000000)).toBe(true);
    });
  });

  describe('validateBid', () => {
    const mockListing: Listing = {
      id: 'list-1',
      title: 'Solar Inverter 5kVA',
      category: 'solar',
      format: 'auction',
      status: 'active',
      amountMinor: 50000000, // 500,000 NGN
      currency: 'NGN',
      bidsCount: 1,
      endTime: Date.now() + 1000 * 3600, // 1 hour from now
      city: 'Lagos',
      country: 'Nigeria',
      fulfillment: 'both',
      imageUrl: 'https://example.com/img.jpg',
      description: 'Used inverter',
      seller: {
        id: 's-1',
        name: 'Seller',
        avatar: 'S',
        rating: 5,
        reviewsCount: 10,
        verified: true,
      },
      bidHistory: [],
      createdAt: Date.now() - 3600,
    };

    it('approves bid higher than minimum next bid', () => {
      // Current: 50,000,000 minor. Min next: 52,500,000 minor
      const res = validateBid(mockListing, 53000000);
      expect(res.valid).toBe(true);
    });

    it('rejects bid lower than minimum next bid', () => {
      const res = validateBid(mockListing, 51000000);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('minimum next bid');
    });

    it('rejects bid when auction has ended', () => {
      const pastTime = Date.now() + 1000 * 7200; // future time compared to ended listing
      const res = validateBid(mockListing, 60000000, pastTime);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('auction has already ended');
    });

    it('rejects bid when item is sold', () => {
      const soldListing = { ...mockListing, isSold: true, status: 'sold' as const };
      const res = validateBid(soldListing, 60000000);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('already been sold');
    });
  });
});
