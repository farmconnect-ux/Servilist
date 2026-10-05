import { describe, it, expect } from "vitest";
import { MatchQuerySchema, UnifiedSearchSchema } from "./matching";

describe("Matching & Unified Search Validators", () => {
  describe("MatchQuerySchema", () => {
    it("applies sensible defaults for matching threshold", () => {
      const parsed = MatchQuerySchema.safeParse({});
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.minScore).toBe(30);
        expect(parsed.data.limit).toBe(10);
      }
    });

    it("rejects score outside 0-100 range", () => {
      const parsed = MatchQuerySchema.safeParse({ minScore: 150 });
      expect(parsed.success).toBe(false);
    });
  });

  describe("UnifiedSearchSchema", () => {
    it("validates cross-entity search parameters", () => {
      const parsed = UnifiedSearchSchema.safeParse({
        q: "macbook pro",
        entityType: "listings",
        city: "Lagos",
      });
      expect(parsed.success).toBe(true);
    });

    it("requires search query", () => {
      const parsed = UnifiedSearchSchema.safeParse({
        q: "",
      });
      expect(parsed.success).toBe(false);
    });
  });
});
