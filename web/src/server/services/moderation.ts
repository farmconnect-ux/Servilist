import "server-only";
import { createDb } from "@/lib/db/server";
import { canParticipate } from "@/server/policies/access";
import type { SessionUser } from "@/server/auth/session";
import {
  CreateReviewSchema,
  CreateReportSchema,
  ResolveReportSchema,
  SubmitVerificationSchema,
  ReviewVerificationSchema,
} from "../validators/moderation";
import {
  createReview,
  createReport,
  resolveReport,
  submitVerification,
  reviewVerificationRecord,
} from "../repositories/moderation";
import { getOrderById } from "../repositories/orders";
import { fail, ok, type Result } from "./result";

export async function createReviewAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not permitted to submit reviews.");
  }

  const parsed = CreateReviewSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid review data");
  }

  try {
    const db = await createDb();
    const order = await getOrderById(db, parsed.data.orderId);
    if (!order) return fail("NOT_FOUND", "Order not found");

    if (order.status !== "completed") {
      return fail("INVALID_STATUS", "Reviews can only be submitted after order completion and delivery verification");
    }

    const isBuyer = order.buyerId === user.userId;
    const isSeller = order.sellerId === user.userId;

    if (!isBuyer && !isSeller) {
      return fail("FORBIDDEN", "You are not a participant in this order");
    }

    const revieweeId = isBuyer ? order.sellerId : order.buyerId;

    const review = await createReview(db, {
      orderId: order.id,
      reviewerId: user.userId,
      revieweeId,
      listingId: order.listingId || undefined,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    await db.rpc("write_audit_log", {
      p_action: "review.created",
      p_entity_type: "review",
      p_entity_id: review.id,
      p_metadata: { orderId: order.id, rating: parsed.data.rating },
    });

    return ok({ id: review.id });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to submit review");
  }
}

export async function createReportAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not permitted to submit moderation reports.");
  }

  const parsed = CreateReportSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid report parameters");
  }

  try {
    const db = await createDb();
    const report = await createReport(db, {
      reporterId: user.userId,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
      description: parsed.data.description,
    });

    await db.rpc("write_audit_log", {
      p_action: "report.created",
      p_entity_type: "report",
      p_entity_id: report.id,
      p_metadata: { targetType: parsed.data.targetType, reason: parsed.data.reason },
    });

    return ok({ id: report.id });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to submit report");
  }
}

export async function resolveReportAction(
  user: SessionUser,
  reportId: string,
  rawInput: unknown,
): Promise<Result<{ status: string }>> {
  if (!user.permissions.includes("reports.manage") && !user.roles.includes("admin")) {
    return fail("FORBIDDEN", "You do not have permission to moderate reports.");
  }

  const parsed = ResolveReportSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid resolution parameters");
  }

  try {
    const db = await createDb();
    await resolveReport(
      db,
      reportId,
      user.userId,
      parsed.data.status,
      parsed.data.resolutionNote,
    );

    await db.rpc("write_audit_log", {
      p_action: "report.resolved",
      p_entity_type: "report",
      p_entity_id: reportId,
      p_metadata: { status: parsed.data.status, actionTaken: parsed.data.actionTaken },
    });

    return ok({ status: parsed.data.status });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to resolve report");
  }
}

export async function submitVendorVerificationAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not permitted to submit verifications.");
  }

  const parsed = SubmitVerificationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid verification document details");
  }

  try {
    const db = await createDb();
    const verif = await submitVerification(db, user.userId, parsed.data);

    await db.rpc("write_audit_log", {
      p_action: "verification.submitted",
      p_entity_type: "vendor_verification",
      p_entity_id: verif.id,
      p_metadata: { businessName: parsed.data.businessName },
    });

    return ok({ id: verif.id });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to submit vendor verification");
  }
}

export async function reviewVendorVerificationAction(
  user: SessionUser,
  verificationId: string,
  rawInput: unknown,
): Promise<Result<{ status: string }>> {
  if (!user.permissions.includes("verifications.manage") && !user.roles.includes("admin")) {
    return fail("FORBIDDEN", "You do not have permission to approve/reject vendor verifications.");
  }

  const parsed = ReviewVerificationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid review parameters");
  }

  try {
    const db = await createDb();
    await reviewVerificationRecord(
      db,
      verificationId,
      user.userId,
      parsed.data.status,
      parsed.data.rejectionReason,
    );

    await db.rpc("write_audit_log", {
      p_action: `verification.${parsed.data.status}`,
      p_entity_type: "vendor_verification",
      p_entity_id: verificationId,
      p_metadata: { status: parsed.data.status },
    });

    return ok({ status: parsed.data.status });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to review verification");
  }
}
