import { describe, expect, it } from "vitest";
import { BusinessProfileSchema, DeliveryUpdateSchema, DispatchSchema } from "./business";

describe("business page validator", () => {
  it("accepts a name alone and drops empty optional fields", () => {
    const parsed = BusinessProfileSchema.safeParse({
      businessName: "  Ade Stores  ",
      tagline: "",
      websiteUrl: "",
      supportEmail: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.businessName).toBe("Ade Stores");
      expect(parsed.data.tagline).toBeUndefined();
      expect(parsed.data.websiteUrl).toBeUndefined();
      expect(parsed.data.supportEmail).toBeUndefined();
    }
  });

  it("rejects a missing name, a bad email and a bad phone number", () => {
    expect(BusinessProfileSchema.safeParse({ businessName: "" }).success).toBe(false);
    expect(BusinessProfileSchema.safeParse({ businessName: "Ade", supportEmail: "nope" }).success).toBe(false);
    expect(BusinessProfileSchema.safeParse({ businessName: "Ade", supportPhone: "call me" }).success).toBe(false);
  });

  it("only accepts https web addresses", () => {
    for (const websiteUrl of ["http://example.com", "javascript:alert(1)", "example.com"]) {
      expect(BusinessProfileSchema.safeParse({ businessName: "Ade", websiteUrl }).success, websiteUrl).toBe(false);
    }
    expect(
      BusinessProfileSchema.safeParse({ businessName: "Ade", websiteUrl: "https://example.com" }).success,
    ).toBe(true);
  });

  it("has no way to set a verified status", () => {
    const parsed = BusinessProfileSchema.safeParse({ businessName: "Ade", verifiedTier: "tier_3_enterprise" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).not.toHaveProperty("verifiedTier");
  });
});

describe("delivery validators", () => {
  it("needs a carrier to dispatch", () => {
    expect(DispatchSchema.safeParse({ carrierName: "" }).success).toBe(false);
    expect(DispatchSchema.safeParse({ carrierName: "Rider: Tunde", trackingCode: "WB-1" }).success).toBe(true);
  });

  it("accepts only the steps after dispatch", () => {
    expect(DeliveryUpdateSchema.safeParse({ status: "in_transit" }).success).toBe(true);
    expect(DeliveryUpdateSchema.safeParse({ status: "delivered" }).success).toBe(true);
    for (const status of ["dispatched", "completed", "returned", ""]) {
      expect(DeliveryUpdateSchema.safeParse({ status }).success, status).toBe(false);
    }
  });
});
