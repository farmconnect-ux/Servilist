import "server-only";
import type { Db } from "@/lib/db/server";
import type {
  DispatchDeliveryInput,
  AddTrackingEventInput,
} from "../validators/business";

export interface TrackingEvent {
  status: string;
  location?: string;
  description: string;
  timestamp: string;
}

export interface DeliveryRecord {
  id: string;
  orderId: string;
  courierProvider: string;
  trackingCode?: string | null;
  status:
    | "pending"
    | "assigned"
    | "picked_up"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "failed"
    | "returned";
  senderAddress?: any;
  recipientAddress?: any;
  estimatedDeliveryAt?: string | null;
  deliveredAt?: string | null;
  proofOfDeliveryUrl?: string | null;
  trackingEvents: TrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

function mapDeliveryRow(row: any): DeliveryRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    courierProvider: row.courier_provider,
    trackingCode: row.tracking_code,
    status: row.status,
    senderAddress: row.sender_address,
    recipientAddress: row.recipient_address,
    estimatedDeliveryAt: row.estimated_delivery_at,
    deliveredAt: row.delivered_at,
    proofOfDeliveryUrl: row.proof_of_delivery_url,
    trackingEvents: (row.tracking_events || []) as TrackingEvent[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getDeliveryByOrderId(
  db: Db,
  orderId: string,
): Promise<DeliveryRecord | null> {
  const { data, error } = await db
    .from("deliveries")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error || !data) return null;
  return mapDeliveryRow(data);
}

export async function createOrUpdateDelivery(
  db: Db,
  orderId: string,
  input: DispatchDeliveryInput,
): Promise<DeliveryRecord> {
  const initialEvent: TrackingEvent = {
    status: "assigned",
    description: `Courier ${input.courierProvider.replace("_", " ").toUpperCase()} assigned to order`,
    timestamp: new Date().toISOString(),
  };

  const { data: existing } = await db
    .from("deliveries")
    .select("id, tracking_events")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing) {
    const updatedEvents = [...((existing.tracking_events as any) || []), initialEvent];
    const { data, error } = await db
      .from("deliveries")
      .update({
        courier_provider: input.courierProvider,
        tracking_code: input.trackingCode || null,
        estimated_delivery_at: input.estimatedDeliveryAt || null,
        status: "assigned",
        tracking_events: updatedEvents,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update delivery: ${error.message}`);
    }
    return mapDeliveryRow(data);
  }

  const { data, error } = await db
    .from("deliveries")
    .insert({
      order_id: orderId,
      courier_provider: input.courierProvider,
      tracking_code: input.trackingCode || null,
      estimated_delivery_at: input.estimatedDeliveryAt || null,
      sender_address: input.senderAddress || null,
      recipient_address: input.recipientAddress || null,
      status: "assigned",
      tracking_events: [initialEvent],
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create delivery: ${error.message}`);
  }

  // Also update order status to dispatched
  await db
    .from("orders")
    .update({ status: "dispatched", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  return mapDeliveryRow(data);
}

export async function addTrackingEvent(
  db: Db,
  orderId: string,
  input: AddTrackingEventInput,
): Promise<DeliveryRecord> {
  const existing = await getDeliveryByOrderId(db, orderId);
  if (!existing) {
    throw new Error("Delivery record not found for this order");
  }

  const newEvent: TrackingEvent = {
    status: input.status,
    location: input.location,
    description: input.description,
    timestamp: new Date().toISOString(),
  };

  const updatedEvents = [...existing.trackingEvents, newEvent];
  const updatePayload: any = {
    status: input.status,
    tracking_events: updatedEvents,
    updated_at: new Date().toISOString(),
  };

  if (input.proofOfDeliveryUrl) {
    updatePayload.proof_of_delivery_url = input.proofOfDeliveryUrl;
  }
  if (input.status === "delivered") {
    updatePayload.delivered_at = new Date().toISOString();
  }

  const { data, error } = await db
    .from("deliveries")
    .update(updatePayload)
    .eq("order_id", orderId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to add tracking event: ${error.message}`);
  }

  if (input.status === "delivered") {
    await db
      .from("orders")
      .update({ status: "delivered", updated_at: new Date().toISOString() })
      .eq("id", orderId);
  }

  return mapDeliveryRow(data);
}
