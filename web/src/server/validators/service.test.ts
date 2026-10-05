import { describe, it, expect } from "vitest";
import { CreateServiceSchema, CreateServiceBookingSchema } from "./service";

describe("Sprint 6: Services Marketplace & Booking Validation", () => {
  describe("Service Catalog Creation", () => {
    it("validates a professional service with tiered packages", () => {
      const valid = {
        title: "Full Solar Inverter & Battery Installation",
        description: "Certified electrical engineer providing full load-audit, inverter installation, and safety grounding in Lagos.",
        categorySlug: "engineering",
        pricingModel: "starting_at",
        basePriceMajor: 150000,
        currency: "NGN",
        deliveryType: "on_site_local",
        city: "Lagos",
        country: "Nigeria",
        packages: [
          {
            name: "Basic Audit & 1kVA Setup",
            priceMajor: 75000,
            timeline: "1 day",
            deliverables: "Inspection, wiring check, 1kVA inverter hookup",
          },
          {
            name: "Full 5kVA Solar System Setup",
            priceMajor: 150000,
            timeline: "2-3 days",
            deliverables: "Roof panel mounting, 5kVA inverter, battery bank configuration",
          },
        ],
      };

      const res = CreateServiceSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects service with short title or invalid pricing", () => {
      const invalid = {
        title: "Fix",
        description: "short",
        basePriceMajor: -500,
      };

      const res = CreateServiceSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("Service Booking Validation", () => {
    it("validates client service booking", () => {
      const valid = {
        serviceId: "123e4567-e89b-12d3-a456-426614174000",
        packageName: "Full 5kVA Solar System Setup",
        amountMajor: 150000,
        currency: "NGN",
        deliverablesNote: "Please come with safety ladders for 2-storey roof inspection.",
      };

      const res = CreateServiceBookingSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects booking with non-positive price", () => {
      const invalid = {
        serviceId: "123e4567-e89b-12d3-a456-426614174000",
        packageName: "Basic",
        amountMajor: 0,
      };

      const res = CreateServiceBookingSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });
});
