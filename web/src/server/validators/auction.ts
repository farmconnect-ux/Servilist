import { z } from "zod";
import { AFRICAN_CURRENCIES } from "./listing";

export const AUCTION_STATUSES = [
  "scheduled",
  "active",
  "ended",
  "settled",
  "cancelled",
] as const;

export const CreateAuctionSchema = z.object({
  listingId: z.string().uuid("Invalid listing ID"),
  startingPriceMajor: z.number().positive("Starting price must be positive"),
  reservePriceMajor: z.number().positive("Reserve price must be positive").optional(),
  minIncrementMajor: z.number().positive("Minimum increment must be positive").default(500),
  currency: z.enum(AFRICAN_CURRENCIES).default("NGN"),
  startsAt: z.string().datetime().optional(),
  durationHours: z.number().int().min(1).max(336).default(72), // 1 hour to 14 days, default 3 days
  antiSnipingSeconds: z.number().int().min(60).max(1800).default(300), // default 5 min
});

export type CreateAuctionInput = z.infer<typeof CreateAuctionSchema>;

export const PlaceBidSchema = z.object({
  amountMajor: z.number().positive("Bid amount must be positive"),
  maxProxyMajor: z.number().positive().optional(),
});

export type PlaceBidInput = z.infer<typeof PlaceBidSchema>;

export const AuctionQuerySchema = z.object({
  status: z.enum(AUCTION_STATUSES).optional().default("active"),
  category: z.string().optional(),
  city: z.string().optional(),
  sellerId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type AuctionQueryInput = z.infer<typeof AuctionQuerySchema>;
