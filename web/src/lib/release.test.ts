import { describe, expect, it } from "vitest";
import { isReleased } from "./release";

describe("release gate", () => {
  it("opens verified areas, with or without a trailing slash", () => {
    for (const path of [
      "/",
      "/login",
      "/search",
      "/categories/home",
      "/products/bubu-gown-d2cdf788",
      "/sell",
      "/dashboard",
      "/dashboard/settings/",
      "/admin",
      "/admin/users",
      "/api/v1/listings/123",
      "/requests/new",
      "/dashboard/offers",
      "/api/v1/offers",
      "/checkout",
      "/dashboard/orders/abc",
      "/api/v1/orders/1/pay",
      "/api/v1/webhooks/payments/paystack",
      "/admin/reports",
      "/services/plumbing-abc",
      "/dashboard/bookings",
      "/api/v1/services/abc/book",
      "/api/v1/bookings/abc/status",
      "/api/v1/reviews",
      "/api/v1/reports/abc/resolve",
      "/api/v1/orders/1/dispute",
      "/api/v1/orders/1/dispute/resolve",
      "/auctions",
      "/auctions/1",
      "/api/v1/auctions/1/bids",
    ]) {
      expect(isReleased(path), path).toBe(true);
    }
  });

  it("keeps unverified sprints closed", () => {
    for (const path of [
      "/business/acme",
      "/dashboard/seller",
      "/admin/vendors",
      "/api/v1/verifications",
      "/api/v1/orders/1/delivery",
      "/api/v1/orders/1/delivery/track",
      "/api/v1/webhooks/other",
      "/api/v1/requests/abc/matches",
    ]) {
      expect(isReleased(path), path).toBe(false);
    }
  });

  it("does not open look-alike paths", () => {
    expect(isReleased("/sellers-area")).toBe(false);
    expect(isReleased("/auctions-archive")).toBe(false);
    expect(isReleased("/admin/users-export")).toBe(false);
    expect(isReleased("/dashboard/anything")).toBe(false);
  });
});
