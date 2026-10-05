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

export const CreateServiceSchema = z
  .object({
    title: z.string().trim().min(5, "Title must be at least 5 characters").max(150),
    description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000),
    categorySlug: z.string().trim().min(2).max(100).default("services"),
    pricingModel: z.enum(PRICING_MODELS).default("starting_at"),
    basePriceMajor: z.number().nonnegative("Price cannot be negative"),
    currency: z.enum(AFRICAN_CURRENCIES).default("NGN"),
    deliveryType: z.enum(DELIVERY_TYPES).default("hybrid"),
    city: z.string().trim().max(100).optional(),
    country: z.string().trim().min(2, "Country is required").max(100),
    packages: z.array(ServicePackageSchema).max(6).optional(),
  })
  .refine((data) => data.pricingModel === "custom_quote" || data.basePriceMajor > 0, {
    message: "Enter a price greater than zero",
    path: ["basePriceMajor"],
  });

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;

/**
 * A booking names the service and, optionally, one of its packages. It carries
 * no price: the database takes that from the service.
 */
export const CreateServiceBookingSchema = z.object({
  serviceId: z.string().uuid(),
  packageName: z.string().trim().max(100).optional(),
  scheduledDate: z.string().datetime().optional(),
  deliverablesNote: z.string().trim().max(2000).optional(),
});

export const BookingStatusSchema = z.object({
  status: z.enum(["confirmed", "in_progress", "completed", "cancelled"]),
});

export type CreateServiceBookingInput = z.infer<typeof CreateServiceBookingSchema>;
