import { z } from "zod";

export const MatchQuerySchema = z.object({
  minScore: z.coerce.number().min(0).max(100).default(30),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type MatchQueryInput = z.infer<typeof MatchQuerySchema>;

export const UnifiedSearchSchema = z.object({
  q: z.string().min(1, "Query is required").max(100),
  entityType: z.enum(["all", "listings", "services", "requests", "auctions"]).default("all"),
  category: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export type UnifiedSearchInput = z.infer<typeof UnifiedSearchSchema>;
