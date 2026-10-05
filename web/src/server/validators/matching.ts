import { z } from "zod";

export const MatchQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

export type MatchQueryInput = z.infer<typeof MatchQuerySchema>;

export const UnifiedSearchSchema = z.object({
  q: z.string().trim().min(2, "Enter at least 2 characters").max(80),
  type: z.enum(["all", "listings", "services", "requests", "auctions"]).default("all"),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export type UnifiedSearchInput = z.infer<typeof UnifiedSearchSchema>;
