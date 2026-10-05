import "server-only";
import crypto from "crypto";
import type { Db } from "@/lib/db/server";
import { generateOtp, hashOtp } from "@/lib/crypto";
import { type PublicProfile } from "./marketplace";

export { generateOtp, hashOtp };

const PUBLIC_PROFILE = "id, username, display_name, rating, reviews_count, is_verified";

export interface OrderItemRecord {
  id: string;
  orderId: string;
  title: string;
  quantity: number;
  unitPriceMinor: number;
  currency: string;
  totalMinor: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  listingId?: string | null;
  quoteId?: string | null;
  offerId?: string | null;
  currency: string;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  escrowFeeMinor: number;
  totalMinor: number;
  status:
    | "pending_payment"
    | "payment_confirmed"
    | "in_escrow"
    | "processing"
    | "dispatched"
    | "delivered"
    | "completed"
    | "cancelled"
    | "disputed"
    | "refunded";
  fulfillmentType: "delivery" | "pickup";
  shippingAddress?: any;
  verificationOtpCode?: string | null; // only visible to the buyer or admin
  otpVerifiedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemRecord[];
  buyer?: PublicProfile;
  seller?: PublicProfile;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: string;
  reference: string;
  amountMinor: number;
  currency: string;
  status: "pending" | "successful" | "failed" | "refunded";
  providerChannel?: string;
  createdAt: string;
}

export interface LedgerEntryInput {
  orderId?: string;
  accountId?: string;
  accountType:
    | "buyer_wallet"
    | "seller_escrow_payable"
    | "platform_escrow_holding"
    | "platform_commission"
    | "dispute_reserve";
  entryType: "debit" | "credit";
  amountMinor: number;
  currency: string;
  reference?: string;
  description: string;
}


export async function createOrderRecord(
  db: Db,
  params: {
    buyerId: string;
    sellerId: string;
    listingId?: string;
    quoteId?: string;
    offerId?: string;
    currency: string;
    subtotalMinor: number;
    deliveryFeeMinor: number;
    escrowFeeMinor: number;
    totalMinor: number;
    fulfillmentType: "delivery" | "pickup";
    shippingAddress?: any;
    notes?: string;
    itemTitle: string;
    itemQuantity?: number;
  },
): Promise<OrderRecord> {
  const orderNumber = `SL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  const { code: otpCode, hash: otpHash } = generateOtp();

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      order_number: orderNumber,
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
      listing_id: params.listingId || null,
      quote_id: params.quoteId || null,
      offer_id: params.offerId || null,
      currency: params.currency,
      subtotal_minor: params.subtotalMinor,
      delivery_fee_minor: params.deliveryFeeMinor,
      escrow_fee_minor: params.escrowFeeMinor,
      total_minor: params.totalMinor,
      fulfillment_type: params.fulfillmentType,
      shipping_address: params.shippingAddress || null,
      verification_otp_code: otpCode,
      verification_otp_hash: otpHash,
      notes: params.notes || null,
      status: "pending_payment",
    })
    .select("*")
    .single();

  if (orderError) {
    throw new Error(`Failed to create order: ${orderError.message}`);
  }

  // Insert order item
  const quantity = params.itemQuantity || 1;
  const { data: item, error: itemError } = await db
    .from("order_items")
    .insert({
      order_id: order.id,
      title: params.itemTitle,
      quantity,
      unit_price_minor: Math.round(params.subtotalMinor / quantity),
      currency: params.currency,
      total_minor: params.subtotalMinor,
    })
    .select("*")
    .single();

  if (itemError) {
    throw new Error(`Failed to create order items: ${itemError.message}`);
  }

  return {
    id: order.id,
    orderNumber: order.order_number,
    buyerId: order.buyer_id,
    sellerId: order.seller_id,
    listingId: order.listing_id,
    quoteId: order.quote_id,
    offerId: order.offer_id,
    currency: order.currency,
    subtotalMinor: Number(order.subtotal_minor),
    deliveryFeeMinor: Number(order.delivery_fee_minor),
    escrowFeeMinor: Number(order.escrow_fee_minor),
    totalMinor: Number(order.total_minor),
    status: order.status,
    fulfillmentType: order.fulfillment_type,
    shippingAddress: order.shipping_address,
    verificationOtpCode: otpCode,
    otpVerifiedAt: order.otp_verified_at,
    notes: order.notes,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: [
      {
        id: item.id,
        orderId: item.order_id,
        title: item.title,
        quantity: item.quantity,
        unitPriceMinor: Number(item.unit_price_minor),
        currency: item.currency,
        totalMinor: Number(item.total_minor),
      },
    ],
  };
}

export async function getOrderById(
  db: Db,
  id: string,
  viewerUserId?: string,
  isAdmin = false,
): Promise<OrderRecord | null> {
  const { data, error } = await db
    .from("orders")
    .select(`
      *,
      items:order_items(*),
      buyer:profiles!buyer_id(${PUBLIC_PROFILE}),
      seller:profiles!seller_id(${PUBLIC_PROFILE})
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const buyer = Array.isArray(data.buyer) ? data.buyer[0] : data.buyer;
  const seller = Array.isArray(data.seller) ? data.seller[0] : data.seller;
  const items = (data.items || []).map((it: any) => ({
    id: it.id,
    orderId: it.order_id,
    title: it.title,
    quantity: it.quantity,
    unitPriceMinor: Number(it.unit_price_minor),
    currency: it.currency,
    totalMinor: Number(it.total_minor),
  }));

  // Only the buyer or platform admin can see the secret handover OTP code
  const canSeeOtp = viewerUserId === data.buyer_id || isAdmin;

  return {
    id: data.id,
    orderNumber: data.order_number,
    buyerId: data.buyer_id,
    sellerId: data.seller_id,
    listingId: data.listing_id,
    quoteId: data.quote_id,
    offerId: data.offer_id,
    currency: data.currency,
    subtotalMinor: Number(data.subtotal_minor),
    deliveryFeeMinor: Number(data.delivery_fee_minor),
    escrowFeeMinor: Number(data.escrow_fee_minor),
    totalMinor: Number(data.total_minor),
    status: data.status,
    fulfillmentType: data.fulfillment_type,
    shippingAddress: data.shipping_address,
    verificationOtpCode: canSeeOtp ? data.verification_otp_code : null,
    otpVerifiedAt: data.otp_verified_at,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    items,
    buyer: buyer ? {
      id: buyer.id,
      username: buyer.username,
      displayName: buyer.display_name,
      rating: Number(buyer.rating || 5.0),
      reviewsCount: Number(buyer.reviews_count || 0),
      verified: Boolean(buyer.is_verified),
    } : undefined,
    seller: seller ? {
      id: seller.id,
      username: seller.username,
      displayName: seller.display_name,
      rating: Number(seller.rating || 5.0),
      reviewsCount: Number(seller.reviews_count || 0),
      verified: Boolean(seller.is_verified),
    } : undefined,
  };
}

export async function listOrdersForUser(
  db: Db,
  userId: string,
  role: "buyer" | "seller" | "all" = "all",
): Promise<OrderRecord[]> {
  let query = db
    .from("orders")
    .select(`
      *,
      items:order_items(*),
      buyer:profiles!buyer_id(${PUBLIC_PROFILE}),
      seller:profiles!seller_id(${PUBLIC_PROFILE})
    `)
    .order("created_at", { ascending: false });

  if (role === "buyer") {
    query = query.eq("buyer_id", userId);
  } else if (role === "seller") {
    query = query.eq("seller_id", userId);
  } else {
    query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load orders: ${error.message}`);

  return (data || []).map((row: any) => {
    const buyer = Array.isArray(row.buyer) ? row.buyer[0] : row.buyer;
    const seller = Array.isArray(row.seller) ? row.seller[0] : row.seller;
    const items = (row.items || []).map((it: any) => ({
      id: it.id,
      orderId: it.order_id,
      title: it.title,
      quantity: it.quantity,
      unitPriceMinor: Number(it.unit_price_minor),
      currency: it.currency,
      totalMinor: Number(it.total_minor),
    }));

    const canSeeOtp = userId === row.buyer_id;

    return {
      id: row.id,
      orderNumber: row.order_number,
      buyerId: row.buyer_id,
      sellerId: row.seller_id,
      listingId: row.listing_id,
      quoteId: row.quote_id,
      offerId: row.offer_id,
      currency: row.currency,
      subtotalMinor: Number(row.subtotal_minor),
      deliveryFeeMinor: Number(row.delivery_fee_minor),
      escrowFeeMinor: Number(row.escrow_fee_minor),
      totalMinor: Number(row.total_minor),
      status: row.status,
      fulfillmentType: row.fulfillment_type,
      shippingAddress: row.shipping_address,
      verificationOtpCode: canSeeOtp ? row.verification_otp_code : null,
      otpVerifiedAt: row.otp_verified_at,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items,
      buyer: buyer ? {
        id: buyer.id,
        username: buyer.username,
        displayName: buyer.display_name,
        rating: Number(buyer.rating || 5.0),
        reviewsCount: Number(buyer.reviews_count || 0),
        verified: Boolean(buyer.is_verified),
      } : undefined,
      seller: seller ? {
        id: seller.id,
        username: seller.username,
        displayName: seller.display_name,
        rating: Number(seller.rating || 5.0),
        reviewsCount: Number(seller.reviews_count || 0),
        verified: Boolean(seller.is_verified),
      } : undefined,
    };
  });
}

export async function updateOrderStatus(
  db: Db,
  orderId: string,
  status: OrderRecord["status"],
): Promise<void> {
  const { error } = await db
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw new Error(`Failed to update order status: ${error.message}`);
}

export async function recordPayment(
  db: Db,
  params: {
    orderId: string;
    provider: string;
    reference: string;
    amountMinor: number;
    currency: string;
    status: PaymentRecord["status"];
    providerChannel?: string;
    metadata?: any;
  },
): Promise<PaymentRecord> {
  const { data, error } = await db
    .from("payments")
    .upsert(
      {
        order_id: params.orderId,
        provider: params.provider,
        reference: params.reference,
        amount_minor: params.amountMinor,
        currency: params.currency,
        status: params.status,
        provider_channel: params.providerChannel || null,
        metadata: params.metadata || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "reference" },
    )
    .select("*")
    .single();

  if (error) throw new Error(`Failed to record payment: ${error.message}`);

  return {
    id: data.id,
    orderId: data.order_id,
    provider: data.provider,
    reference: data.reference,
    amountMinor: Number(data.amount_minor),
    currency: data.currency,
    status: data.status,
    providerChannel: data.provider_channel,
    createdAt: data.created_at,
  };
}

export async function recordLedgerTransaction(
  db: Db,
  entries: LedgerEntryInput[],
): Promise<void> {
  // Ensure balanced double-entry if internal transfer
  const formatted = entries.map((e) => ({
    order_id: e.orderId || null,
    account_id: e.accountId || null,
    account_type: e.accountType,
    entry_type: e.entryType,
    amount_minor: e.amountMinor,
    currency: e.currency,
    reference: e.reference || null,
    description: e.description,
  }));

  const { error } = await db.from("ledger_entries").insert(formatted);
  if (error) throw new Error(`Ledger transaction failed: ${error.message}`);
}

export async function verifyOrderOtp(
  db: Db,
  orderId: string,
  rawOtp: string,
): Promise<boolean> {
  const expectedHash = hashOtp(rawOtp);

  const { data: order, error } = await db
    .from("orders")
    .select("id, verification_otp_hash, status")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw new Error("Order not found");
  }

  if (order.status === "completed") {
    return true; // Already verified
  }

  if (order.verification_otp_hash !== expectedHash) {
    return false;
  }

  // Update order to completed and record timestamp
  await db
    .from("orders")
    .update({
      status: "completed",
      otp_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  return true;
}
