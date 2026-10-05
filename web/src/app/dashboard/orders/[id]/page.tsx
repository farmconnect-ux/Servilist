import Link from "next/link";
import { notFound } from "next/navigation";
import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { getHandoverCode, getOrderById } from "@/server/repositories/orders";
import { availableProviders } from "@/server/payments/provider";
import { settlePayment } from "@/server/services/orders";
import { isUuid } from "@/lib/ids";
import { isReleased } from "@/lib/release";
import { getDeliveryByOrderId } from "@/server/repositories/deliveries";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { OrderTrackingClient } from "@/components/marketplace/OrderTrackingClient";
import { ReviewForm } from "@/components/marketplace/TrustActions";
import { hasReviewedOrder } from "@/server/repositories/moderation";

interface OrderTrackingPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ provider?: string | string[]; payment?: string | string[] }>;
}

const PAYMENT_NOTICES: Record<string, { tone: "good" | "bad"; text: string }> = {
  confirmed: { tone: "good", text: "Payment received. Your handover code is below." },
  already_confirmed: { tone: "good", text: "Payment received." },
  pending: { tone: "bad", text: "The provider has not confirmed this payment yet. Refresh this page in a minute." },
  failed: { tone: "bad", text: "The payment did not go through. Nothing was charged; you can try again." },
  amount_mismatch: { tone: "bad", text: "The amount charged did not match this order. It has been flagged for a refund." },
  duplicate_refund_due: { tone: "bad", text: "This order was already paid. The second charge has been flagged for a refund." },
  paid_after_close: { tone: "bad", text: "This order had already closed when the payment arrived. It has been flagged for review and refund." },
};

export async function generateMetadata({ params }: OrderTrackingPageProps) {
  const { id } = await params;
  return { title: `Order #${id.slice(0, 8)} · Servilist Escrow` };
}

export default async function DashboardOrderDetailPage({
  params,
  searchParams,
}: OrderTrackingPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser(`/dashboard/orders/${id}`);
  const db = await createDb();

  if (!isUuid(id)) notFound();

  // Returning from the provider's page: ask the provider what happened before showing the order.
  // The reference in the address only says which payment to look up; it proves nothing by itself.
  const paymentRef = Array.isArray(query.payment) ? query.payment[0] : query.payment;
  const providerName = Array.isArray(query.provider) ? query.provider[0] : query.provider;
  let paymentNotice: { tone: "good" | "bad"; text: string } | null = null;
  if (paymentRef && providerName && paymentRef.includes(id.replace(/-/g, ""))) {
    const settled = await settlePayment(providerName, paymentRef);
    paymentNotice = settled.ok
      ? (PAYMENT_NOTICES[settled.data.outcome] ?? null)
      : { tone: "bad", text: "We could not confirm this payment yet. Refresh this page in a minute." };
  }

  // Row-level security returns an order only to its buyer, its seller or staff
  const order = await getOrderById(db, id);

  if (!order) {
    notFound();
  }

  // Courier tracking belongs to Sprint 8 and stays switched off until it is verified
  const delivery = isReleased(`/api/v1/orders/${id}/delivery`)
    ? await getDeliveryByOrderId(db, id)
    : null;
  const handoverCode = await getHandoverCode(db, id);

  const isBuyer = order.buyerId === user.userId;
  const isSeller = order.sellerId === user.userId;
  const canReview =
    order.status === "completed" &&
    (isBuyer || isSeller) &&
    isReleased("/api/v1/reviews") &&
    !(await hasReviewedOrder(db, order.id, user.userId));


  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/dashboard" className="hover:text-brand">Dashboard</Link> &gt;{" "}
        <Link href="/dashboard/orders" className="hover:text-brand">Orders</Link> &gt;{" "}
        <span className="font-mono text-ink">{order.orderNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="font-mono text-xs font-bold text-muted">{order.orderNumber}</span>
          <h1 className="mt-1 text-2xl font-bold text-ink">{order.title}</h1>
          <p className="text-xs text-muted">
            Created on {new Date(order.createdAt).toLocaleDateString()} · Fulfillment:{" "}
            <span className="capitalize font-medium text-ink">{order.fulfillmentType}</span>
          </p>
        </div>
      </div>

      {paymentNotice && (
        <p
          role="status"
          className={
            paymentNotice.tone === "good"
              ? "rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm font-semibold text-primary-900"
              : "rounded-lg border border-accent-200 bg-accent-50 p-3 text-sm font-semibold text-accent-600"
          }
        >
          {paymentNotice.text}
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Tracking Section (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          <OrderTrackingClient
            orderId={order.id}
            orderNumber={order.orderNumber}
            status={order.status}
            isBuyer={isBuyer}
            isSeller={isSeller}
            otpCode={handoverCode}
            completedAt={order.completedAt}
            placedAt={order.createdAt}
            paidAt={order.paidAt}
            paymentDueAt={order.paymentDueAt}
            providers={isBuyer ? availableProviders(order.currency) : []}
            disputesOpen={isReleased(`/api/v1/orders/${id}/dispute`)}
          />

          {canReview && (
            <Card className="p-6">
              <ReviewForm
                orderId={order.id}
                otherName={
                  (isBuyer ? order.seller?.displayName : order.buyer?.displayName) ?? "the other party"
                }
              />
            </Card>
          )}

          {/* Ordered Items */}
          <Card className="p-6">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
              Order Items
            </h3>
            <div className="mt-4 divide-y">
              <div className="flex justify-between py-3">
                <div>
                  <p className="font-semibold text-sm text-ink">{order.title}</p>
                  <p className="text-xs text-muted">Quantity: {order.quantity}</p>
                </div>
                <p className="font-bold text-sm text-ink">
                  {formatMoney(order.subtotalMinor, order.currency)}
                </p>
              </div>
            </div>
          </Card>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Card className="p-6">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
                Delivery Destination
              </h3>
              <div className="mt-3 text-sm text-ink space-y-1">
                <p className="font-bold">{order.shippingAddress.recipientName}</p>
                <p>{order.shippingAddress.addressLine}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.country}
                </p>
                <p className="text-xs text-muted">Phone: {order.shippingAddress.phoneNumber}</p>
              </div>
            </Card>
          )}

          {/* Courier Delivery Tracking */}
          {delivery && (
            <Card className="p-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Courier Tracking ({delivery.courierProvider.replace("_", " ").toUpperCase()})
                  </h3>
                  {delivery.trackingCode && (
                    <p className="font-mono text-xs font-bold text-accent-600 mt-0.5">
                      Waybill: {delivery.trackingCode}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase bg-surface-muted text-ink">
                  {delivery.status.replace("_", " ")}
                </span>
              </div>

              {/* Tracking timeline */}
              <div className="mt-4 space-y-3">
                {delivery.trackingEvents.map((evt, idx) => (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <span className="h-2 w-2 rounded-full bg-accent-600" />
                      {idx < delivery.trackingEvents.length - 1 && (
                        <span className="w-0.5 flex-1 bg-line my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="font-semibold text-ink">{evt.description}</p>
                      {evt.location && <p className="text-[11px] text-muted">{evt.location}</p>}
                      <p className="text-[10px] text-disabled">
                        {new Date(evt.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Financial Summary & Participants Sidebar (1 col) */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
              Payment Breakdown
            </h3>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="font-medium text-ink">
                  {formatMoney(order.subtotalMinor, order.currency)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery Fee</span>
                <span className="font-medium text-ink">
                  {order.deliveryFeeMinor === 0
                    ? "Not included"
                    : formatMoney(order.deliveryFeeMinor, order.currency)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Buyer protection fee</span>
                <span className="font-medium text-ink">
                  {formatMoney(order.buyerFeeMinor, order.currency)}
                </span>
              </div>

              <div className="border-t pt-3 flex justify-between font-bold text-sm text-ink">
                <span>Total</span>
                <span className="text-brand">
                  {formatMoney(order.totalMinor, order.currency)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
              {isBuyer ? "Seller Information" : "Buyer Information"}
            </h3>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">
                {(isBuyer ? order.seller?.displayName : order.buyer?.displayName)?.charAt(0) || "U"}
              </div>
              <div>
                <p className="font-bold text-sm text-ink">
                  {isBuyer ? order.seller?.displayName : order.buyer?.displayName}
                </p>
                <p className="text-xs text-muted">
                  Use Messages to arrange the handover.
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-primary-200 bg-primary-50/50 p-6 text-xs text-primary-900">
            <h4 className="font-bold">How your payment is protected</h4>
            <p className="mt-2 leading-relaxed">
              Payments are taken by a licensed provider (Paystack or Flutterwave), not by Servilist.
              The order is released to the seller only when the buyer gives the 6-digit handover code.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
