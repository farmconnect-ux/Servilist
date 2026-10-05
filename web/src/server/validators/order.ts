import { z } from "zod";

export const ORDER_STATUSES = [
  "pending_payment",
  "payment_confirmed",
  "in_escrow",
  "processing",
  "dispatched",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
  "refunded",
] as const;

export const ShippingAddressSchema = z.object({
  recipientName: z.string().min(2, "Recipient name is required"),
  phoneNumber: z.string().min(8, "Phone number is required"),
  addressLine: z.string().min(5, "Delivery address is required"),
  city: z.string().min(2, "City is required"),
  country: z.string().default("Nigeria"),
});

export const CreateOrderSchema = z.object({
  listingId: z.string().uuid().optional(),
  quoteId: z.string().uuid().optional(),
  offerId: z.string().uuid().optional(),
  fulfillmentType: z.enum(["delivery", "pickup"]).default("delivery"),
  shippingAddress: ShippingAddressSchema.optional(),
  notes: z.string().max(500).optional(),
}).refine((data) => data.listingId || data.quoteId || data.offerId, {
  message: "Order must originate from a listing, quote, or offer",
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
