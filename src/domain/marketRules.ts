import { isReserveMet } from '../auctions';
import type { BuyerRequest, Listing } from '../types';

/**
 * Marketplace rules as pure functions: given an item and who is looking at it,
 * what state is it in and what may that person do? The screens render from
 * these answers and the database functions enforce the same rules, so the two
 * cannot drift apart silently.
 */

export type ListingState = 'active' | 'ended' | 'sold' | 'cancelled';

export interface ListingActions {
  state: ListingState;
  isOwner: boolean;
  /** The viewer holds the highest bid. */
  isTopBidder: boolean;
  canBid: boolean;
  canBuy: boolean;
  canMessage: boolean;
  canWithdraw: boolean;
  /** An auction past its end that the seller or winner still has to close. */
  canSettle: boolean;
  /** What closing the auction would do. */
  settlement: 'sale' | 'no_sale' | null;
}

export function listingState(listing: Listing, now: number = Date.now()): ListingState {
  if (listing.status === 'sold' || listing.isSold) return 'sold';
  if (listing.status === 'cancelled') return 'cancelled';
  if (listing.status === 'ended') return 'ended';
  if (listing.format === 'auction' && listing.endTime && listing.endTime <= now) return 'ended';
  return 'active';
}

export function topBid(listing: Listing) {
  const bids = listing.bidHistory || [];
  if (!bids.length) return null;
  return bids.reduce((best, bid) =>
    bid.amountMinor > best.amountMinor ||
    (bid.amountMinor === best.amountMinor && bid.createdAt < best.createdAt)
      ? bid
      : best
  );
}

export function listingActions(
  listing: Listing,
  userId: string | null,
  now: number = Date.now()
): ListingActions {
  const state = listingState(listing, now);
  const isOwner = !!userId && listing.seller.id === userId;
  const top = topBid(listing);
  const isTopBidder = !!userId && !!top && top.bidderId === userId;
  const isAuction = listing.format === 'auction';
  const open = state === 'active';

  // Closed by the clock but not yet settled in the database
  const awaitingSettlement = isAuction && state === 'ended' && listing.status === 'active';
  const reserveMet = !!top && isReserveMet(listing.reserveAmountMinor, top.amountMinor);

  return {
    state,
    isOwner,
    isTopBidder,
    canBid: open && isAuction && !isOwner,
    canBuy: open && !isAuction && !isOwner && listing.amountMinor > 0,
    canMessage: !isOwner && state !== 'cancelled',
    canWithdraw: open && isOwner && listing.bidsCount === 0,
    canSettle: awaitingSettlement && (isOwner || isTopBidder),
    settlement: awaitingSettlement ? (reserveMet ? 'sale' : 'no_sale') : null,
  };
}

export interface RequestActions {
  isOwner: boolean;
  isOpen: boolean;
  /** The viewer already has a pending quote on this request. */
  hasQuoted: boolean;
  canQuote: boolean;
  canAcceptQuotes: boolean;
  canCancel: boolean;
  canMessage: boolean;
}

export function requestActions(request: BuyerRequest, userId: string | null): RequestActions {
  const isOwner = !!userId && request.buyer.id === userId;
  const isOpen = request.status === 'open';
  const hasQuoted =
    !!userId &&
    (request.offers || []).some((o) => o.providerId === userId && o.status === 'pending');

  return {
    isOwner,
    isOpen,
    hasQuoted,
    canQuote: isOpen && !isOwner && !hasQuoted,
    canAcceptQuotes: isOpen && isOwner,
    canCancel: isOpen && isOwner,
    canMessage: !isOwner && request.status !== 'cancelled',
  };
}
