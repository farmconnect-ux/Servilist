import { z } from "zod";
import { AFRICAN_CURRENCIES } from "./listing";

export const PRICING_MODELS = ["fixed", "starting_at", "hourly", "custom_quote"] as const;
export const DELIVERY_TYPES = ["remote", "on_site_local", "hybrid"] as const;

export const ServicePackageSchema = z.object({
  name: z.string().min(2, "Package name required"),
  priceMajor: z.number().positive("Package price must be positive"),
  timeline: z.string().min(1, "Timeline is required"),
  deliverables: z.string().optional(),
});

export const CreateServiceSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  categorySlug: z.string().default("services"),
  pricingModel: z.enum(PRICING_MODELS).default("starting_at"),
  basePriceMajor: z.number().positive("Base price must be greater than zero"),
  currency: z.enum(AFRICAN_CURRENCIES).default("NGN"),
  deliveryType: z.enum(DELIVERY_TYPES).default("hybrid"),
  city: z.string().optional(),
  country: z.string().default("Nigeria"),
  packages: z.array(ServicePackageSchema).optional(),
});

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;

export const CreateServiceBookingSchema = z.object({
  serviceId: z.string().uuid(),
  packageName: z.string().default("Standard"),
  amountMajor: z.number().positive("Booking amount must be positive"),
  currency: z.enum(AFRICAN_CURRENCIES).default("NGN"),
  scheduledDate: z.string().datetime().optional(),
  deliverablesNote: z.string().max(2000).optional(),
});

export type CreateServiceBookingInput = z.infer<typeof CreateServiceBookingSchema>;
