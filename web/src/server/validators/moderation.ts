import { z } from "zod";

export const CreateReviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1, "Rating must be at least 1 star").max(5, "Rating cannot exceed 5 stars"),
  comment: z.string().max(2000, "Review comment cannot exceed 2000 characters").optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

export const REPORT_TARGETS = [
  "listing",
  "profile",
  "review",
  "message",
  "order",
  "request",
] as const;

export const CreateReportSchema = z.object({
  targetType: z.enum(REPORT_TARGETS),
  targetId: z.string().uuid(),
  reason: z.string().min(3, "Reason required").max(100),
  description: z.string().min(10, "Please provide description details").max(2000),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;

export const ResolveReportSchema = z.object({
  status: z.enum(["under_review", "resolved", "dismissed"]),
  resolutionNote: z.string().max(1000).optional(),
  // Suspending or warning a member is done from the Members page, where it is
  // logged against that member; a report can only hide what was reported.
  actionTaken: z.enum(["none", "hide_target"]).default("none"),
});

export const ResolveDisputeSchema = z.object({
  outcome: z.enum(["release", "refund"]),
  note: z.string().trim().max(1000).optional(),
});

export type ResolveDisputeInput = z.infer<typeof ResolveDisputeSchema>;

export type ResolveReportInput = z.infer<typeof ResolveReportSchema>;

export const SubmitVerificationSchema = z.object({
  businessName: z.string().min(2, "Business or full legal name is required").max(200),
  registrationNumber: z.string().max(100).optional(),
  taxId: z.string().max(100).optional(),
  documentUrl: z
    .string()
    .url("Valid proof document URL is required")
    .startsWith("https://", "The document link must start with https://"),
});

export type SubmitVerificationInput = z.infer<typeof SubmitVerificationSchema>;

export const ReviewVerificationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().max(1000).optional(),
});

export type ReviewVerificationInput = z.infer<typeof ReviewVerificationSchema>;
