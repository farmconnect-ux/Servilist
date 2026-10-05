import { describe, it, expect } from "vitest";
import { CreateOrderSchema, ConfirmDeliveryOtpSchema, DisputeOrderSchema } from "./order";
import { generateOtp, hashOtp } from "../../lib/crypto";

describe("Sprint 4: Orders, Payments & Escrow Ledger", () => {
  describe("Order Schema Validation", () => {
    it("validates a listing checkout order with doorstep delivery", () => {
      const valid = {
        listingId: "123e4567-e89b-12d3-a456-426614174000",
        fulfillmentType: "delivery",
        shippingAddress: {
          recipientName: "Amara Eze",
          phoneNumber: "+234 803 123 4567",
          addressLine: "14 Admiralty Way, Lekki Phase 1",
          city: "Lagos",
          country: "Nigeria",
        },
        notes: "Please call on arrival",
      };

      const res = CreateOrderSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects an order that names no listing or offer", () => {
      const invalid = {
        fulfillmentType: "pickup",
      };

      const res = CreateOrderSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("Handover OTP Security", () => {
    it("generates and verifies 6-digit cryptographic OTP correctly", () => {
      const { code, hash } = generateOtp();
      expect(code).toMatch(/^\d{6}$/);
      expect(hash).toHaveLength(64); // SHA-256 hex length

      const computed = hashOtp(code);
      expect(computed).toBe(hash);
    });

    it("enforces exact 6-digit OTP format in validator", () => {
      const valid = {
        orderId: "123e4567-e89b-12d3-a456-426614174000",
        otp: "847291",
      };
      expect(ConfirmDeliveryOtpSchema.safeParse(valid).success).toBe(true);

      const invalidLength = {
        orderId: "123e4567-e89b-12d3-a456-426614174000",
        otp: "8472",
      };
      expect(ConfirmDeliveryOtpSchema.safeParse(invalidLength).success).toBe(false);

      const nonNumeric = {
        orderId: "123e4567-e89b-12d3-a456-426614174000",
        otp: "84729A",
      };
      expect(ConfirmDeliveryOtpSchema.safeParse(nonNumeric).success).toBe(false);
    });
  });

  describe("Dispute Validation", () => {
    it("validates dispute payload with standard reasons", () => {
      const valid = {
        orderId: "123e4567-e89b-12d3-a456-426614174000",
        reason: "item_damaged_or_faulty",
        description: "The item arrived with a cracked screen that was not visible in pictures.",
      };
      expect(DisputeOrderSchema.safeParse(valid).success).toBe(true);
    });
  });

  // Payment providers are tested in server/payments/provider.test.ts
});
