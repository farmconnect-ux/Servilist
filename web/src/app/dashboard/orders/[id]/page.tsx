import Link from "next/link";
import { notFound } from "next/navigation";
import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { getOrderById } from "@/server/repositories/orders";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { OrderTrackingClient } from "@/components/marketplace/OrderTrackingClient";

interface OrderTrackingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OrderTrackingPageProps) {
  const { id } = await params;
  return { title: `Order #${id.slice(0, 8)} · Servilist Escrow` };
}

export default async function DashboardOrderDetailPage({ params }: OrderTrackingPageProps) {
  const { id } = await params;
  const user = await requireUser(`/dashboard/orders/${id}`);
  const db = await createDb();

  const isAdmin = user.roles.includes("admin");
  const order = await getOrderById(db, id, user.userId, isAdmin);

  if (!order) {
    notFound();
  }

  const isBuyer = order.buyerId === user.userId;
  const isSeller = order.sellerId === user.userId;

  if (!isBuyer && !isSeller && !isAdmin) {
    notFound();
  }

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
          <h1 className="mt-1 text-2xl font-black text-ink">Order Tracking & Escrow</h1>
          <p className="text-xs text-muted">
            Created on {new Date(order.createdAt).toLocaleDateString()} · Fulfillment:{" "}
            <span className="capitalize font-medium text-ink">{order.fulfillmentType}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Tracking Section (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          <OrderTrackingClient
            orderId={order.id}
            orderNumber={order.orderNumber}
            status={order.status}
            isBuyer={isBuyer}
            isSeller={isSeller}
            otpCode={order.verificationOtpCode}
            otpVerifiedAt={order.otpVerifiedAt}
          />

          {/* Ordered Items */}
          <Card className="p-6">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
              Order Items
            </h3>
            <div className="mt-4 divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between py-3">
                  <div>
                    <p className="font-semibold text-sm text-ink">{item.title}</p>
                    <p className="text-xs text-muted">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm text-ink">
                    {formatMoney(item.totalMinor, item.currency)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Card className="p-6">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
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
        </div>

        {/* Financial Summary & Participants Sidebar (1 col) */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
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
                    ? "FREE"
                    : formatMoney(order.deliveryFeeMinor, order.currency)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Escrow Fee</span>
                <span className="font-medium text-ink">
                  {formatMoney(order.escrowFeeMinor, order.currency)}
                </span>
              </div>

              <div className="border-t pt-3 flex justify-between font-bold text-sm text-ink">
                <span>Total Escrow Amount</span>
                <span className="text-brand">
                  {formatMoney(order.totalMinor, order.currency)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
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
                  ★ {(isBuyer ? order.seller?.rating : order.buyer?.rating)?.toFixed(1)} (
                  {(isBuyer ? order.seller?.reviewsCount : order.buyer?.reviewsCount) || 0} reviews)
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/50 p-6 text-xs text-emerald-950">
            <h4 className="font-bold">🛡️ Licensed Pan-African Escrow</h4>
            <p className="mt-2 leading-relaxed">
              Servilist partners with regulated financial institutions to secure funds until the recipient validates delivery using the 6-digit handover OTP.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
