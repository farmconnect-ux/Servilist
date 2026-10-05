import "server-only";
import { createDb } from "@/lib/db/server";
import {
  DispatchDeliverySchema,
  AddTrackingEventSchema,
  type DispatchDeliveryInput,
  type AddTrackingEventInput,
} from "../validators/business";
import {
  createOrUpdateDelivery,
  getDeliveryByOrderId,
  addTrackingEvent,
  type DeliveryRecord,
} from "../repositories/deliveries";
import { getOrderById } from "../repositories/orders";

export async function dispatchOrderDeliveryAction(
  sellerId: string,
  orderId: string,
  rawInput: DispatchDeliveryInput,
): Promise<DeliveryRecord> {
  const input = DispatchDeliverySchema.parse(rawInput);
  const db = await createDb();

  const order = await getOrderById(db, orderId);
  if (!order) {
    throw new Error("Order not found");
  }
  if (order.sellerId !== sellerId) {
    throw new Error("Only the order seller can dispatch delivery");
  }

  return createOrUpdateDelivery(db, orderId, input);
}

export async function getOrderDeliveryAction(
  userId: string,
  orderId: string,
): Promise<DeliveryRecord | null> {
  const db = await createDb();

  const order = await getOrderById(db, orderId);
  if (!order) {
    throw new Error("Order not found");
  }
  if (order.buyerId !== userId && order.sellerId !== userId) {
    throw new Error("You do not have permission to view delivery for this order");
  }

  return getDeliveryByOrderId(db, orderId);
}

export async function updateDeliveryTrackingAction(
  sellerId: string,
  orderId: string,
  rawInput: AddTrackingEventInput,
): Promise<DeliveryRecord> {
  const input = AddTrackingEventSchema.parse(rawInput);
  const db = await createDb();

  const order = await getOrderById(db, orderId);
  if (!order) {
    throw new Error("Order not found");
  }
  if (order.sellerId !== sellerId) {
    throw new Error("Only the order seller can update tracking status");
  }

  return addTrackingEvent(db, orderId, input);
}
