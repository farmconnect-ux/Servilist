import { z } from "zod";
import { AFRICAN_CURRENCIES } from "./listing";

export const OFFER_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "countered",
  "expired",
  "cancelled",
] as const;

export const CreateOfferSchema = z.object({
  listingId: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(),
  amountMajor: z.number().positive("Offer amount must be positive"),
  currency: z.enum(AFRICAN_CURRENCIES).default("NGN"),
  message: z.string().max(1000).optional(),
  parentOfferId: z.string().uuid().optional(),
}).refine((data) => data.listingId || data.requestId, {
  message: "Offer must be attached to either a listing or a buyer request",
});

export type CreateOfferInput = z.infer<typeof CreateOfferSchema>;

export const RespondOfferSchema = z.object({
  action: z.enum(["accept", "reject", "counter", "cancel"]),
  counterAmountMajor: z.number().positive().optional(),
  counterMessage: z.string().max(1000).optional(),
});

export type RespondOfferInput = z.infer<typeof RespondOfferSchema>;
