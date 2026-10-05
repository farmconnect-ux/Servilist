import "server-only";
import type { Db } from "@/lib/db/server";
import type { DeliveryStep, DeliveryUpdateInput, DispatchInput } from "../validators/business";

/**
 * Deliveries. Servilist has no courier integration: a delivery is what the
 * seller reports about a parcel. The buyer and seller of the order can read
 * it; it changes only through record_dispatch() and add_delivery_update()
 * (supabase/migrations/00019), which move the order through its stages.
 */

export interface DeliveryEvent {
  id: string;
  status: DeliveryStep;
  note: string | null;
  createdAt: string;
}

export interface DeliveryRecord {
  id: string;
  orderId: string;
  carrierName: string;
  trackingCode: string | null;
  estimatedDeliveryAt: string | null;
  status: DeliveryStep;
  events: DeliveryEvent[];
}

type Row = Record<string, unknown>;

export async function getDeliveryByOrderId(db: Db, orderId: string): Promise<DeliveryRecord | null> {
  const { data, error } = await db
    .from("deliveries")
    .select(
      "id, order_id, carrier_name, tracking_code, estimated_delivery_at, status, events:delivery_events(id, status, note, created_at)",
    )
    .eq("order_id", orderId)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as Row;
  const events = ((row.events ?? []) as Row[])
    .map((event) => ({
      id: String(event.id),
      status: String(event.status) as DeliveryStep,
      note: event.note ? String(event.note) : null,
      createdAt: String(event.created_at),
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    id: String(row.id),
    orderId: String(row.order_id),
    carrierName: String(row.carrier_name),
    trackingCode: row.tracking_code ? String(row.tracking_code) : null,
    estimatedDeliveryAt: row.estimated_delivery_at ? String(row.estimated_delivery_at) : null,
    status: String(row.status) as DeliveryStep,
    events,
  };
}

export async function recordDispatch(db: Db, orderId: string, input: DispatchInput): Promise<void> {
  const { error } = await db.rpc("record_dispatch", {
    p_order_id: orderId,
    p_carrier_name: input.carrierName,
    p_tracking_code: input.trackingCode ?? null,
    p_estimated_delivery_at: input.estimatedDeliveryAt ?? null,
    p_note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function addDeliveryUpdate(db: Db, orderId: string, input: DeliveryUpdateInput): Promise<void> {
  const { error } = await db.rpc("add_delivery_update", {
    p_order_id: orderId,
    p_status: input.status,
    p_note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
}
