import { describe, it, expect } from "vitest";
import {
  CreateReviewSchema,
  CreateReportSchema,
  ResolveReportSchema,
  SubmitVerificationSchema,
  ReviewVerificationSchema,
} from "./moderation";

describe("Sprint 5: Reviews, Moderation Reports & Vendor Verification", () => {
  describe("Review Validation", () => {
    it("validates review with valid rating between 1 and 5", () => {
      const valid = {
        orderId: "123e4567-e89b-12d3-a456-426614174000",
        rating: 5,
        comment: "Excellent seller, item was in perfect condition as described!",
      };
      expect(CreateReviewSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects review with rating out of range", () => {
      expect(
        CreateReviewSchema.safeParse({
          orderId: "123e4567-e89b-12d3-a456-426614174000",
          rating: 0,
        }).success,
      ).toBe(false);

      expect(
        CreateReviewSchema.safeParse({
          orderId: "123e4567-e89b-12d3-a456-426614174000",
          rating: 6,
        }).success,
      ).toBe(false);
    });
  });

  describe("Report Validation", () => {
    it("validates report against listing or profile", () => {
      const valid = {
        targetType: "listing",
        targetId: "123e4567-e89b-12d3-a456-426614174000",
        reason: "Counterfeit item",
        description: "Listing claims to be original brand but images show cheap replica badge.",
      };
      expect(CreateReportSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects unknown report target types", () => {
      const invalid = {
        targetType: "unknown_entity",
        targetId: "123e4567-e89b-12d3-a456-426614174000",
        reason: "Spam",
        description: "Spammy activity everywhere.",
      };
      expect(CreateReportSchema.safeParse(invalid).success).toBe(false);
    });

    it("validates report resolution payload", () => {
      const valid = {
        status: "resolved",
        resolutionNote: "Listing removed and vendor received first formal warning.",
        actionTaken: "hide_target",
      };
      expect(ResolveReportSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe("Vendor Verification KYC", () => {
    it("validates complete business KYC submission", () => {
      const valid = {
        businessName: "Lagos Gadgets & Electronics Hub",
        registrationNumber: "RC-8392019",
        taxId: "TIN-9281729",
        documentUrl: "https://storage.servilist.africa/kyc/doc-01.pdf",
      };
      expect(SubmitVerificationSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects invalid document URL", () => {
      const invalid = {
        businessName: "Lagos Hub",
        documentUrl: "not-a-valid-url",
      };
      expect(SubmitVerificationSchema.safeParse(invalid).success).toBe(false);
    });

    it("validates review decision approval and rejection", () => {
      expect(
        ReviewVerificationSchema.safeParse({ status: "approved" }).success,
      ).toBe(true);

      expect(
        ReviewVerificationSchema.safeParse({
          status: "rejected",
          rejectionReason: "CAC registration document is expired or illegible.",
        }).success,
      ).toBe(true);
    });
  });
});
