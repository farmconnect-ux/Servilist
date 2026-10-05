import { describe, it, expect } from 'vitest';
import {
  toMinorUnits,
  fromMinorUnits,
  convertMinor,
  formatMoney,
  DEFAULT_EXCHANGE_RATES,
} from './index';

describe('Money & Currency Module', () => {
  describe('toMinorUnits & fromMinorUnits', () => {
    it('correctly converts major to minor units for NGN (100 kobo per Naira)', () => {
      expect(toMinorUnits(150000, 'NGN')).toBe(15000000);
      expect(fromMinorUnits(15000000, 'NGN')).toBe(150000);
    });

    it('correctly converts major to minor units for USD ($100 = 10000 cents)', () => {
      expect(toMinorUnits(100.5, 'USD')).toBe(10050);
      expect(fromMinorUnits(10050, 'USD')).toBe(100.5);
    });

    it('handles rounding safely for fractional cents', () => {
      expect(toMinorUnits(10.256, 'USD')).toBe(1026);
    });
  });

  describe('convertMinor', () => {
    it('returns the same amount when converting between the same currency', () => {
      expect(convertMinor(50000, 'NGN', 'NGN')).toBe(50000);
    });

    it('correctly converts from USD to NGN using baseline rates ($100 USD -> ₦150,000 NGN)', () => {
      // 100 USD = 10000 minor cents
      const usdMinor = 10000;
      // Rate: 1 USD = 1500 NGN. 100 USD = 150,000 NGN = 15,000,000 kobo
      const converted = convertMinor(usdMinor, 'USD', 'NGN', DEFAULT_EXCHANGE_RATES);
      expect(converted).toBe(15000000);
    });

    it('correctly converts from NGN to KES across African currencies', () => {
      // 1,500 NGN (= 1 USD) = 150,000 minor kobo
      // In KES, 1 USD = 130 KES = 13,000 minor cents
      const ngnMinor = 150000;
      const converted = convertMinor(ngnMinor, 'NGN', 'KES', DEFAULT_EXCHANGE_RATES);
      expect(converted).toBe(13000);
    });
  });

  describe('formatMoney', () => {
    it('formats NGN without decimals as integer Naira', () => {
      // 50,000 NGN = 5,000,000 minor
      const formatted = formatMoney(5000000, 'NGN');
      expect(formatted).toBe('₦50,000');
    });

    it('formats USD with 2 decimal places', () => {
      // $125.50 = 12550 minor
      const formatted = formatMoney(12550, 'USD');
      expect(formatted).toBe('$125.50');
    });

    it('appends secondary converted currency when requested', () => {
      // $100 USD -> ~₦150,000
      const formatted = formatMoney(10000, 'USD', {
        showSecondary: true,
        targetCurrency: 'NGN',
        rates: DEFAULT_EXCHANGE_RATES,
      });
      expect(formatted).toContain('$100.00');
      expect(formatted).toContain('~₦150,000');
    });
  });
});
