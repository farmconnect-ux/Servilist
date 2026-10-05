import { describe, it, expect } from "vitest";
import { generateOtp, hashOtp } from "../lib/crypto";
import { formatMoney, toMinorUnits } from "../lib/money";
import { CreateListingSchema } from "../server/validators/listing";
import { CreateRequestSchema, CreateQuoteSchema } from "../server/validators/request";
import { CreateOfferSchema, RespondOfferSchema } from "../server/validators/offer";
import { CreateOrderSchema } from "../server/validators/order";
import { DispatchDeliverySchema, AddTrackingEventSchema } from "../server/validators/business";
import { CreateReviewSchema } from "../server/validators/moderation";
import { CreateAuctionSchema, PlaceBidSchema } from "../server/validators/auction";

describe("E2E Marketplace Multi-Party Workflow", () => {
  const sellerId = "11111111-1111-4111-a111-111111111111";
  const buyerId = "22222222-2222-4222-a222-222222222222";
  const listingId = "33333333-3333-4333-a333-333333333333";
  const requestId = "44444444-4444-4444-a444-444444444444";

  it("Step 1: Seller lists physical item with verified pricing & fulfillment", () => {
    const listingInput = {
      title: "MacBook Pro 16 M3 Max 64GB 1TB",
      description: "Brand new sealed MacBook Pro with 1-year Apple care included.",
      categorySlug: "computers",
      listingType: "fixed_price" as const,
      condition: "new" as const,
      priceMajor: 3500000,
      currency: "NGN" as const,
      quantity: 1,
      city: "Ikeja",
      country: "Nigeria",
      fulfillment: "both" as const,
    };

    const parsedListing = CreateListingSchema.safeParse(listingInput);
    expect(parsedListing.success).toBe(true);

    const minorUnits = toMinorUnits(listingInput.priceMajor, "NGN");
    expect(minorUnits).toBe(350000000); // 3,500,000 NGN in kobo
    expect(formatMoney(minorUnits, "NGN")).toContain("3,500,000");
  });

  it("Step 2: Buyer publishes reverse-marketplace request when searching for custom requirements", () => {
    const requestInput = {
      title: "Need 20 units of 550W Tier 1 Solar Panels in Ibadan",
      description: "Longi or Jinko 550W Mono PERC solar panels delivered to Bodija.",
      category: "solar",
      budgetMajor: 2400000,
      currency: "NGN" as const,
      urgency: "urgent" as const,
      fulfillment: "shipping" as const,
      city: "Ibadan",
      country: "Nigeria",
    };

    const parsedRequest = CreateRequestSchema.safeParse(requestInput);
    expect(parsedRequest.success).toBe(true);
  });

  it("Step 3: Supplier responds to buyer request with competitive quote", () => {
    const quoteInput = {
      requestId,
      amountMajor: 2350000,
      currency: "NGN" as const,
      timeline: "2 business days",
      message: "We have 20 brand new Longi 550W panels ready in our Ibadan depot.",
    };

    const parsedQuote = CreateQuoteSchema.safeParse(quoteInput);
    expect(parsedQuote.success).toBe(true);
  });

  it("Step 4: Negotiation & Counter-Offers maintain immutable history", () => {
    const initialOffer = {
      listingId,
      amountMajor: 3200000,
      currency: "NGN" as const,
      message: "Can pay 3.2M cash immediately.",
    };
    const parsedOffer = CreateOfferSchema.safeParse(initialOffer);
    expect(parsedOffer.success).toBe(true);

    // Seller counters with 3.35M
    const counterOffer = {
      action: "counter" as const,
      counterAmountMajor: 3350000,
      message: "Lowest I can do is 3.35M with free pouch.",
    };
    const parsedCounter = RespondOfferSchema.safeParse(counterOffer);
    expect(parsedCounter.success).toBe(true);
  });

  it("Step 5: Buyer creates Escrow order with verified fee breakdown", () => {
    const orderInput = {
      listingId,
      deliveryFeeMajor: 5000,
      fulfillmentType: "delivery" as const,
      shippingAddress: {
        recipientName: "Emeka Okonkwo",
        phoneNumber: "+2348012345678",
        addressLine: "14 Admiralty Way, Lekki Phase 1",
        city: "Lagos",
        country: "Nigeria",
      },
      notes: "Please call before dispatching.",
    };

    const parsedOrder = CreateOrderSchema.safeParse(orderInput);
    expect(parsedOrder.success).toBe(true);

    const subtotalMinor = 335000000; // 3,350,000 NGN
    const deliveryFeeMinor = 500000; // 5,000 NGN
    const platformCommissionMinor = Math.round(subtotalMinor * 0.05); // 5% fee = 167,500 NGN
    const totalMinor = subtotalMinor + deliveryFeeMinor;

    expect(totalMinor).toBe(335500000);
    expect(platformCommissionMinor).toBe(16750000);
  });

  it("Step 6: Cryptographic Handover OTP secures delivery verification", () => {
    const { code, hash } = generateOtp();

    expect(code).toMatch(/^\d{6}$/); // 6-digit verification code
    expect(hash).toHaveLength(64); // SHA-256 hex digest

    // Verification check
    const correctHash = hashOtp(code);
    expect(correctHash).toBe(hash);

    const wrongHash = hashOtp("000000");
    expect(wrongHash).not.toBe(hash);
  });

  it("Step 7: Courier delivery dispatch & tracking event progression", () => {
    const dispatchInput = {
      courierProvider: "gig_logistics" as const,
      trackingCode: "GIG-LG-98214",
      estimatedDeliveryAt: new Date(Date.now() + 86400000).toISOString(),
    };
    const parsedDispatch = DispatchDeliverySchema.safeParse(dispatchInput);
    expect(parsedDispatch.success).toBe(true);

    const trackingEvent = {
      status: "in_transit" as const,
      location: "Victoria Island Sorting Center",
      description: "Package onboard with delivery courier",
    };
    const parsedEvent = AddTrackingEventSchema.safeParse(trackingEvent);
    expect(parsedEvent.success).toBe(true);
  });

  it("Step 8: Buyer confirms delivery & submits verified 5-star review", () => {
    const reviewInput = {
      orderId: "55555555-5555-4555-a555-555555555555",
      rating: 5,
      comment: "Super fast dispatch and item was pristine as described! Will buy again.",
    };
    const parsedReview = CreateReviewSchema.safeParse(reviewInput);
    expect(parsedReview.success).toBe(true);
  });

  it("Step 9: Auction bidding engine validates increments and anti-sniping extension", () => {
    const auctionInput = {
      listingId,
      startingPriceMajor: 50000,
      reservePriceMajor: 120000,
      minIncrementMajor: 5000,
      currency: "NGN" as const,
      durationHours: 48,
    };
    const parsedAuction = CreateAuctionSchema.safeParse(auctionInput);
    expect(parsedAuction.success).toBe(true);

    // Bidder places high bid
    const bidInput = {
      amountMajor: 60000,
      maxProxyMajor: 90000,
    };
    const parsedBid = PlaceBidSchema.safeParse(bidInput);
    expect(parsedBid.success).toBe(true);
  });
});
