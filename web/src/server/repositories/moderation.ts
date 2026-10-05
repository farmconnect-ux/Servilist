import "server-only";
import type { Db } from "@/lib/db/server";
import { type PublicProfile } from "./marketplace";
import type { SubmitVerificationInput } from "../validators/moderation";

const PUBLIC_PROFILE = "id, username, display_name, rating, reviews_count, is_verified";

/**
 * Reviews, reports, disputes and verifications are written only by database
 * functions (supabase/migrations/00016). The functions take the member from
 * the session and check staff permissions themselves.
 */
function unwrap<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export interface ReviewRecord {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  listingId?: string | null;
  rating: number;
  comment?: string | null;
  status: string;
  createdAt: string;
  reviewer?: PublicProfile;
}

export interface ReportRecord {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string | null;
  status: string;
  /** A dispute on a paid order: closed by releasing or refunding the order. */
  isDispute?: boolean;
  actionTaken?: string | null;
  resolvedBy?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  reporter?: PublicProfile;
}

export interface VerificationRecord {
  id: string;
  vendorId: string;
  businessName: string;
  registrationNumber?: string | null;
  taxId?: string | null;
  documentUrl?: string | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  vendor?: PublicProfile;
}

export interface PlatformOverviewStats {
  totalGmvMinor: number;
  totalOrders: number;
  activeOrders: number;
  totalUsers: number;
  totalListings: number;
  pendingReports: number;
  pendingVerifications: number;
}

/** The database works out who is being reviewed from the order. */
export async function createReview(
  db: Db,
  params: { orderId: string; rating: number; comment?: string },
): Promise<{ id: string }> {
  const id = unwrap(
    await db.rpc("submit_review", {
      p_order_id: params.orderId,
      p_rating: params.rating,
      p_comment: params.comment ?? null,
    }),
  );
  return { id: String(id) };
}

/** Staff only: hide or restore a review. */
export async function moderateReview(
  db: Db,
  reviewId: string,
  status: "published" | "hidden",
): Promise<void> {
  unwrap(await db.rpc("moderate_review", { p_review_id: reviewId, p_status: status }));
}

export async function listReviewsForProfile(
  db: Db,
  profileId: string,
): Promise<ReviewRecord[]> {
  const { data, error } = await db
    .from("reviews")
    .select(`
      *,
      reviewer:profiles!reviewer_id(${PUBLIC_PROFILE})
    `)
    .eq("reviewee_id", profileId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load reviews: ${error.message}`);

  return (data || []).map((row: any) => {
    const rev = Array.isArray(row.reviewer) ? row.reviewer[0] : row.reviewer;
    return {
      id: row.id,
      orderId: row.order_id,
      reviewerId: row.reviewer_id,
      revieweeId: row.reviewee_id,
      listingId: row.listing_id,
      rating: row.rating,
      comment: row.comment,
      status: row.status,
      createdAt: row.created_at,
      reviewer: rev ? {
        id: rev.id,
        username: rev.username,
        displayName: rev.display_name,
        rating: Number(rev.rating || 5.0),
        reviewsCount: Number(rev.reviews_count || 0),
        verified: Boolean(rev.is_verified),
      } : undefined,
    };
  });
}

export async function createReport(
  db: Db,
  params: { targetType: string; targetId: string; reason: string; description?: string },
): Promise<{ id: string }> {
  const id = unwrap(
    await db.rpc("file_report", {
      p_target_type: params.targetType,
      p_target_id: params.targetId,
      p_reason: params.reason,
      p_description: params.description ?? null,
    }),
  );
  return { id: String(id) };
}

export async function listReports(
  db: Db,
  params: { status?: string; targetType?: string; limit?: number } = {},
): Promise<ReportRecord[]> {
  let query = db
    .from("reports")
    .select(`
      *,
      reporter:profiles!reporter_id(${PUBLIC_PROFILE})
    `)
    .order("created_at", { ascending: false })
    .limit(params.limit || 50);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.targetType && params.targetType !== "all") {
    query = query.eq("target_type", params.targetType);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load reports: ${error.message}`);

  return (data || []).map((row: any) => {
    const rep = Array.isArray(row.reporter) ? row.reporter[0] : row.reporter;
    return {
      id: row.id,
      reporterId: row.reporter_id,
      targetType: row.target_type,
      targetId: row.target_id,
      reason: row.reason,
      description: row.description,
      status: row.status,
      isDispute: Boolean(row.is_dispute),
      actionTaken: row.action_taken,
      resolvedBy: row.resolved_by,
      resolutionNote: row.resolution_note,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      reporter: rep ? {
        id: rep.id,
        username: rep.username,
        displayName: rep.display_name,
        rating: Number(rep.rating || 5.0),
        reviewsCount: Number(rep.reviews_count || 0),
        verified: Boolean(rep.is_verified),
      } : undefined,
    };
  });
}

/** Staff only. "hide_target" removes a reported listing or hides a reported review. */
export async function resolveReport(
  db: Db,
  reportId: string,
  status: "under_review" | "resolved" | "dismissed",
  resolutionNote?: string,
  action: "none" | "hide_target" = "none",
): Promise<void> {
  unwrap(
    await db.rpc("resolve_report", {
      p_report_id: reportId,
      p_status: status,
      p_note: resolutionNote ?? null,
      p_action: action,
    }),
  );
}

/** A party to a paid order asks staff to step in. */
export async function openDispute(
  db: Db,
  params: { orderId: string; reason: string; description: string },
): Promise<{ id: string }> {
  const id = unwrap(
    await db.rpc("open_dispute", {
      p_order_id: params.orderId,
      p_reason: params.reason,
      p_description: params.description,
    }),
  );
  return { id: String(id) };
}

/** Staff only: release the order to the seller, or mark it for refund to the buyer. */
export async function resolveDispute(
  db: Db,
  orderId: string,
  outcome: "release" | "refund",
  note?: string,
): Promise<void> {
  unwrap(
    await db.rpc("resolve_dispute", {
      p_order_id: orderId,
      p_outcome: outcome,
      p_note: note ?? null,
    }),
  );
}

export async function submitVerification(
  db: Db,
  input: SubmitVerificationInput,
): Promise<{ id: string }> {
  const id = unwrap(
    await db.rpc("submit_verification", {
      p_business_name: input.businessName,
      p_registration_number: input.registrationNumber ?? null,
      p_tax_id: input.taxId ?? null,
      p_document_url: input.documentUrl ?? null,
    }),
  );
  return { id: String(id) };
}

export async function listVerifications(
  db: Db,
  status?: string,
): Promise<VerificationRecord[]> {
  let query = db
    .from("vendor_verifications")
    .select(`
      *,
      vendor:profiles!vendor_id(${PUBLIC_PROFILE})
    `)
    .order("submitted_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load verifications: ${error.message}`);

  return (data || []).map((row: any) => {
    const v = Array.isArray(row.vendor) ? row.vendor[0] : row.vendor;
    return {
      id: row.id,
      vendorId: row.vendor_id,
      businessName: row.business_name,
      registrationNumber: row.registration_number,
      taxId: row.tax_id,
      documentUrl: row.document_url,
      status: row.status,
      rejectionReason: row.rejection_reason,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      vendor: v ? {
        id: v.id,
        username: v.username,
        displayName: v.display_name,
        rating: Number(v.rating || 5.0),
        reviewsCount: Number(v.reviews_count || 0),
        verified: Boolean(v.is_verified),
      } : undefined,
    };
  });
}

/** Staff only. Approving sets the member's verified badge inside the database. */
export async function reviewVerificationRecord(
  db: Db,
  verificationId: string,
  status: "approved" | "rejected",
  rejectionReason?: string,
): Promise<void> {
  unwrap(
    await db.rpc("review_verification", {
      p_verification_id: verificationId,
      p_approve: status === "approved",
      p_reason: rejectionReason ?? null,
    }),
  );
}

export async function getPlatformOverviewStats(db: Db): Promise<PlatformOverviewStats> {
  const [ordersRes, usersRes, listingsRes, reportsRes, verifsRes] = await Promise.all([
    db.from("orders").select("total_minor, status"),
    db.from("profiles").select("id", { count: "exact" }),
    db.from("listings").select("id", { count: "exact" }).eq("status", "active"),
    db.from("reports").select("id", { count: "exact" }).eq("status", "pending"),
    db.from("vendor_verifications").select("id", { count: "exact" }).eq("status", "pending"),
  ]);

  const orders = ordersRes.data || [];
  const completedOrders = orders.filter((o) => o.status === "completed");
  const activeOrders = orders.filter(
    (o) => o.status === "in_escrow" || o.status === "dispatched" || o.status === "delivered",
  );

  const totalGmvMinor = completedOrders.reduce((sum, o) => sum + Number(o.total_minor || 0), 0);

  return {
    totalGmvMinor,
    totalOrders: orders.length,
    activeOrders: activeOrders.length,
    totalUsers: usersRes.count || 0,
    totalListings: listingsRes.count || 0,
    pendingReports: reportsRes.count || 0,
    pendingVerifications: verifsRes.count || 0,
  };
}

/** True when the member has already reviewed this order. */
export async function hasReviewedOrder(db: Db, orderId: string, userId: string): Promise<boolean> {
  const { data } = await db
    .from("reviews")
    .select("id")
    .eq("order_id", orderId)
    .eq("reviewer_id", userId)
    .maybeSingle();
  return Boolean(data);
}
