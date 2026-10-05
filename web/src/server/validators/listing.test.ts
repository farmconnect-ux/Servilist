import { describe, it, expect } from "vitest";
import { CreateListingSchema, ListingSearchSchema } from "./listing";

describe("Listing Validators (Sprint 2)", () => {
  it("accepts a valid listing input with African currency and city", () => {
    const valid = {
      title: "MacBook Pro M3 Max 36GB RAM",
      description: "Immaculate condition with box and original charger in Ikeja.",
      categorySlug: "electronics",
      listingType: "fixed_price",
      condition: "used_like_new",
      priceMajor: 2400000,
      currency: "NGN",
      city: "Lagos, Nigeria",
      country: "Nigeria",
      fulfillment: "both",
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    };

    const res = CreateListingSchema.safeParse(valid);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.currency).toBe("NGN");
      expect(res.data.listingType).toBe("fixed_price");
    }
  });

  it("rejects invalid titles and negative prices", () => {
    const invalid = {
      title: "Hi", // too short
      description: "Short", // too short
      priceMajor: -500, // negative
      currency: "XYZ", // invalid currency
      city: "",
    };

    const res = CreateListingSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("parses and defaults search parameters accurately", () => {
    const parsed = ListingSearchSchema.parse({
      q: "Solar inverter",
      category: "solar",
      city: "Lagos",
      minPrice: "50000",
      sort: "price_asc",
    });

    expect(parsed.q).toBe("Solar inverter");
    expect(parsed.category).toBe("solar");
    expect(parsed.minPrice).toBe(50000);
    expect(parsed.sort).toBe("price_asc");
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });
});
