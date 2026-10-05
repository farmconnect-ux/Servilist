import "server-only";
import { createDb } from "@/lib/db/server";
import { canParticipate, canManage } from "@/server/policies/access";
import type { SessionUser } from "@/server/auth/session";
import {
  CreateOrderSchema,
  ConfirmDeliveryOtpSchema,
  DisputeOrderSchema,
} from "../validators/order";
import {
  createOrderRecord,
  getOrderById,
  updateOrderStatus,
  recordPayment,
  recordLedgerTransaction,
  verifyOrderOtp,
  type OrderRecord,
} from "../repositories/orders";
import { getListingById } from "../repositories/listings";
import { getPaymentProvider } from "../payments/provider";
import { fail, ok, type Result } from "./result";

export async function checkoutAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<OrderRecord>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not allowed to place orders.");
  }

  const parsed = CreateOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid order parameters");
  }

  const { listingId, quoteId, offerId, fulfillmentType, shippingAddress, notes } = parsed.data;

  try {
    const db = await createDb();
    let sellerId: string;
    let subtotalMinor: number;
    let currency: string;
    let itemTitle: string;

    if (listingId) {
      const listing = await getListingById(db, listingId);
      if (!listing) return fail("NOT_FOUND", "Listing not found");
      if (listing.sellerId === user.userId) {
        return fail("INVALID_ACTION", "You cannot purchase your own listing");
      }
      if (listing.status !== "active") {
        return fail("INVALID_STATUS", "Listing is no longer active");
      }
      sellerId = listing.sellerId;
      subtotalMinor = listing.amountMinor;
      currency = listing.currency;
      itemTitle = listing.title;
    } else if (quoteId) {
      const { data: quote, error: quoteErr } = await db
        .from("quotes")
        .select("*, request:buyer_requests!request_id(buyer_id, title)")
        .eq("id", quoteId)
        .single();

      if (quoteErr || !quote) return fail("NOT_FOUND", "Quote not found");
      const request = Array.isArray(quote.request) ? quote.request[0] : quote.request;
      if (request?.buyer_id !== user.userId) {
        return fail("FORBIDDEN", "You can only checkout quotes for your own request");
      }
      sellerId = quote.provider_id;
      subtotalMinor = Number(quote.amount_minor);
      currency = quote.currency;
      itemTitle = `Quote for: ${request?.title || "Buyer Request"}`;
    } else if (offerId) {
      const { data: offer, error: offerErr } = await db
        .from("offers")
        .select("*, listing:listings!listing_id(title)")
        .eq("id", offerId)
        .single();

      if (offerErr || !offer) return fail("NOT_FOUND", "Offer not found");
      if (offer.buyer_id !== user.userId) {
        return fail("FORBIDDEN", "You can only checkout your own accepted offers");
      }
      if (offer.status !== "accepted") {
        return fail("INVALID_STATUS", "Offer must be accepted prior to checkout");
      }
      sellerId = offer.seller_id;
      subtotalMinor = Number(offer.amount_minor);
      currency = offer.currency;
      const listing = Array.isArray(offer.listing) ? offer.listing[0] : offer.listing;
      itemTitle = `Accepted offer on: ${listing?.title || "Item"}`;
    } else {
      return fail("VALIDATION_ERROR", "Order must reference an item");
    }

    // Pan-African delivery fee calculation: flat 3,000 NGN or equivalent for delivery
    const deliveryFeeMinor = fulfillmentType === "delivery" ? 300000 : 0;
    // 2% standard platform escrow security fee
    const escrowFeeMinor = Math.round(subtotalMinor * 0.02);
    const totalMinor = subtotalMinor + deliveryFeeMinor + escrowFeeMinor;

    const order = await createOrderRecord(db, {
      buyerId: user.userId,
      sellerId,
      listingId,
      quoteId,
      offerId,
      currency,
      subtotalMinor,
      deliveryFeeMinor,
      escrowFeeMinor,
      totalMinor,
      fulfillmentType,
      shippingAddress,
      notes,
      itemTitle,
    });

    await db.rpc("write_audit_log", {
      p_action: "order.created",
      p_entity_type: "order",
      p_entity_id: order.id,
      p_metadata: { orderNumber: order.orderNumber, totalMinor, currency },
    });

    return ok(order);
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to create order");
  }
}

export async function initializeOrderPaymentAction(
  user: SessionUser,
  orderId: string,
  providerName = "mock_escrow",
): Promise<Result<{ reference: string; checkoutUrl: string; provider: string }>> {
  try {
    const db = await createDb();
    const order = await getOrderById(db, orderId, user.userId);
    if (!order) return fail("NOT_FOUND", "Order not found");

    if (order.buyerId !== user.userId) {
      return fail("FORBIDDEN", "Only the buyer can pay for this order");
    }

    if (order.status !== "pending_payment") {
      return fail("INVALID_STATUS", `This order is currently in ${order.status} status`);
    }

    const provider = getPaymentProvider(providerName);
    const callbackUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${order.id}?paid=1`
      : `http://localhost:3000/dashboard/orders/${order.id}?paid=1`;

    const paymentInit = await provider.initializePayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountMinor: order.totalMinor,
      currency: order.currency,
      customerEmail: user.email || "buyer@servilist.africa",
      customerName: user.displayName || "Servilist Buyer",
      callbackUrl,
    });

    await recordPayment(db, {
      orderId: order.id,
      provider: provider.name,
      reference: paymentInit.reference,
      amountMinor: order.totalMinor,
      currency: order.currency,
      status: "pending",
    });

    return ok(paymentInit);
  } catch (err: any) {
    return fail("PAYMENT_ERROR", err.message || "Failed to initialize payment");
  }
}

export async function handlePaymentSuccessAction(
  orderId: string,
  reference: string,
  providerName = "mock_escrow",
): Promise<Result<{ status: string }>> {
  try {
    const db = await createDb();
    const order = await getOrderById(db, orderId);
    if (!order) return fail("NOT_FOUND", "Order not found");

    const provider = getPaymentProvider(providerName);
    const verification = await provider.verifyPayment(reference);

    if (!verification.success) {
      return fail("PAYMENT_FAILED", "Payment could not be verified by the gateway");
    }

    // 1. Record successful payment
    await recordPayment(db, {
      orderId: order.id,
      provider: provider.name,
      reference,
      amountMinor: order.totalMinor,
      currency: order.currency,
      status: "successful",
      providerChannel: verification.channel,
      metadata: verification.raw,
    });

    // 2. Transition order to in_escrow
    await updateOrderStatus(db, order.id, "in_escrow");

    // 3. Post double-entry escrow ledger entries (Master Spec Section 11 & 46)
    // - Debit platform holding (escrow received)
    // - Credit seller payable (funds payable to seller upon delivery verification)
    // - Credit platform commission (platform fee retained)
    await recordLedgerTransaction(db, [
      {
        orderId: order.id,
        accountType: "platform_escrow_holding",
        entryType: "debit",
        amountMinor: order.totalMinor,
        currency: order.currency,
        reference,
        description: `Escrow hold received for order #${order.orderNumber}`,
      },
      {
        orderId: order.id,
        accountId: order.sellerId,
        accountType: "seller_escrow_payable",
        entryType: "credit",
        amountMinor: order.subtotalMinor + order.deliveryFeeMinor,
        currency: order.currency,
        reference,
        description: `Seller funds held in escrow for order #${order.orderNumber}`,
      },
      {
        orderId: order.id,
        accountType: "platform_commission",
        entryType: "credit",
        amountMinor: order.escrowFeeMinor,
        currency: order.currency,
        reference,
        description: `Platform escrow service fee for order #${order.orderNumber}`,
      },
    ]);

    await db.rpc("write_audit_log", {
      p_action: "escrow.funded",
      p_entity_type: "order",
      p_entity_id: order.id,
      p_metadata: { reference, totalMinor: order.totalMinor },
    });

    return ok({ status: "in_escrow" });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to process payment confirmation");
  }
}

export async function releaseEscrowWithOtpAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ status: string }>> {
  const parsed = ConfirmDeliveryOtpSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid OTP code");
  }

  const { orderId, otp } = parsed.data;

  try {
    const db = await createDb();
    const order = await getOrderById(db, orderId);
    if (!order) return fail("NOT_FOUND", "Order not found");

    // Must be either the seller, the buyer, or staff with orders.manage permission
    const isParticipant = user.userId === order.sellerId || user.userId === order.buyerId;
    if (!isParticipant && !user.permissions.includes("orders.manage")) {
      return fail("FORBIDDEN", "You are not authorized to release this order's escrow");
    }

    if (order.status !== "in_escrow" && order.status !== "processing" && order.status !== "dispatched" && order.status !== "delivered") {
      return fail("INVALID_STATUS", `Cannot release escrow for order in ${order.status} status`);
    }

    const verified = await verifyOrderOtp(db, orderId, otp);
    if (!verified) {
      return fail("INVALID_OTP", "The 6-digit handover OTP is incorrect. Please recheck with the buyer.");
    }

    // Ledger settlement: debit seller payable to release funds
    await recordLedgerTransaction(db, [
      {
        orderId: order.id,
        accountId: order.sellerId,
        accountType: "seller_escrow_payable",
        entryType: "debit",
        amountMinor: order.subtotalMinor + order.deliveryFeeMinor,
        currency: order.currency,
        description: `Escrow released to seller following OTP handover verification for order #${order.orderNumber}`,
      },
    ]);

    await db.rpc("write_audit_log", {
      p_action: "escrow.released",
      p_entity_type: "order",
      p_entity_id: orderId,
      p_metadata: { orderNumber: order.orderNumber },
    });

    return ok({ status: "completed" });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to release escrow");
  }
}

export async function disputeOrderAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ status: string }>> {
  const parsed = DisputeOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid dispute details");
  }

  const { orderId, reason, description } = parsed.data;

  try {
    const db = await createDb();
    const order = await getOrderById(db, orderId);
    if (!order) return fail("NOT_FOUND", "Order not found");

    if (order.buyerId !== user.userId && order.sellerId !== user.userId) {
      return fail("FORBIDDEN", "Only order participants can raise a dispute");
    }

    await updateOrderStatus(db, orderId, "disputed");

    await db.rpc("write_audit_log", {
      p_action: "order.disputed",
      p_entity_type: "order",
      p_entity_id: orderId,
      p_metadata: { reason, description, orderNumber: order.orderNumber },
    });

    return ok({ status: "disputed" });
  } catch (err: any) {
    return fail("DATABASE_ERROR", err.message || "Failed to submit dispute");
  }
}
