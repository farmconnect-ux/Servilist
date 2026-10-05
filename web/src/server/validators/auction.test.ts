import { describe, it, expect } from "vitest";
import { CreateAuctionSchema, PlaceBidSchema, AuctionQuerySchema } from "./auction";

describe("Auction Validators", () => {
  describe("CreateAuctionSchema", () => {
    it("validates a standard 3-day auction", () => {
      const parsed = CreateAuctionSchema.safeParse({
        listingId: "11111111-1111-4111-a111-111111111111",
        startingPriceMajor: 10000,
        reservePriceMajor: 25000,
        currency: "NGN",
        durationHours: 72,
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.minIncrementMajor).toBe(500);
        expect(parsed.data.antiSnipingSeconds).toBe(300);
      }
    });

    it("rejects invalid duration or non-uuid listing", () => {
      const parsed = CreateAuctionSchema.safeParse({
        listingId: "invalid-id",
        startingPriceMajor: -50,
        durationHours: 0,
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("PlaceBidSchema", () => {
    it("accepts valid bid amount with optional proxy", () => {
      const parsed = PlaceBidSchema.safeParse({
        amountMajor: 15000,
        maxProxyMajor: 20000,
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects negative or zero bid amounts", () => {
      const parsed = PlaceBidSchema.safeParse({
        amountMajor: 0,
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("AuctionQuerySchema", () => {
    it("applies defaults for pagination and status", () => {
      const parsed = AuctionQuerySchema.safeParse({});
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.status).toBe("active");
        expect(parsed.data.page).toBe(1);
        expect(parsed.data.limit).toBe(20);
      }
    });
  });
});
