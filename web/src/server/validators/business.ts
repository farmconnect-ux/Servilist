import { z } from "zod";

/**
 * Business pages and deliveries. The database functions repeat these checks
 * (supabase/migrations/00019); these exist to give people a clear message
 * before the request is sent.
 */

/** Steps a seller can report after dispatch. Steps only move forward. */
export const DELIVERY_STEPS = ["dispatched", "in_transit", "out_for_delivery", "delivered"] as const;
export type DeliveryStep = (typeof DELIVERY_STEPS)[number];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

const optionalHttps = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => value === "" || /^https:\/\/[^\s"'<>]+$/.test(value), {
      message: "Web addresses must start with https://",
    })
    .optional()
    .transform((value) => value || undefined);

export const BusinessProfileSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Enter a business name of at least 2 characters")
    .max(150, "Keep the business name to 150 characters"),
  tagline: optionalText(250),
  description: optionalText(3000),
  logoUrl: optionalHttps(500),
  bannerUrl: optionalHttps(500),
  supportEmail: z
    .string()
    .trim()
    .max(255)
    .refine((value) => value === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), {
      message: "Enter a valid support email address",
    })
    .optional()
    .transform((value) => value || undefined),
  supportPhone: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\+?[0-9 ()-]{6,30}$/.test(value), {
      message: "Enter a valid support phone number",
    })
    .optional()
    .transform((value) => value || undefined),
  websiteUrl: optionalHttps(300),
  returnPolicy: optionalText(3000),
  openingHours: optionalText(300),
  registrationNumber: optionalText(100),
});

export type BusinessProfileInput = z.infer<typeof BusinessProfileSchema>;

export const DispatchSchema = z.object({
  carrierName: z
    .string()
    .trim()
    .min(2, "Say who is delivering the item")
    .max(80, "Keep this to 80 characters"),
  trackingCode: optionalText(100),
  estimatedDeliveryAt: z.string().datetime({ offset: true }).optional(),
  note: optionalText(300),
});

export type DispatchInput = z.infer<typeof DispatchSchema>;

export const DeliveryUpdateSchema = z.object({
  // "dispatched" is recorded by dispatching, not as an update
  status: z.enum(["in_transit", "out_for_delivery", "delivered"]),
  note: optionalText(300),
});

export type DeliveryUpdateInput = z.infer<typeof DeliveryUpdateSchema>;
