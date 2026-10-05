import "server-only";
import { createDb } from "@/lib/db/server";
import { isUuid } from "@/lib/ids";
import type { SessionUser } from "@/server/auth/session";
import { can, canParticipate } from "@/server/policies/access";
import {
  createReport,
  createReview,
  openDispute,
  resolveDispute,
  resolveReport,
  reviewVerificationRecord,
  submitVerification,
} from "../repositories/moderation";
import {
  CreateReportSchema,
  CreateReviewSchema,
  ResolveDisputeSchema,
  ResolveReportSchema,
  ReviewVerificationSchema,
  SubmitVerificationSchema,
} from "../validators/moderation";
import { DisputeOrderSchema } from "../validators/order";
import { fail, ok, type Result } from "./result";

/**
 * Reviews, reports, disputes and seller verification.
 *
 * The permission checks here give staff and members a clear message early.
 * The database functions repeat them and are what actually enforces the rules,
 * and they write the audit log themselves.
 */

function reason(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export async function createReviewAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not permitted to submit reviews.");
  }
  const parsed = CreateReviewSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid review");
  }
  try {
    return ok(await createReview(await createDb(), parsed.data));
  } catch (err) {
    return fail("REVIEW_REFUSED", reason(err, "The review could not be saved."));
  }
}

export async function createReportAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not permitted to send reports.");
  }
  const parsed = CreateReportSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid report");
  }
  try {
    return ok(await createReport(await createDb(), parsed.data));
  } catch (err) {
    return fail("REPORT_REFUSED", reason(err, "The report could not be sent."));
  }
}

export async function resolveReportAction(
  user: SessionUser,
  reportId: string,
  rawInput: unknown,
): Promise<Result<{ status: string }>> {
  if (!can(user, "reports.manage")) {
    return fail("FORBIDDEN", "You do not have permission to moderate reports.");
  }
  if (!isUuid(reportId)) return fail("NOT_FOUND", "Report not found");
  const parsed = ResolveReportSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid resolution");
  }
  try {
    await resolveReport(
      await createDb(),
      reportId,
      parsed.data.status,
      parsed.data.resolutionNote,
      parsed.data.actionTaken,
    );
    return ok({ status: parsed.data.status });
  } catch (err) {
    return fail("REPORT_REFUSED", reason(err, "The report could not be updated."));
  }
}

/** A buyer or seller asks staff to step in on a paid order. */
export async function openDisputeAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ status: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not permitted to open disputes.");
  }
  const parsed = DisputeOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid dispute details");
  }
  try {
    await openDispute(await createDb(), parsed.data);
    return ok({ status: "disputed" });
  } catch (err) {
    return fail("DISPUTE_REFUSED", reason(err, "The dispute could not be opened."));
  }
}

/** Staff close a dispute by releasing the order to the seller or marking it for refund. */
export async function resolveDisputeAction(
  user: SessionUser,
  orderId: string,
  rawInput: unknown,
): Promise<Result<{ status: string }>> {
  if (!can(user, "disputes.manage")) {
    return fail("FORBIDDEN", "You do not have permission to resolve disputes.");
  }
  if (!isUuid(orderId)) return fail("NOT_FOUND", "Order not found");
  const parsed = ResolveDisputeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid outcome");
  }
  try {
    await resolveDispute(await createDb(), orderId, parsed.data.outcome, parsed.data.note);
    return ok({ status: parsed.data.outcome === "release" ? "completed" : "refunded" });
  } catch (err) {
    return fail("DISPUTE_REFUSED", reason(err, "The dispute could not be resolved."));
  }
}

export async function submitVendorVerificationAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not permitted to request verification.");
  }
  const parsed = SubmitVerificationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid verification details");
  }
  try {
    return ok(await submitVerification(await createDb(), parsed.data));
  } catch (err) {
    return fail("VERIFICATION_REFUSED", reason(err, "The request could not be submitted."));
  }
}

export async function reviewVendorVerificationAction(
  user: SessionUser,
  verificationId: string,
  rawInput: unknown,
): Promise<Result<{ status: string }>> {
  if (!can(user, "verifications.manage")) {
    return fail("FORBIDDEN", "You do not have permission to review verifications.");
  }
  if (!isUuid(verificationId)) return fail("NOT_FOUND", "Request not found");
  const parsed = ReviewVerificationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid decision");
  }
  try {
    await reviewVerificationRecord(
      await createDb(),
      verificationId,
      parsed.data.status,
      parsed.data.rejectionReason,
    );
    return ok({ status: parsed.data.status });
  } catch (err) {
    return fail("VERIFICATION_REFUSED", reason(err, "The request could not be reviewed."));
  }
}
