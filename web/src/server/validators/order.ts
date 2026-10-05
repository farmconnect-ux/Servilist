import { z } from "zod";

export const ORDER_STATUSES = [
  "pending_payment",
  "in_escrow",
  "dispatched",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
  "refunded",
] as const;

export const ShippingAddressSchema = z.object({
  recipientName: z.string().trim().min(2, "Recipient name is required").max(120),
  phoneNumber: z.string().trim().min(8, "Phone number is required").max(30),
  addressLine: z.string().trim().min(5, "Delivery address is required").max(300),
  city: z.string().trim().min(2, "City is required").max(80),
  country: z.string().trim().max(80).default("Nigeria"),
});

/**
 * An order names what is being bought and how it is handed over. It carries no
 * price: the database takes that from the listing or the accepted offer.
 * Accepted quotes on buyer requests are handled by accept_quote(), not here.
 */
export const CreateOrderSchema = z
  .object({
    listingId: z.string().uuid().optional(),
    offerId: z.string().uuid().optional(),
    fulfillmentType: z.enum(["delivery", "pickup"]).default("pickup"),
    shippingAddress: ShippingAddressSchema.optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((data) => Boolean(data.listingId || data.offerId), {
    message: "Order must originate from a listing or an accepted offer",
  })
  .refine((data) => data.fulfillmentType !== "delivery" || data.shippingAddress !== undefined, {
    message: "A delivery address is required",
    path: ["shippingAddress"],
  });

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const ConfirmDeliveryOtpSchema = z.object({
  orderId: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/, "Handover OTP must be exactly 6 digits"),
});

export type ConfirmDeliveryOtpInput = z.infer<typeof ConfirmDeliveryOtpSchema>;

export const DisputeOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.enum([
    "item_not_received",
    "item_damaged_or_faulty",
    "counterfeit_or_mismatched",
    "vendor_unresponsive",
    "other",
  ]),
  description: z.string().min(10, "Please provide dispute details").max(2000),
});

export type DisputeOrderInput = z.infer<typeof DisputeOrderSchema>;
