import "server-only";
import { createDb } from "@/lib/db/server";
import { isUuid } from "@/lib/ids";
import type { SessionUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";
import {
  addDeliveryUpdate,
  getDeliveryByOrderId,
  recordDispatch,
  type DeliveryRecord,
} from "../repositories/deliveries";
import { DeliveryUpdateSchema, DispatchSchema } from "../validators/business";
import { fail, ok, type Result } from "./result";

/**
 * Delivery workflows. The database checks that the caller is the order's
 * seller, that the buyer chose delivery, and that steps only move forward.
 */

function reason(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Row-level security returns a delivery only to the order's buyer, its seller or staff. */
export async function getOrderDeliveryAction(orderId: string): Promise<Result<DeliveryRecord | null>> {
  if (!isUuid(orderId)) return fail("NOT_FOUND", "Order not found");
  return ok(await getDeliveryByOrderId(await createDb(), orderId));
}

export async function dispatchOrderAction(
  user: SessionUser,
  orderId: string,
  rawInput: unknown,
): Promise<Result<{ dispatched: true }>> {
  if (!canParticipate(user)) return fail("FORBIDDEN", "Your account is restricted.");
  if (!isUuid(orderId)) return fail("NOT_FOUND", "Order not found");
  const parsed = DispatchSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Check the delivery details");
  }
  try {
    await recordDispatch(await createDb(), orderId, parsed.data);
    return ok({ dispatched: true });
  } catch (err) {
    return fail("DELIVERY_REFUSED", reason(err, "The order could not be dispatched."));
  }
}

export async function updateDeliveryAction(
  user: SessionUser,
  orderId: string,
  rawInput: unknown,
): Promise<Result<{ updated: true }>> {
  if (!canParticipate(user)) return fail("FORBIDDEN", "Your account is restricted.");
  if (!isUuid(orderId)) return fail("NOT_FOUND", "Order not found");
  const parsed = DeliveryUpdateSchema.safeParse(rawInput);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Choose the next delivery step");
  try {
    await addDeliveryUpdate(await createDb(), orderId, parsed.data);
    return ok({ updated: true });
  } catch (err) {
    return fail("DELIVERY_REFUSED", reason(err, "The delivery could not be updated."));
  }
}
