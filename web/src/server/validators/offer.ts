import { z } from "zod";

export const OFFER_STATUSES = ["pending", "accepted", "rejected", "countered", "cancelled"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

/**
 * An offer names a listing and an amount. The buyer comes from the session,
 * and the seller and currency from the listing, inside the database.
 */
export const CreateOfferSchema = z.object({
  listingId: z.string().uuid("Offer must be attached to a listing"),
  amountMajor: z.number().positive("Offer amount must be positive"),
  message: z.string().trim().max(1000).optional(),
});

export type CreateOfferInput = z.infer<typeof CreateOfferSchema>;

export const RespondOfferSchema = z
  .object({
    action: z.enum(["accept", "reject", "counter", "cancel"]),
    counterAmountMajor: z.number().positive().optional(),
    counterMessage: z.string().trim().max(1000).optional(),
  })
  .refine((data) => data.action !== "counter" || data.counterAmountMajor !== undefined, {
    message: "A counter-offer needs an amount",
    path: ["counterAmountMajor"],
  });

export type RespondOfferInput = z.infer<typeof RespondOfferSchema>;
