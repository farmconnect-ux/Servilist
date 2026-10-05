import "server-only";
import type { Db } from "@/lib/db/server";
import { type PublicProfile } from "./marketplace";
import type { SubmitVerificationInput } from "../validators/moderation";

const PUBLIC_PROFILE = "id, username, display_name, rating, reviews_count, is_verified";

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

export async function createReview(
  db: Db,
  params: {
    orderId: string;
    reviewerId: string;
    revieweeId: string;
    listingId?: string;
    rating: number;
    comment?: string;
  },
): Promise<ReviewRecord> {
  const { data, error } = await db
    .from("reviews")
    .insert({
      order_id: params.orderId,
      reviewer_id: params.reviewerId,
      reviewee_id: params.revieweeId,
      listing_id: params.listingId || null,
      rating: params.rating,
      comment: params.comment || null,
      status: "published",
    })
    .select(`
      *,
      reviewer:profiles!reviewer_id(${PUBLIC_PROFILE})
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create review: ${error.message}`);
  }

  const rev = Array.isArray(data.reviewer) ? data.reviewer[0] : data.reviewer;

  return {
    id: data.id,
    orderId: data.order_id,
    reviewerId: data.reviewer_id,
    revieweeId: data.reviewee_id,
    listingId: data.listing_id,
    rating: data.rating,
    comment: data.comment,
    status: data.status,
    createdAt: data.created_at,
    reviewer: rev ? {
      id: rev.id,
      username: rev.username,
      displayName: rev.display_name,
      rating: Number(rev.rating || 5.0),
      reviewsCount: Number(rev.reviews_count || 0),
      verified: Boolean(rev.is_verified),
    } : undefined,
  };
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
  params: {
    reporterId: string;
    targetType: string;
    targetId: string;
    reason: string;
    description?: string;
  },
): Promise<ReportRecord> {
  const { data, error } = await db
    .from("reports")
    .insert({
      reporter_id: params.reporterId,
      target_type: params.targetType,
      target_id: params.targetId,
      reason: params.reason,
      description: params.description || null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to submit report: ${error.message}`);

  return {
    id: data.id,
    reporterId: data.reporter_id,
    targetType: data.target_type,
    targetId: data.target_id,
    reason: data.reason,
    description: data.description,
    status: data.status,
    createdAt: data.created_at,
  };
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

export async function resolveReport(
  db: Db,
  reportId: string,
  resolvedBy: string,
  status: "under_review" | "resolved" | "dismissed",
  resolutionNote?: string,
): Promise<void> {
  const { error } = await db
    .from("reports")
    .update({
      status,
      resolved_by: resolvedBy,
      resolution_note: resolutionNote || null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) throw new Error(`Failed to resolve report: ${error.message}`);
}

export async function submitVerification(
  db: Db,
  vendorId: string,
  input: SubmitVerificationInput,
): Promise<VerificationRecord> {
  const { data, error } = await db
    .from("vendor_verifications")
    .insert({
      vendor_id: vendorId,
      business_name: input.businessName,
      registration_number: input.registrationNumber || null,
      tax_id: input.taxId || null,
      document_url: input.documentUrl,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to submit verification: ${error.message}`);

  return {
    id: data.id,
    vendorId: data.vendor_id,
    businessName: data.business_name,
    registrationNumber: data.registration_number,
    taxId: data.tax_id,
    documentUrl: data.document_url,
    status: data.status,
    submittedAt: data.submitted_at,
  };
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

export async function reviewVerificationRecord(
  db: Db,
  verificationId: string,
  reviewerId: string,
  status: "approved" | "rejected",
  rejectionReason?: string,
): Promise<void> {
  const { data: v, error: vErr } = await db
    .from("vendor_verifications")
    .update({
      status,
      rejection_reason: rejectionReason || null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", verificationId)
    .select("vendor_id")
    .single();

  if (vErr || !v) throw new Error(`Failed to update verification: ${vErr?.message}`);

  if (status === "approved") {
    // Mark profile as verified!
    await db
      .from("profiles")
      .update({ is_verified: true, updated_at: new Date().toISOString() })
      .eq("id", v.vendor_id);
  }
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
    (o) => o.status === "in_escrow" || o.status === "processing" || o.status === "dispatched",
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
