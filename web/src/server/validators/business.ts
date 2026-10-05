import { z } from "zod";

export const COURIER_PROVIDERS = [
  "gig_logistics",
  "kwik_delivery",
  "dhl",
  "fedex",
  "seller_direct",
  "pickup",
] as const;

export const DELIVERY_STATUSES = [
  "pending",
  "assigned",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
  "returned",
] as const;

export const VERIFIED_TIERS = [
  "unverified",
  "tier_1_identity",
  "tier_2_business_cac",
  "tier_3_enterprise",
] as const;

export const CreateBusinessProfileSchema = z.object({
  businessName: z.string().min(2, "Business name is required").max(150),
  registrationNumber: z.string().max(100).optional(),
  tagline: z.string().max(250).optional(),
  description: z.string().max(3000).optional(),
  logoUrl: z.string().url("Valid logo URL required").optional(),
  bannerUrl: z.string().url("Valid banner URL required").optional(),
  supportEmail: z.string().email("Valid email required").optional(),
  supportPhone: z.string().max(30).optional(),
  websiteUrl: z.string().url("Valid website URL required").optional(),
  returnPolicy: z.string().max(3000).optional(),
  operatingHours: z.record(z.string(), z.string()).optional(),
});

export type CreateBusinessProfileInput = z.infer<typeof CreateBusinessProfileSchema>;

export const UpdateBusinessProfileSchema = CreateBusinessProfileSchema.partial();
export type UpdateBusinessProfileInput = z.infer<typeof UpdateBusinessProfileSchema>;

export const DispatchDeliverySchema = z.object({
  courierProvider: z.enum(COURIER_PROVIDERS).default("seller_direct"),
  trackingCode: z.string().max(100).optional(),
  estimatedDeliveryAt: z.string().datetime().optional(),
  senderAddress: z.record(z.string(), z.any()).optional(),
  recipientAddress: z.record(z.string(), z.any()).optional(),
});

export type DispatchDeliveryInput = z.infer<typeof DispatchDeliverySchema>;

export const AddTrackingEventSchema = z.object({
  status: z.enum(DELIVERY_STATUSES),
  location: z.string().max(150).optional(),
  description: z.string().min(2).max(500),
  proofOfDeliveryUrl: z.string().url().optional(),
});

export type AddTrackingEventInput = z.infer<typeof AddTrackingEventSchema>;
