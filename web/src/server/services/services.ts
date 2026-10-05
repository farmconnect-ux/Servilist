import "server-only";
import { createDb } from "@/lib/db/server";
import { canParticipate } from "@/server/policies/access";
import type { SessionUser } from "@/server/auth/session";
import {
  CreateServiceSchema,
  CreateServiceBookingSchema,
} from "../validators/service";
import {
  createService,
  getServiceById,
  createServiceBooking,
} from "../repositories/services";
import { fail, ok, type Result } from "./result";

export async function createServiceAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string; slug: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not allowed to create services.");
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
      p_metadata: { slug: service.slug, title: service.title },
    });

    return ok({ id: service.id, slug: service.slug });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to create service");
  }
}

export async function bookServiceAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string; bookingNumber: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not allowed to book services.");
  }

  const parsed = CreateServiceBookingSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid booking details");
  }

  try {
    const db = await createDb();
    const service = await getServiceById(db, parsed.data.serviceId);
    if (!service) return fail("NOT_FOUND", "Service offering not found");

    if (service.providerId === user.userId) {
      return fail("INVALID_ACTION", "You cannot hire or book your own service");
    }

    if (service.status !== "active") {
      return fail("INVALID_STATUS", "This service is currently unavailable");
    }

    const booking = await createServiceBooking(
      db,
      user.userId,
      service.providerId,
      parsed.data,
    );

    await db.rpc("write_audit_log", {
      p_action: "service.booked",
      p_entity_type: "service_booking",
      p_entity_id: booking.id,
      p_metadata: { bookingNumber: booking.bookingNumber, amountMinor: booking.amountMinor },
    });

    return ok({ id: booking.id, bookingNumber: booking.bookingNumber });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to book service");
  }
}
