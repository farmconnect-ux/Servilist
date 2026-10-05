"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

interface CheckoutItemDetails {
  title: string;
  priceMinor: number;
  currency: string;
  listingId?: string;
  quoteId?: string;
  offerId?: string;
  sellerName?: string;
}

interface ProviderOption {
  name: string;
  label: string;
  description: string;
}

export function CheckoutClient({
  item,
  feeBps,
  providers,
}: {
  item: CheckoutItemDetails;
  /** Buyer protection fee in basis points. Shown here; charged by the server. */
  feeBps: number;
  /** Payment providers that are configured and can charge in this currency. */
  providers: ProviderOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("pickup");
  const [provider, setProvider] = useState(providers[0]?.name ?? "");

  const [address, setAddress] = useState({
    recipientName: "",
    phoneNumber: "",
    addressLine: "",
    city: "Lagos",
    country: "Nigeria",
  });

  // For display only: the server works out the same figures and charges those
  const deliveryFeeMinor = 0;
  const escrowFeeMinor = Math.floor((item.priceMinor * feeBps) / 10000);
  const totalMinor = item.priceMinor + deliveryFeeMinor + escrowFeeMinor;
  const canPay = providers.length > 0;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create order
      const orderRes = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: item.offerId ? undefined : item.listingId,
          offerId: item.offerId,
          fulfillmentType: fulfillment,
          shippingAddress: fulfillment === "delivery" ? address : undefined,
        }),
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.success) {
        throw new Error(orderJson.error?.message || "Failed to create order");
      }

      const orderId = orderJson.data.id;

      // 2. Initiate payment
      const payRes = await fetch(`/api/v1/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      const payJson = await payRes.json().catch(() => null);
      if (!payRes.ok || !payJson?.success) {
        // The order exists; it can be paid or cancelled from its own page
        router.push(`/dashboard/orders/${orderId}`);
        return;
      }

      // Continue on the provider's own payment page (Paystack or Flutterwave)
      window.location.href = payJson.data.checkoutUrl;
    } catch (err: any) {
      setError(err.message || "An error occurred during checkout");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCheckout} className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {/* Checkout Inputs (2 cols) */}
      <div className="space-y-6 md:col-span-2">
        {error && (
          <div className="rounded-lg border border-danger/40 bg-danger-soft p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Fulfillment selection */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink">1. Fulfillment Method</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFulfillment("delivery")}
              className={`rounded-xl border p-4 text-left transition ${
                fulfillment === "delivery"
                  ? "border-brand bg-brand/5 shadow-sm"
                  : "border-border hover:border-line-strong"
              }`}
            >
              <p className="font-bold text-ink">Doorstep Delivery</p>
              <p className="text-xs text-muted mt-1">
                Sent to your address. You give the handover code when it arrives.
              </p>
              <p className="mt-2 text-xs font-semibold text-brand">
                Delivery cost is agreed with the seller
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFulfillment("pickup")}
              className={`rounded-xl border p-4 text-left transition ${
                fulfillment === "pickup"
                  ? "border-brand bg-brand/5 shadow-sm"
                  : "border-border hover:border-line-strong"
              }`}
            >
              <p className="font-bold text-ink">Direct Pickup / Meeting</p>
              <p className="text-xs text-muted mt-1">
                Meet the seller in a public place and inspect the item before giving your handover code.
              </p>
              <p className="mt-2 text-xs font-semibold text-primary-600">No delivery cost</p>
            </button>
          </div>
        </Card>

        {/* Shipping address (if delivery) */}
        {fulfillment === "delivery" && (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-ink">2. Delivery Address & Contact</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink">Recipient Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={address.recipientName}
                  onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +234 801 234 5678"
                  value={address.phoneNumber}
                  onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Street Address</label>
              <input
                type="text"
                required
                placeholder="House number, street name, apartment or landmark"
                value={address.addressLine}
                onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink">City / Town</label>
                <input
                  type="text"
                  required
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Country</label>
                <select
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
                >
                  <option value="Nigeria">Nigeria</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Ghana">Ghana</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Egypt">Egypt</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Payment gateway */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink">3. Payment Provider</h2>
          <p className="mt-1 text-xs text-muted">
            Choose who processes your payment. Servilist never sees your card or wallet details.
          </p>

          <div className="mt-4 space-y-2">
            {!canPay && (
              <p className="rounded-lg border border-accent-200 bg-accent-50 p-3 text-sm text-accent-600">
                Online payment in {item.currency} is not available yet. You can still message the
                seller to arrange the purchase.
              </p>
            )}
            {providers
              .map((p) => ({ id: p.name, name: p.label, desc: p.description }))
              .map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                  provider === p.id ? "border-brand bg-brand/5" : "border-border hover:bg-surface-muted"
                }`}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  value={p.id}
                  checked={provider === p.id}
                  onChange={() => setProvider(p.id)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-muted">{p.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Order Summary (1 col) */}
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
            Order Summary
          </h3>

          <div className="mt-4 space-y-3 border-b pb-4">
            <div>
              <p className="font-bold text-ink text-sm">{item.title}</p>
              {item.sellerName && (
                <p className="text-xs text-muted">Seller: {item.sellerName}</p>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted">
              <span>Item Subtotal</span>
              <span className="font-medium text-ink">
                {formatMoney(item.priceMinor, item.currency)}
              </span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Delivery Fee</span>
              <span className="font-medium text-ink">
                {deliveryFeeMinor === 0 ? "Not included" : formatMoney(deliveryFeeMinor, item.currency)}
              </span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Buyer protection fee ({feeBps / 100}%)</span>
              <span className="font-medium text-ink">
                {formatMoney(escrowFeeMinor, item.currency)}
              </span>
            </div>

            <div className="border-t pt-3 flex justify-between font-bold text-base text-ink">
              <span>Total Payable</span>
              <span className="text-brand">{formatMoney(totalMinor, item.currency)}</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !canPay || !provider}
            className="mt-6 w-full font-bold"
          >
            {loading ? "Opening payment page..." : "Continue to payment"}
          </Button>

          <p className="mt-3 text-[11px] text-center text-muted">
            The order is released to the seller only when you give them your 6-digit handover code.
          </p>
        </Card>
      </div>
    </form>
  );
}
