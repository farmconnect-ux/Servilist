import { z } from "zod";

export const LISTING_TYPES = [
  "classified",
  "fixed_price",
  "negotiable",
  "auction",
  "service",
] as const;

export const LISTING_CONDITIONS = [
  "new",
  "refurbished",
  "used_like_new",
  "used_good",
  "used_fair",
] as const;

export const LISTING_STATUSES = [
  "draft",
  "published",
  "active",
  "paused",
  "sold",
  "expired",
  "removed",
] as const;

export const FULFILLMENT_OPTIONS = ["pickup", "shipping", "both"] as const;

export const AFRICAN_CURRENCIES = [
  "NGN",
  "KES",
  "GHS",
  "ZAR",
  "EGP",
  "RWF",
  "TZS",
  "UGX",
  "XOF",
  "USD",
] as const;

const ListingFields = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters"),
  categoryId: z.string().uuid().optional(),
  categorySlug: z.string().min(2).max(100).default("electronics"),
  listingType: z.enum(LISTING_TYPES).default("fixed_price"),
  condition: z.enum(LISTING_CONDITIONS).default("used_good"),
  priceMajor: z.number().nonnegative("Price cannot be negative"),
  currency: z.enum(AFRICAN_CURRENCIES).default("NGN"),
  quantity: z.number().int().min(1).default(1),
  negotiable: z.boolean().default(false),
  city: z.string().min(2, "City is required").max(100),
  country: z.string().min(2).max(100).default("Nigeria"),
  fulfillment: z.enum(FULFILLMENT_OPTIONS).default("both"),
  imageUrl: z
    .string({ error: "Add at least one photo" })
    .url("Add at least one photo")
    .startsWith("https://", "Photos must use a secure address"),
  galleryImages: z
    .array(z.string().url().startsWith("https://", "Photos must use a secure address"))
    .max(8)
    .optional()
    .default([]),
  status: z.enum(["draft", "published", "active"]).default("active"),
  // Auctions only: how long bidding runs, and an optional private reserve
  auctionDurationHours: z.number().int().min(1).max(336).optional(),
  reservePriceMajor: z.number().positive().optional(),
});

export const CreateListingSchema = ListingFields
  .refine((data) => data.listingType !== "auction" || data.auctionDurationHours !== undefined, {
    message: "Choose how long the auction runs",
    path: ["auctionDurationHours"],
  })
  .refine((data) => data.listingType !== "auction" || data.priceMajor > 0, {
    message: "An auction needs a starting bid",
    path: ["priceMajor"],
  })
  .refine(
    (data) => data.reservePriceMajor === undefined || data.reservePriceMajor >= data.priceMajor,
    { message: "The reserve cannot be lower than the starting bid", path: ["reservePriceMajor"] },
  );

export type CreateListingInput = z.infer<typeof CreateListingSchema>;

// An auction's length and reserve are set once, when it is created
export const UpdateListingSchema = ListingFields.omit({
  auctionDurationHours: true,
  reservePriceMajor: true,
})
  .partial()
  .extend({
  status: z.enum(LISTING_STATUSES).optional(),
});

export type UpdateListingInput = z.infer<typeof UpdateListingSchema>;

export const ListingSearchSchema = z.object({
  q: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  condition: z.enum(LISTING_CONDITIONS).optional(),
  format: z.string().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "bids_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListingSearchInput = z.infer<typeof ListingSearchSchema>;
