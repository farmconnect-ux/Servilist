import { describe, it, expect } from 'vitest';
import { countryFromCity, initials, mapEscrowOrder, mapListing, mapRequest } from './cloudStore';

describe('cloudStore row mapping', () => {
  it('derives initials and country', () => {
    expect(initials('Amara Obi')).toBe('AO');
    expect(initials('')).toBe('SM');
    expect(countryFromCity('Lagos, Nigeria')).toBe('Nigeria');
    expect(countryFromCity('All Africa')).toBe('Africa');
  });

  it('maps a listing row with its seller and newest bid first', () => {
    const listing = mapListing({
      id: 'l1',
      title: 'Canon EOS 80D kit',
      description: 'Clean',
      category: 'electronics',
      format: 'auction',
      status: 'active',
      currency: 'NGN',
      amount_minor: '38500000',
      buy_it_now_amount_minor: null,
      reserve_amount_minor: 40000000,
      bids_count: 2,
      auction_end_at: '2026-10-06T12:00:00Z',
      city: 'Lagos, Nigeria',
      country: 'Nigeria',
      fulfillment: 'both',
      image_url: 'https://example.com/a.jpg',
      created_at: '2026-10-04T12:00:00Z',
      seller: { id: 'u1', display_name: 'Kofi Mensah', rating: '4.90', is_verified: true },
      bids: [
        {
          id: 'b1',
          amount_minor: 37000000,
          currency: 'NGN',
          created_at: '2026-10-04T13:00:00Z',
          bidder: { display_name: 'Amina' },
        },
        {
          id: 'b2',
          amount_minor: 38500000,
          currency: 'NGN',
          created_at: '2026-10-04T14:00:00Z',
          bidder: [{ display_name: 'Kwame' }],
        },
      ],
    });

    expect(listing.amountMinor).toBe(38500000);
    expect(listing.endTime).toBe(Date.parse('2026-10-06T12:00:00Z'));
    expect(listing.seller).toMatchObject({ name: 'Kofi Mensah', avatar: 'KM', rating: 4.9 });
    expect(listing.bidHistory.map((b) => b.bidderName)).toEqual(['Kwame', 'Amina']);
    expect(listing.isSold).toBe(false);
  });

  it('maps a request row with its quotes', () => {
    const request = mapRequest({
      id: 'r1',
      title: '3 kVA solar inverter',
      description: 'Needed this week',
      category: 'solar',
      request_type: 'good',
      currency: 'TZS',
      budget_amount_minor: 90000000,
      urgency: 'This Week',
      rate_type: null,
      city: 'Dar es Salaam, Tanzania',
      country: 'Tanzania',
      fulfillment: 'both',
      status: 'open',
      created_at: '2026-10-04T12:00:00Z',
      buyer: { id: 'u2', display_name: 'Amara Obi' },
      quotes: [
        {
          id: 'q1',
          request_id: 'r1',
          provider_id: 'u3',
          currency: 'TZS',
          amount_minor: 85000000,
          timeline: '2 days',
          message: 'In stock',
          status: 'pending',
          created_at: '2026-10-04T15:00:00Z',
          provider: { display_name: 'SunPower Africa', rating: 4.5 },
        },
      ],
    });

    expect(request.rateType).toBe('flat');
    expect(request.buyer.name).toBe('Amara Obi');
    expect(request.offers[0]).toMatchObject({
      providerName: 'SunPower Africa',
      providerAvatar: 'SA',
      amountMinor: 85000000,
    });
  });

  it('exposes the handover code only when the database returned it', () => {
    const base = {
      id: 'o1',
      buyer_id: 'u2',
      seller_id: 'u1',
      order_code: 'ESC-ABC',
      title: 'Samsung Galaxy S22',
      amount_minor: 31000000,
      currency: 'NGN',
      safe_zone: 'Ikeja City Mall',
      status: 'funded',
      funded_at: '2026-10-04T12:00:00Z',
      released_at: null,
    };

    expect(mapEscrowOrder({ ...base, otp: { otp_code: '123456' } }).otpCode).toBe('123456');
    // What the seller receives: row-level security withholds the code
    expect(mapEscrowOrder({ ...base, otp: null }).otpCode).toBe('');
    expect(mapEscrowOrder({ ...base, otp: [] }).otpCode).toBe('');
  });
});
