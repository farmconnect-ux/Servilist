import "server-only";
import { createDb } from "@/lib/db/server";
import { isUuid } from "@/lib/ids";
import type { SessionUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";
import { createService, createServiceBooking, setBookingStatus } from "../repositories/services";
import {
  BookingStatusSchema,
  CreateServiceBookingSchema,
  CreateServiceSchema,
} from "../validators/service";
import { fail, ok, type Result } from "./result";

/**
 * Services and bookings. A provider manages their own services under
 * row-level security; bookings go through database functions that take the
 * client from the session and the price from the service.
 */

function reason(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export async function createServiceAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string; slug: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not allowed to offer services.");
  }
  const parsed = CreateServiceSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid service details");
  }
  try {
    const db = await createDb();
    const service = await createService(db, user.userId, parsed.data);
    await db.rpc("write_audit_log", {
      p_action: "service.created",
      p_entity_type: "service",
      p_entity_id: service.id,
      p_metadata: { slug: service.slug },
    });
    return ok({ id: service.id, slug: service.slug });
  } catch (err) {
    return fail("SERVICE_REFUSED", reason(err, "The service could not be published."));
  }
}

export async function bookServiceAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not allowed to book services.");
  }
  const parsed = CreateServiceBookingSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid booking details");
  }
  try {
    return ok(await createServiceBooking(await createDb(), parsed.data));
  } catch (err) {
    return fail("BOOKING_REFUSED", reason(err, "The booking could not be made."));
  }
}

export async function setBookingStatusAction(
  user: SessionUser,
  bookingId: string,
  rawInput: unknown,
): Promise<Result<{ status: string }>> {
  if (!canParticipate(user)) return fail("FORBIDDEN", "Your account is restricted.");
  if (!isUuid(bookingId)) return fail("NOT_FOUND", "Booking not found");
  const parsed = BookingStatusSchema.safeParse(rawInput);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Unknown booking status");
  try {
    await setBookingStatus(await createDb(), bookingId, parsed.data.status);
    return ok({ status: parsed.data.status });
  } catch (err) {
    return fail("BOOKING_REFUSED", reason(err, "The booking could not be updated."));
  }
}
