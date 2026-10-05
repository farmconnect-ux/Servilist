import { describe, expect, it } from "vitest";
import { requiresSignIn } from "./protected";

describe("pages that need sign-in", () => {
  it("covers private areas and everything beneath them", () => {
    for (const path of ["/dashboard", "/dashboard/orders/1", "/admin/users", "/sell", "/checkout", "/requests/new"]) {
      expect(requiresSignIn(path), path).toBe(true);
    }
  });

  it("leaves public pages open, including look-alike addresses", () => {
    for (const path of ["/", "/search", "/requests", "/requests/abc", "/products/x", "/seller/someone", "/sellers", "/login"]) {
      expect(requiresSignIn(path), path).toBe(false);
    }
  });
});
