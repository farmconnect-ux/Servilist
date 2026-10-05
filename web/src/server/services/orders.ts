import "server-only";
import { createDb } from "@/lib/db/server";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/ids";
import type { SessionUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";
import {
  PaymentProviderError,
  PaymentsUnavailableError,
  getPaymentProvider,
  isProviderName,
  paymentsServerSecret,
} from "../payments/provider";
import {
  cancelOrder,
  completeOrderWithCode,
  confirmPayment,
  createOrder,
  failPayment,
  getOrderById,
  setOrderStage,
  startPayment,
  type ConfirmOutcome,
} from "../repositories/orders";
import { ConfirmDeliveryOtpSchema, CreateOrderSchema } from "../validators/order";
import { fail, ok, type Result } from "./result";

/**
 * Order and payment workflows.
 *
 * Prices, fees, totals and statuses are decided inside the database. This
 * layer validates input, talks to the payment provider, and passes on what the
 * provider reports. It never marks anything as paid on a browser's word.
 */

function reason(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Create an order from a listing or an accepted offer. */
export async function checkoutAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ id: string }>> {
  if (!canParticipate(user)) {
    return fail("FORBIDDEN", "Your account is not permitted to place orders.");
  }

  const parsed = CreateOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid order details");
  }
  const { listingId, offerId, fulfillmentType, shippingAddress, notes } = parsed.data;

  try {
    const db = await createDb();
    const id = await createOrder(db, { listingId, offerId, fulfillmentType, shippingAddress, notes });
    return ok({ id });
  } catch (err) {
    return fail("ORDER_REFUSED", reason(err, "The order could not be created."));
  }
}

/** Open a payment attempt and get the provider's checkout page for it. */
export async function initializeOrderPaymentAction(
  user: SessionUser,
  orderId: string,
  providerName: unknown,
): Promise<Result<{ checkoutUrl: string; reference: string; provider: string }>> {
  if (!isUuid(orderId)) return fail("NOT_FOUND", "Order not found");
  if (!isProviderName(providerName)) {
    return fail("VALIDATION_ERROR", "Choose Paystack or Flutterwave.");
  }
  if (!user.email) {
    return fail("VALIDATION_ERROR", "Add an email address to your account before paying.");
  }
  if (!paymentsServerSecret()) {
    return fail("PAYMENTS_UNAVAILABLE", "Online payment is not available yet.");
  }

  try {
    const provider = getPaymentProvider(providerName);
    const db = await createDb();
    const order = await getOrderById(db, orderId);
    if (!order || order.buyerId !== user.userId) return fail("NOT_FOUND", "Order not found");
    if (!provider.supportsCurrency(order.currency)) {
      return fail("VALIDATION_ERROR", `${provider.label} cannot take payments in ${order.currency}.`);
    }

    // The database fixes the amount and the reference; the provider is told, not asked
    const payment = await startPayment(db, order.id, provider.name);
    const init = await provider.initializePayment({
      reference: payment.reference,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      customerEmail: user.email,
      customerName: user.displayName,
      orderNumber: order.orderNumber,
      callbackUrl: `${env.appUrl}/dashboard/orders/${order.id}?provider=${provider.name}&payment=${encodeURIComponent(payment.reference)}`,
    });
    return ok(init);
  } catch (err) {
    if (err instanceof PaymentsUnavailableError) return fail("PAYMENTS_UNAVAILABLE", err.message);
    if (err instanceof PaymentProviderError) return fail("PROVIDER_ERROR", err.message);
    return fail("PAYMENT_REFUSED", reason(err, "The payment could not be started."));
  }
}

export type SettleOutcome = ConfirmOutcome | "failed" | "pending";

/**
 * Ask the provider what happened to a reference and record it. Used by both
 * the webhook and the buyer's return from the provider's page; the same
 * reference can safely be settled any number of times.
 */
export async function settlePayment(
  providerName: unknown,
  reference: string,
): Promise<Result<{ outcome: SettleOutcome }>> {
  const secret = paymentsServerSecret();
  if (!secret) return fail("PAYMENTS_UNAVAILABLE", "Online payment is not available yet.");
  if (!/^sv_[0-9a-f_]{20,80}$/.test(reference)) return fail("NOT_FOUND", "Payment not found");

  try {
    const provider = getPaymentProvider(typeof providerName === "string" ? providerName : undefined);
    const verified = await provider.verifyPayment(reference);
    if (verified.reference !== reference) return fail("NOT_FOUND", "Payment not found");

    const db = await createDb();
    if (verified.status === "pending") return ok({ outcome: "pending" });
    if (verified.status === "failed") {
      await failPayment(db, secret, reference, verified.message);
      return ok({ outcome: "failed" });
    }

    const outcome = await confirmPayment(db, secret, {
      reference,
      provider: provider.name,
      amountMinor: verified.amountMinor,
      currency: verified.currency,
      transactionId: verified.transactionId,
      channel: verified.channel,
    });
    return ok({ outcome });
  } catch (err) {
    if (err instanceof PaymentsUnavailableError) return fail("PAYMENTS_UNAVAILABLE", err.message);
    if (err instanceof PaymentProviderError) return fail("PROVIDER_ERROR", err.message);
    return fail("SETTLEMENT_FAILED", reason(err, "The payment could not be confirmed."));
  }
}

/** Seller marks a paid order as dispatched or delivered. */
export async function setOrderStageAction(
  user: SessionUser,
  orderId: string,
  stage: unknown,
): Promise<Result<{ status: string }>> {
  if (!canParticipate(user)) return fail("FORBIDDEN", "Your account is restricted.");
  if (!isUuid(orderId)) return fail("NOT_FOUND", "Order not found");
  if (stage !== "dispatched" && stage !== "delivered") {
    return fail("VALIDATION_ERROR", "Unknown order stage");
  }
  try {
    await setOrderStage(await createDb(), orderId, stage);
    return ok({ status: stage });
  } catch (err) {
    return fail("ORDER_REFUSED", reason(err, "The order could not be updated."));
  }
}

/** Seller enters the code the buyer gives at handover; a match completes the order. */
export async function releaseEscrowWithOtpAction(
  user: SessionUser,
  rawInput: unknown,
): Promise<Result<{ status: string }>> {
  if (!canParticipate(user)) return fail("FORBIDDEN", "Your account is restricted.");
  const parsed = ConfirmDeliveryOtpSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid handover code");
  }

  try {
    const matched = await completeOrderWithCode(await createDb(), parsed.data.orderId, parsed.data.otp);
    if (!matched) {
      return fail("INVALID_OTP", "That code is not correct. Ask the buyer to read it out again.");
    }
    return ok({ status: "completed" });
  } catch (err) {
    return fail("ORDER_REFUSED", reason(err, "The order could not be completed."));
  }
}

/** Buyer cancels an order that has not been paid. */
export async function cancelOrderAction(
  user: SessionUser,
  orderId: string,
): Promise<Result<{ status: string }>> {
  if (!isUuid(orderId)) return fail("NOT_FOUND", "Order not found");
  try {
    await cancelOrder(await createDb(), orderId);
    return ok({ status: "cancelled" });
  } catch (err) {
    return fail("ORDER_REFUSED", reason(err, "The order could not be cancelled."));
  }
}

/** Disputes live with the other moderation workflows. */
export { openDisputeAction as disputeOrderAction } from "./moderation";
