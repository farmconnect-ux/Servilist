import { Listing, BuyerRequest, EscrowOrder, UserProfile } from '../types';

export interface AuthUserContext {
  id: string;
  email?: string;
  phone?: string;
  role?: string;
}

/**
 * Client and database RLS policy authorization evaluator.
 * Mirrors PostgreSQL Row Level Security (RLS) rules defined in migration 00009.
 */
export class PolicyEvaluator {
  /**
   * Listings SELECT policy:
   * Public can read active listings. Inactive listings readable only by owner.
   */
  public static canReadListing(
    user: AuthUserContext | null,
    listing: Listing
  ): boolean {
    if (listing.status === 'active') return true;
    if (!user) return false;
    return user.id === listing.seller.id;
  }

  /**
   * Listings UPDATE policy:
   * Only the creator/seller can update their own listing.
   */
  public static canUpdateListing(
    user: AuthUserContext | null,
    listing: Listing
  ): boolean {
    if (!user) return false;
    return user.id === listing.seller.id;
  }

  /**
   * Listings DELETE policy:
   * Only the creator/seller can delete their own listing.
   */
  public static canDeleteListing(
    user: AuthUserContext | null,
    listing: Listing
  ): boolean {
    if (!user) return false;
    return user.id === listing.seller.id;
  }

  /**
   * Buyer Requests SELECT policy:
   * Publicly visible to all potential vendors.
   */
  public static canReadRequest(
    _user: AuthUserContext | null,
    _request: BuyerRequest
  ): boolean {
    return true;
  }

  /**
   * Buyer Requests UPDATE policy:
   * Only the buyer who created the request can edit it.
   */
  public static canUpdateRequest(
    user: AuthUserContext | null,
    request: BuyerRequest
  ): boolean {
    if (!user) return false;
    return user.id === request.buyer.id;
  }

  /**
   * Buyer Requests DELETE policy:
   * Only the buyer who created the request can delete/cancel it.
   */
  public static canDeleteRequest(
    user: AuthUserContext | null,
    request: BuyerRequest
  ): boolean {
    if (!user) return false;
    return user.id === request.buyer.id;
  }

  /**
   * Quotes SELECT policy:
   * Only the vendor who submitted the quote OR the buyer who posted the request can view it.
   */
  public static canReadQuote(
    user: AuthUserContext | null,
    quoteVendorId: string,
    requestBuyerId: string
  ): boolean {
    if (!user) return false;
    return user.id === quoteVendorId || user.id === requestBuyerId;
  }

  /**
   * Escrow Orders SELECT policy:
   * Strict privacy: Only the buyer or the seller involved can read the order.
   * A third-party account must NEVER see other people's escrow or OTP details.
   */
  public static canReadEscrowOrder(
    user: AuthUserContext | null,
    order: EscrowOrder,
    sellerUserId?: string
  ): boolean {
    if (!user) return false;
    const isBuyer = order.buyerId ? user.id === order.buyerId : false;
    const isSeller =
      (order.sellerId ? user.id === order.sellerId : false) ||
      (sellerUserId ? user.id === sellerUserId : false);
    return isBuyer || isSeller;
  }

  /**
   * Escrow Orders UPDATE policy:
   * Only buyer or seller can trigger status transitions (e.g. entering OTP or dispatching).
   */
  public static canUpdateEscrowOrder(
    user: AuthUserContext | null,
    order: EscrowOrder,
    sellerUserId?: string
  ): boolean {
    if (!user) return false;
    const isBuyer = order.buyerId ? user.id === order.buyerId : false;
    const isSeller =
      (order.sellerId ? user.id === order.sellerId : false) ||
      (sellerUserId ? user.id === sellerUserId : false);
    return isBuyer || isSeller;
  }
}
