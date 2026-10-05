# Servilist REST API Reference

**Specification Version**: 1.0.0  
**Base URL**: `/api/v1`  
**Standard Response Format**:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

**Standard Error Format**:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {}
  }
}
```

---

## 1. Authentication & Profile

- `GET /api/v1/me`: Returns currently authenticated member session, profile details, and RBAC roles.
- `GET /api/v1/users/[username]`: Returns public profile of a buyer/merchant, including average rating and verified badges.

---

## 2. Categories & Taxonomy

- `GET /api/v1/categories`: Lists hierarchical marketplace categories with subcategory trees.
- `GET /api/v1/categories/[slug]`: Returns specific category metadata and parent/children relations.

---

## 3. Product Listings

- `GET /api/v1/listings`: Search and filter published listings by category, city, price range, condition, and sort order.
- `POST /api/v1/listings`: Create new product listing (draft or published).
- `GET /api/v1/listings/[id]`: Detailed listing payload with seller card and gallery images.
- `POST /api/v1/listings/[id]/publish`: Transition draft listing to active.
- `POST /api/v1/listings/[id]/pause`: Pause active listing.

---

## 4. Reverse Marketplace Buyer Requests & Quotes

- `GET /api/v1/requests`: List open buyer requests with category and location filters.
- `POST /api/v1/requests`: Buyer publishes a new product, service, or bulk purchase requirement.
- `GET /api/v1/requests/[id]`: Returns buyer request details, deadline, and received quotes.
- `GET /api/v1/requests/[id]/matches`: Returns automated supply listings matching the buyer's requirement.
- `POST /api/v1/requests/[id]/quotes`: Seller/merchant submits a competitive quotation for a request.
- `POST /api/v1/requests/[id]/quotes/[quoteId]/accept`: Buyer accepts quotation, creating an order.

---

## 5. Direct Offers & Negotiations

- `GET /api/v1/offers`: List offers for current user (sent or received).
- `POST /api/v1/offers`: Submit direct offer against an active listing.
- `POST /api/v1/offers/[id]/respond`: Accept, reject, or counter an offer. Counter-offers generate linked immutable records.

---

## 6. Escrow Orders & Payments

- `GET /api/v1/orders`: List orders for buyer or seller.
- `POST /api/v1/orders`: Initialize a new escrow order with calculated platform fees.
- `GET /api/v1/orders/[id]`: Detailed order record with items, payment breakdown, and shipping address.
- `POST /api/v1/orders/[id]/pay`: Initialize payment with Paystack or Flutterwave.
- `POST /api/v1/orders/[id]/release-otp`: Merchant submits buyer's 6-digit secret OTP to release escrow payout upon successful delivery.
- `POST /api/v1/orders/[id]/dispute`: Open formal dispute against an unfulfilled or defective order.
- `POST /api/v1/webhooks/payments/[provider]`: Idempotent payment provider webhook receiver.

---

## 7. Timed Auctions & Live Bidding

- `GET /api/v1/auctions`: List live and upcoming timed auctions.
- `POST /api/v1/auctions`: Create an auction listing with starting price, reserve, and minimum increment.
- `GET /api/v1/auctions/[id]`: Auction details with live timer countdown, current high bid, and reserve status.
- `POST /api/v1/auctions/[id]/bids`: Place a bid with atomic concurrency locking (`FOR UPDATE`) and anti-sniping protection.
- `POST /api/v1/auctions/[id]/settle`: Settle ended auction; determines winner and generates order.

---

## 8. Services Marketplace & Direct Bookings

- `GET /api/v1/services`: List verified service providers and package offerings.
- `POST /api/v1/services`: Publish a professional service offering with tiered packages (Basic, Standard, Premium).
- `GET /api/v1/services/[slug]`: Detailed service profile and pricing packages.
- `POST /api/v1/services/[id]/book`: Book a service package for a scheduled date and location.
- `GET /api/v1/bookings`: List service bookings for client or provider.

---

## 9. Delivery & Shipping Fulfillment

- `GET /api/v1/orders/[id]/delivery`: Retrieve live courier tracking timeline and waybill info.
- `POST /api/v1/orders/[id]/delivery`: Merchant dispatches order with courier partner (GIG Logistics, Kwik, DHL, Seller Direct).
- `POST /api/v1/orders/[id]/delivery/track`: Update delivery checkpoint or attach proof-of-delivery URL.

---

## 10. Business Storefronts & KYC Verification

- `GET /api/v1/businesses`: Retrieve merchant's business profile.
- `POST /api/v1/businesses`: Register business profile with CAC registration and branding.
- `GET /api/v1/businesses/[slug]`: Public business storefront with catalog and verified badges.
- `PATCH /api/v1/businesses/[slug]`: Update operating hours, logo, banner, and return policy.
- `POST /api/v1/verifications`: Submit identity or business documents for KYC approval.
- `POST /api/v1/verifications/[id]/review`: Admin approves or rejects KYC documents.

---

## 11. Messaging & Conversations

- `GET /api/v1/conversations`: List active chat conversations.
- `GET /api/v1/conversations/[otherUserId]/messages`: Chat history with counterparty.
- `POST /api/v1/conversations`: Send direct message linked to listing, request, or order.

---

## 12. Reviews, Moderation & Reports

- `POST /api/v1/reviews`: Submit verified review for a completed escrow transaction.
- `POST /api/v1/reports`: Flag suspicious listing, user, message, or request for moderation.
- `GET /api/v1/reports`: Admin moderation queue.
- `POST /api/v1/reports/[id]/resolve`: Admin action on flagged item (dismiss, warn, ban, remove).
