import "server-only";
import { createDb } from "@/lib/db/server";
import { canParticipate, canManage } from "@/server/policies/access";
import type { SessionUser } from "@/server/auth/session";
import {
  CreateRequestSchema,
  CreateQuoteSchema,
} from "../validators/request";
import {
  createBuyerRequest,
  getBuyerRequestById,
  submitQuote,
} from "../repositories/requests";
import { fail, ok, type Result } from "./result";

export async function createBuyerRequestAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not permitted to post buyer requests.");
  }

  const parsed = CreateRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid request information");
  }

  try {
    const db = await createDb();
    const created = await createBuyerRequest(db, user.userId, parsed.data);

    await db.rpc("write_audit_log", {
      p_action: "request.created",
      p_entity_type: "buyer_request",
      p_entity_id: created.id,
      p_metadata: { title: parsed.data.title, category: parsed.data.category },
    });

    return ok(created);
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to create buyer request");
  }
}

export async function submitQuoteAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not permitted to submit quotes.");
  }

  const parsed = CreateQuoteSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid quote information");
  }

  try {
    const db = await createDb();
    const request = await getBuyerRequestById(db, parsed.data.requestId);
    if (!request) {
      return fail("NOT_FOUND", "Buyer request not found.");
    }

    if (request.buyerId === user.userId) {
      return fail("INVALID_ACTION", "You cannot submit a quote to your own request.");
    }

    if (request.status !== "open" && request.status !== "receiving_offers") {
      return fail("INVALID_STATUS", "This request is no longer accepting quotes.");
    }

    const created = await submitQuote(db, user.userId, parsed.data);

    await db.rpc("write_audit_log", {
      p_action: "quote.submitted",
      p_entity_type: "quote",
      p_entity_id: created.id,
      p_metadata: { requestId: parsed.data.requestId, amountMajor: parsed.data.amountMajor },
    });

    return ok(created);
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to submit quote");
  }
}

export async function acceptQuoteAction(
  user: SessionUser,
  requestId: string,
  quoteId: string,
): Promise<Result<{ status: string }>> {
  try {
    const db = await createDb();
    const request = await getBuyerRequestById(db, requestId);
    if (!request) {
      return fail("NOT_FOUND", "Request not found.");
    }

    if (!canManage(user, { ownerId: request.buyerId, moderatePermission: "requests.moderate" })) {
      return fail("FORBIDDEN", "Only the buyer who posted the request can accept a quote.");
    }

    // Accept the quote and set others to rejected
    const { error: quoteErr } = await db
      .from("quotes")
      .update({ status: "accepted" })
      .eq("id", quoteId)
      .eq("request_id", requestId);

    if (quoteErr) throw new Error(quoteErr.message);

    // Reject other quotes
    await db
      .from("quotes")
      .update({ status: "rejected" })
      .eq("request_id", requestId)
      .neq("id", quoteId)
      .eq("status", "pending");

    // Update request status to accepted
    await db
      .from("buyer_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);

    await db.rpc("write_audit_log", {
      p_action: "quote.accepted",
      p_entity_type: "quote",
      p_entity_id: quoteId,
      p_metadata: { requestId },
    });

    return ok({ status: "accepted" });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to accept quote");
  }
}
