import { Listing, CurrencyCode } from '../types';
import { fromMinorUnits } from '../money';

export interface MinimumNextBidResult {
  minimumNextBidMinor: number;
  minimumNextBidMajor: number;
  currency: CurrencyCode;
}

/**
 * Calculates the strictly minimum valid next bid.
 * Rules:
 * - If no bids yet: starting bid.
 * - If bids exist: strictly higher by minimum 5% increment + standard minor step.
 */
export function calculateMinimumNextBid(
  currentPriceMinor: number,
  currency: CurrencyCode,
  hasBids: boolean = true
): MinimumNextBidResult {
  if (!hasBids || currentPriceMinor <= 0) {
    const minMinor = Math.max(1, currentPriceMinor);
    return {
      minimumNextBidMinor: minMinor,
      minimumNextBidMajor: fromMinorUnits(minMinor, currency),
      currency,
    };
  }

  // 5% increment rounded up to the nearest integer minor unit
  const increment = Math.max(100, Math.ceil(currentPriceMinor * 0.05));
  const minMinor = currentPriceMinor + increment;

  return {
    minimumNextBidMinor: minMinor,
    minimumNextBidMajor: fromMinorUnits(minMinor, currency),
    currency,
  };
}

/**
 * Checks whether the reserve price has been met.
 * If no reserve price is specified, returns true.
 */
export function isReserveMet(
  reservePriceMinor: number | null | undefined,
  currentBidMinor: number
): boolean {
  if (reservePriceMinor === null || reservePriceMinor === undefined || reservePriceMinor <= 0) {
    return true;
  }
  return currentBidMinor >= reservePriceMinor;
}

export interface BidValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates whether a proposed bid can be accepted for an auction listing.
 */
export function validateBid(
  listing: Listing,
  bidAmountMinor: number,
  now: number = Date.now()
): BidValidationResult {
  if (listing.format !== 'auction') {
    return { valid: false, error: 'Listing is not an auction' };
  }

  if (listing.isSold || listing.status === 'sold') {
    return { valid: false, error: 'This item has already been sold' };
  }

  if (listing.endTime && listing.endTime <= now) {
    return { valid: false, error: 'This auction has already ended' };
  }

  const { minimumNextBidMinor } = calculateMinimumNextBid(
    listing.amountMinor,
    listing.currency,
    listing.bidsCount > 0
  );

  if (bidAmountMinor < minimumNextBidMinor) {
    return {
      valid: false,
      error: `Bid must be at least the minimum next bid`,
    };
  }

  return { valid: true };
}
