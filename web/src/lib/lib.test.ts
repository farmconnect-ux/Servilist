import { describe, expect, it } from "vitest";
import { formatMoney } from "./money";
import { safeNextPath } from "./security/redirect";

describe("safeNextPath", () => {
  it("keeps paths on this site", () => {
    expect(safeNextPath("/dashboard/settings")).toBe("/dashboard/settings");
    expect(safeNextPath("/admin?tab=users#top")).toBe("/admin?tab=users#top");
  });

  it("falls back for anything that could leave the site", () => {
    for (const next of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "dashboard",
      "/ok\nSet-Cookie: x",
      "",
      null,
      undefined,
    ]) {
      expect(safeNextPath(next)).toBe("/dashboard");
    }
  });

  it("uses the given fallback", () => {
    expect(safeNextPath(null, "/")).toBe("/");
  });
});

describe("formatMoney", () => {
  it("formats minor units in the listing's own currency", () => {
    expect(formatMoney(38500000, "NGN")).toBe("₦385,000");
    expect(formatMoney(320000, "GHS")).toBe("GH₵3,200.00");
    expect(formatMoney(95000, "RWF")).toBe("FRw 95,000");
    expect(formatMoney(1999, "USD")).toBe("$19.99");
  });

  it("does not guess at unknown currencies", () => {
    expect(formatMoney(100, "ABC")).toBe("100 ABC");
  });
});
