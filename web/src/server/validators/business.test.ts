import { describe, it, expect } from "vitest";
import {
  CreateBusinessProfileSchema,
  DispatchDeliverySchema,
  AddTrackingEventSchema,
} from "./business";

describe("Business & Delivery Validators", () => {
  describe("CreateBusinessProfileSchema", () => {
    it("validates valid business registration details", () => {
      const parsed = CreateBusinessProfileSchema.safeParse({
        businessName: "Lekki Solar Tech Ltd",
        registrationNumber: "RC-1299841",
        tagline: "Leading commercial solar installations across Nigeria",
        supportEmail: "support@lekkisolar.ng",
        websiteUrl: "https://lekkisolar.ng",
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid email or empty business name", () => {
      const parsed = CreateBusinessProfileSchema.safeParse({
        businessName: "",
        supportEmail: "not-an-email",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("DispatchDeliverySchema", () => {
    it("validates courier dispatch details", () => {
      const parsed = DispatchDeliverySchema.safeParse({
        courierProvider: "gig_logistics",
        trackingCode: "GIG-LAG-92841",
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe("AddTrackingEventSchema", () => {
    it("validates delivery tracking progress events", () => {
      const parsed = AddTrackingEventSchema.safeParse({
        status: "in_transit",
        location: "Ikeja Dispatch Hub",
        description: "Package sorted and assigned to delivery driver",
      });
      expect(parsed.success).toBe(true);
    });
  });
});
