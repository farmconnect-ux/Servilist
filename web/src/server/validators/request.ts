import { z } from "zod";
import { AFRICAN_CURRENCIES, FULFILLMENT_OPTIONS } from "./listing";

export const REQUEST_TYPES = ["good", "service", "bulk_purchase", "custom"] as const;

export const REQUEST_STATUSES = [
  "draft",
  "open",
  "receiving_offers",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
  "expired",
] as const;

export const CreateRequestSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title cannot exceed 150 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters"),
  category: z.string().default("electronics"),
  requestType: z.enum(REQUEST_TYPES).default("good"),
  budgetMajor: z.number().positive("Budget must be greater than zero"),
  budgetMinMajor: z.number().nonnegative().optional(),
  budgetMaxMajor: z.number().nonnegative().optional(),
  currency: z.enum(AFRICAN_CURRENCIES).default("NGN"),
  urgency: z.string().default("Within 2-3 Days"),
  conditionRequired: z.string().optional(),
  city: z.string().min(2, "City is required"),
  country: z.string().default("Nigeria"),
  fulfillment: z.enum(FULFILLMENT_OPTIONS).default("both"),
  deadlineDays: z.number().int().min(1).max(90).default(7),
});

export type CreateRequestInput = z.infer<typeof CreateRequestSchema>;

export const CreateQuoteSchema = z.object({
  requestId: z.string().uuid(),
  amountMajor: z.number().positive("Quote amount must be positive"),
  currency: z.enum(AFRICAN_CURRENCIES).default("NGN"),
  timeline: z.string().min(2, "Timeline required (e.g. 2 days)"),
  message: z.string().min(5, "Provide proposal details for the buyer"),
});

export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
