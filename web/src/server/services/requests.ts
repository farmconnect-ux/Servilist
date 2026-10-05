import "server-only";
import { createDb } from "@/lib/db/server";
import { canParticipate } from "@/server/policies/access";
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

    if (request.status !== "open") {
      return fail("INVALID_STATUS", "This request is no longer accepting quotes.");
    }

    const created = await submitQuote(db, user.userId, parsed.data, request.currency);

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

    if (request.buyerId !== user.userId) {
      return fail("FORBIDDEN", "Only the buyer who posted the request can accept a quote.");
    }

    // The database function checks the buyer, closes the other quotes and
    // marks the request matched, all in one transaction.
    const { error: quoteErr } = await db.rpc("accept_quote", { p_quote_id: quoteId });
    if (quoteErr) throw new Error(quoteErr.message);

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
