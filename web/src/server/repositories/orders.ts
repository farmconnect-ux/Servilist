import "server-only";
import type { Db } from "@/lib/db/server";

/**
 * Orders, payments and the ledger are written only by database functions
 * (supabase/migrations/00015). Members can read their own rows and nothing
 * else, so everything here is either a read or a call to one of those
 * functions.
 */

export const ORDER_STATUSES = [
  "pending_payment",
  "in_escrow",
  "dispatched",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface ShippingAddress {
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  city: string;
  country: string;
}

interface Party {
  id: string;
  username: string;
  displayName: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  listingId: string | null;
  offerId: string | null;
  title: string;
  quantity: number;
  currency: string;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  buyerFeeMinor: number;
  totalMinor: number;
  status: OrderStatus;
  fulfillmentType: "delivery" | "pickup";
  shippingAddress: ShippingAddress | null;
  notes: string | null;
  paymentDueAt: string;
  paidAt: string | null;
  completedAt: string | null;
  createdAt: string;
  buyer: Party | null;
  seller: Party | null;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: string;
  reference: string;
  amountMinor: number;
  currency: string;
  status: "pending" | "successful" | "failed" | "abandoned" | "refund_due" | "refunded";
  failureReason: string | null;
  createdAt: string;
}

const ORDER_COLUMNS = `
  id, order_number, buyer_id, seller_id, listing_id, offer_id, title, quantity, currency,
  subtotal_minor, delivery_fee_minor, buyer_fee_minor, total_minor, status, fulfillment_type,
  shipping_address, notes, payment_due_at, paid_at, completed_at, created_at,
  buyer:profiles!buyer_id(id, username, display_name),
  seller:profiles!seller_id(id, username, display_name)
`;

const PAYMENT_COLUMNS =
  "id, order_id, provider, reference, amount_minor, currency, status, failure_reason, created_at";

type Row = Record<string, unknown>;

function one(value: unknown): Row | null {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === "object" ? (row as Row) : null;
}

function party(value: unknown): Party | null {
  const row = one(value);
  if (!row) return null;
  return {
    id: String(row.id),
    username: String(row.username ?? ""),
    displayName: String(row.display_name ?? "Member"),
  };
}

function text(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function mapOrder(row: Row): OrderRecord {
  const address = one(row.shipping_address);
  return {
    id: String(row.id),
    orderNumber: String(row.order_number),
    buyerId: String(row.buyer_id),
    sellerId: String(row.seller_id),
    listingId: text(row.listing_id),
    offerId: text(row.offer_id),
    title: String(row.title),
    quantity: Number(row.quantity ?? 1),
    currency: String(row.currency),
    subtotalMinor: Number(row.subtotal_minor),
    deliveryFeeMinor: Number(row.delivery_fee_minor),
    buyerFeeMinor: Number(row.buyer_fee_minor),
    totalMinor: Number(row.total_minor),
    status: row.status as OrderStatus,
    fulfillmentType: row.fulfillment_type === "delivery" ? "delivery" : "pickup",
    shippingAddress: address
      ? {
          recipientName: String(address.recipientName ?? ""),
          phoneNumber: String(address.phoneNumber ?? ""),
          addressLine: String(address.addressLine ?? ""),
          city: String(address.city ?? ""),
          country: String(address.country ?? ""),
        }
      : null,
    notes: text(row.notes),
    paymentDueAt: String(row.payment_due_at),
    paidAt: text(row.paid_at),
    completedAt: text(row.completed_at),
    createdAt: String(row.created_at),
    buyer: party(row.buyer),
    seller: party(row.seller),
  };
}

function mapPayment(row: Row): PaymentRecord {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    provider: String(row.provider),
    reference: String(row.reference),
    amountMinor: Number(row.amount_minor),
    currency: String(row.currency),
    status: row.status as PaymentRecord["status"],
    failureReason: text(row.failure_reason),
    createdAt: String(row.created_at),
  };
}

// --- Reads (row-level security limits these to the member's own orders) ---

export async function getOrderById(db: Db, id: string): Promise<OrderRecord | null> {
  const { data, error } = await db.from("orders").select(ORDER_COLUMNS).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapOrder(data as Row);
}

export async function listOrdersForUser(
  db: Db,
  userId: string,
  role: "buyer" | "seller" | "all" = "all",
): Promise<OrderRecord[]> {
  let query = db
    .from("orders")
    .select(ORDER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (role === "buyer") query = query.eq("buyer_id", userId);
  else if (role === "seller") query = query.eq("seller_id", userId);
  else query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load orders: ${error.message}`);
  return ((data ?? []) as Row[]).map(mapOrder);
}

export async function listPaymentsForOrder(db: Db, orderId: string): Promise<PaymentRecord[]> {
  const { data, error } = await db
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load payments: ${error.message}`);
  return ((data ?? []) as Row[]).map(mapPayment);
}

/** The buyer's handover code. Returns null for anyone else: the database hides it. */
export async function getHandoverCode(db: Db, orderId: string): Promise<string | null> {
  const { data } = await db
    .from("order_handover_codes")
    .select("code")
    .eq("order_id", orderId)
    .maybeSingle();
  return data?.code ? String(data.code) : null;
}

/** The buyer protection fee, as basis points of the item price. */
export async function getBuyerFeeBps(db: Db): Promise<number> {
  const { data } = await db
    .from("platform_settings")
    .select("value_int")
    .eq("key", "buyer_protection_fee_bps")
    .maybeSingle();
  return Number(data?.value_int ?? 0);
}

// --- Writes (each is one database function) ---

function unwrap<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function createOrder(
  db: Db,
  params: {
    listingId?: string;
    offerId?: string;
    fulfillmentType: "delivery" | "pickup";
    shippingAddress?: ShippingAddress;
    notes?: string;
  },
): Promise<string> {
  const id = unwrap(
    await db.rpc("create_order", {
      p_listing_id: params.offerId ? null : (params.listingId ?? null),
      p_offer_id: params.offerId ?? null,
      p_fulfillment_type: params.fulfillmentType,
      p_shipping_address: params.shippingAddress ?? null,
      p_notes: params.notes ?? null,
    }),
  );
  return String(id);
}

export async function startPayment(db: Db, orderId: string, provider: string): Promise<PaymentRecord> {
  const row = unwrap(await db.rpc("start_payment", { p_order_id: orderId, p_provider: provider }));
  return mapPayment(row as Row);
}

export type ConfirmOutcome =
  | "confirmed"
  | "already_confirmed"
  | "amount_mismatch"
  | "duplicate_refund_due"
  | "paid_after_close";

/** Server only: the secret proves the caller is the app server, not a member. */
export async function confirmPayment(
  db: Db,
  serverSecret: string,
  params: {
    reference: string;
    provider: string;
    amountMinor: number;
    currency: string;
    transactionId?: string;
    channel?: string;
  },
): Promise<ConfirmOutcome> {
  const outcome = unwrap(
    await db.rpc("confirm_payment", {
      p_server_secret: serverSecret,
      p_reference: params.reference,
      p_provider: params.provider,
      p_amount_minor: params.amountMinor,
      p_currency: params.currency,
      p_provider_transaction_id: params.transactionId ?? null,
      p_channel: params.channel ?? null,
    }),
  );
  return outcome as ConfirmOutcome;
}

export async function failPayment(
  db: Db,
  serverSecret: string,
  reference: string,
  reason?: string,
): Promise<void> {
  unwrap(
    await db.rpc("fail_payment", {
      p_server_secret: serverSecret,
      p_reference: reference,
      p_reason: reason ?? null,
    }),
  );
}

export async function setOrderStage(
  db: Db,
  orderId: string,
  stage: "dispatched" | "delivered",
): Promise<void> {
  unwrap(await db.rpc("set_order_stage", { p_order_id: orderId, p_stage: stage }));
}

/** True when the code matched and the order completed; false for a wrong code. */
export async function completeOrderWithCode(db: Db, orderId: string, code: string): Promise<boolean> {
  return Boolean(unwrap(await db.rpc("complete_order_with_code", { p_order_id: orderId, p_code: code })));
}

export async function cancelOrder(db: Db, orderId: string): Promise<void> {
  unwrap(await db.rpc("cancel_order", { p_order_id: orderId }));
}

/**
 * Kept so the auction settlement code (Sprint 7, still closed) compiles.
 * Orders can no longer be inserted from the app with caller-supplied totals;
 * auction orders will get their own database function when Sprint 7 is verified.
 */
export async function createOrderRecord(
  _db: Db,
  _params: {
    buyerId: string;
    sellerId: string;
    listingId?: string;
    currency: string;
    subtotalMinor: number;
    deliveryFeeMinor: number;
    escrowFeeMinor: number;
    totalMinor: number;
    fulfillmentType: "delivery" | "pickup";
    itemTitle: string;
    itemQuantity: number;
    notes?: string;
  },
): Promise<{ id: string }> {
  throw new Error("Auction orders are not open yet.");
}
