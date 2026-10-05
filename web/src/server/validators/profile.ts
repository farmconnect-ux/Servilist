import { z } from "zod";

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(100),
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters").optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  countryCode: z.string().max(5).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
