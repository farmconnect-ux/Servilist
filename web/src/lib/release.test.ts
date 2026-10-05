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
    ]) {
      expect(isReleased(path), path).toBe(true);
    }
  });

  it("keeps unverified sprints closed", () => {
    for (const path of [
      "/checkout",
      "/services",
      "/auctions/1",
      "/business/acme",
      "/dashboard/orders",
      "/dashboard/seller",
      "/admin/vendors",
      "/admin/reports",
      "/api/v1/orders/1/pay",
      "/api/v1/webhooks/payments/paystack",
      "/api/v1/orders",
    ]) {
      expect(isReleased(path), path).toBe(false);
    }
  });

  it("does not open look-alike paths", () => {
    expect(isReleased("/sellers-area")).toBe(false);
    expect(isReleased("/admin/users-export")).toBe(false);
    expect(isReleased("/dashboard/anything")).toBe(false);
  });
});
