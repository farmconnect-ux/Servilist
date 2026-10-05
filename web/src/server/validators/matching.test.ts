import { describe, expect, it } from "vitest";
import { MatchQuerySchema, UnifiedSearchSchema } from "./matching";

describe("matching and search validators", () => {
  it("defaults to six matches and caps the number asked for", () => {
    const parsed = MatchQuerySchema.safeParse({});
    expect(parsed.success && parsed.data.limit).toBe(6);
    expect(MatchQuerySchema.safeParse({ limit: 500 }).success).toBe(false);
    expect(MatchQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
  });

  it("searches everything by default", () => {
    const parsed = UnifiedSearchSchema.safeParse({ q: "  macbook pro " });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.q).toBe("macbook pro");
      expect(parsed.data.type).toBe("all");
    }
  });

  it("needs a real search term and a known type", () => {
    expect(UnifiedSearchSchema.safeParse({ q: "" }).success).toBe(false);
    expect(UnifiedSearchSchema.safeParse({ q: " a " }).success).toBe(false);
    expect(UnifiedSearchSchema.safeParse({ q: "phone", type: "users" }).success).toBe(false);
  });
});
