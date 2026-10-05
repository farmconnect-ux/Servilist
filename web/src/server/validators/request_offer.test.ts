import { describe, it, expect } from "vitest";
import { CreateRequestSchema, CreateQuoteSchema } from "./request";
import { CreateOfferSchema, RespondOfferSchema } from "./offer";
import { SendMessageSchema } from "./message";

describe("Sprint 3: Request, Offer & Message Validators", () => {
  describe("Buyer Request Validation", () => {
    it("accepts a valid buyer request", () => {
      const valid = {
        title: "Clean iPhone 13 Pro 128GB Sierra Blue",
        description: "Looking for factory unlocked device with battery health above 85% in Lagos.",
        category: "electronics",
        requestType: "good",
        budgetMajor: 450000,
        currency: "NGN",
        urgency: "Within 2-3 Days",
        conditionRequired: "Used - Like New",
        city: "Lagos",
        country: "Nigeria",
        fulfillment: "both",
        deadlineDays: 7,
      };

      const res = CreateRequestSchema.safeParse(valid);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.budgetMajor).toBe(450000);
        expect(res.data.deadlineDays).toBe(7);
      }
    });

    it("rejects request missing title or description", () => {
      const invalid = {
        title: "Car", // too short
        description: "short",
        budgetMajor: 0, // non-positive
      };

      const res = CreateRequestSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("Vendor Quote Validation", () => {
    it("validates vendor quotes with timeline and price", () => {
      const valid = {
        requestId: "a0000000-0000-4000-8000-000000000001",
        amountMajor: 420000,
        currency: "NGN",
        timeline: "Same-day delivery",
        message: "Available in computer village Ikeja. Battery health 88%.",
      };

      const res = CreateQuoteSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects non-positive quote amount", () => {
      const invalid = {
        requestId: "a0000000-0000-4000-8000-000000000001",
        amountMajor: -100,
        currency: "NGN",
        timeline: "2 days",
        message: "Will deliver",
      };

      const res = CreateQuoteSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("Offer & Negotiation Validation", () => {
    it("validates direct offer on a listing", () => {
      const valid = {
        listingId: "b0000000-0000-4000-8000-000000000002",
        amountMajor: 35000,
        currency: "NGN",
        message: "Can pay today via escrow if we agree on 35k",
      };

      const res = CreateOfferSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects an offer that names no listing", () => {
      const invalid = {
        amountMajor: 35000,
        currency: "NGN",
      };

      const res = CreateOfferSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("validates counter offer response action", () => {
      const counter = {
        action: "counter",
        counterAmountMajor: 38000,
        counterMessage: "Lowest I can do is 38k including delivery",
      };

      const res = RespondOfferSchema.safeParse(counter);
      expect(res.success).toBe(true);
    });

    it("validates accept/reject actions", () => {
      expect(RespondOfferSchema.safeParse({ action: "accept" }).success).toBe(true);
      expect(RespondOfferSchema.safeParse({ action: "reject" }).success).toBe(true);
      expect(RespondOfferSchema.safeParse({ action: "cancel" }).success).toBe(true);
      expect(RespondOfferSchema.safeParse({ action: "invalid_action" }).success).toBe(false);
    });
  });

  describe("Messaging Validation", () => {
    it("validates item-linked message", () => {
      const valid = {
        recipientId: "c0000000-0000-4000-8000-000000000003",
        listingId: "b0000000-0000-4000-8000-000000000002",
        body: "Hello, is this item still available for inspection?",
      };

      const res = SendMessageSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects empty message or message without item target", () => {
      const noItem = {
        recipientId: "c0000000-0000-4000-8000-000000000003",
        body: "Hello there",
      };
      expect(SendMessageSchema.safeParse(noItem).success).toBe(false);

      const emptyBody = {
        recipientId: "c0000000-0000-4000-8000-000000000003",
        listingId: "b0000000-0000-4000-8000-000000000002",
        body: "",
      };
      expect(SendMessageSchema.safeParse(emptyBody).success).toBe(false);
    });
  });
});
