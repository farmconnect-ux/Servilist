"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, Field, Input } from "@/components/ui/form";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Checkout (docs/UI_UX_SPEC.md sections 38, 39 and 80): delivery, address and
 * payment on the left, the order summary on the right. The fee and total are
 * visible from the start. The figures shown here are for display; the server
 * works out the same figures from the listing and charges those.
 */

interface CheckoutItemDetails {
  title: string;
  priceMinor: number;
  currency: string;
  listingId?: string;
  offerId?: string;
  sellerName?: string;
}

interface ProviderOption {
  name: string;
  label: string;
  description: string;
}

const HANDOVER = [
  {
    value: "pickup",
    label: "Pickup",
    text: "Meet the seller in a public place and check the item before giving your handover code.",
  },
  {
    value: "delivery",
    label: "Delivery",
    text: "Sent to your address. Agree the delivery cost with the seller. Give your code when it arrives.",
  },
] as const;

export function CheckoutClient({
  item,
  feeBps,
  providers,
}: {
  item: CheckoutItemDetails;
  /** Buyer protection fee in basis points. */
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
    city: "",
    country: "",
  });

  const feeMinor = Math.floor((item.priceMinor * feeBps) / 10000);
  const totalMinor = item.priceMinor + feeMinor;
  const canPay = providers.length > 0;
  const setField = (field: keyof typeof address, value: string) =>
    setAddress((current) => ({ ...current, [field]: value }));

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
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
      const orderJson = await orderRes.json().catch(() => null);
      if (!orderRes.ok || !orderJson?.success) {
        throw new Error(orderJson?.error?.message || "We couldn't place your order. Please try again.");
      }
      const orderId = orderJson.data.id;

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
      // Continue on the provider's own payment page
      window.location.href = payJson.data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't place your order.");
      setLoading(false);
    }
  }

  const summary = (
    <dl className="flex flex-col gap-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-ink-soft">Item</dt>
        <dd className="font-medium text-ink">{formatMoney(item.priceMinor, item.currency)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-ink-soft">Delivery</dt>
        <dd className="text-right text-ink-soft">
          {fulfillment === "delivery" ? "Agreed with the seller" : "Pickup"}
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-ink-soft">Buyer protection fee ({feeBps / 100}%)</dt>
        <dd className="font-medium text-ink">{formatMoney(feeMinor, item.currency)}</dd>
      </div>
      <div className="mt-1 flex justify-between gap-4 border-t border-line pt-3 text-base">
        <dt className="font-semibold text-ink">Total</dt>
        <dd className="font-bold text-ink">{formatMoney(totalMinor, item.currency)}</dd>
      </div>
    </dl>
  );

  return (
    <form onSubmit={pay} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-6">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        {/* Phones: the summary folds away above the form (section 38) */}
        <details className="rounded-card border border-line bg-surface lg:hidden">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 text-sm font-semibold text-ink">
            <span>Order summary</span>
            <span>{formatMoney(totalMinor, item.currency)}</span>
          </summary>
          <div className="border-t border-line p-4">
            <p className="mb-3 text-sm font-medium text-ink">{item.title}</p>
            {summary}
          </div>
        </details>

        <Card className="flex flex-col gap-4 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-ink">Delivery</h2>
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">How you receive the item</legend>
            {HANDOVER.map((option) => {
              const selected = fulfillment === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 rounded-card border p-4 transition-colors",
                    selected ? "border-primary-600 bg-primary-50" : "border-line hover:border-line-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="fulfillment"
                    value={option.value}
                    checked={selected}
                    onChange={() => setFulfillment(option.value)}
                    className="sr-only"
                  />
                  <span className="text-base font-semibold text-ink">{option.label}</span>
                  <span className="text-sm text-ink-soft">{option.text}</span>
                </label>
              );
            })}
          </fieldset>
        </Card>

        {fulfillment === "delivery" ? (
          <Card className="flex flex-col gap-4 p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-ink">Address</h2>
            <p className="text-sm text-ink-soft">Shared only with the seller of this order.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="checkout-name" label="Recipient name" required>
                <Input
                  id="checkout-name"
                  autoComplete="name"
                  required
                  maxLength={120}
                  value={address.recipientName}
                  onChange={(event) => setField("recipientName", event.target.value)}
                />
              </Field>
              <Field id="checkout-phone" label="Phone number" required>
                <Input
                  id="checkout-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={30}
                  value={address.phoneNumber}
                  onChange={(event) => setField("phoneNumber", event.target.value)}
                />
              </Field>
            </div>
            <Field id="checkout-street" label="Street address" required>
              <Input
                id="checkout-street"
                autoComplete="street-address"
                required
                maxLength={300}
                value={address.addressLine}
                onChange={(event) => setField("addressLine", event.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="checkout-city" label="City" required>
                <Input
                  id="checkout-city"
                  autoComplete="address-level2"
                  required
                  maxLength={80}
                  value={address.city}
                  onChange={(event) => setField("city", event.target.value)}
                />
              </Field>
              <Field id="checkout-country" label="Country" required>
                <Input
                  id="checkout-country"
                  autoComplete="country-name"
                  required
                  maxLength={80}
                  value={address.country}
                  onChange={(event) => setField("country", event.target.value)}
                />
              </Field>
            </div>
          </Card>
        ) : null}

        <Card className="flex flex-col gap-4 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-ink">Payment</h2>
          {canPay ? (
            <>
              <p className="text-sm text-ink-soft">
                You pay on the provider&apos;s own page. Servilist never sees your card or wallet details.
              </p>
              <fieldset className="flex flex-col gap-3">
                <legend className="sr-only">Payment provider</legend>
                {providers.map((option) => {
                  const selected = provider === option.name;
                  return (
                    <label
                      key={option.name}
                      className={cn(
                        "flex min-h-14 cursor-pointer items-center gap-3 rounded-card border p-4 transition-colors",
                        selected ? "border-primary-600 bg-primary-50" : "border-line hover:border-line-strong",
                      )}
                    >
                      <input
                        type="radio"
                        name="provider"
                        value={option.name}
                        checked={selected}
                        onChange={() => setProvider(option.name)}
                        className="size-5 accent-primary-600"
                      />
                      <span>
                        <span className="block text-base font-semibold text-ink">{option.label}</span>
                        <span className="block text-sm text-ink-soft">{option.description}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            </>
          ) : (
            <Alert tone="warning">
              Online payment in {item.currency} is not available yet. You can still message the
              seller to arrange the purchase.
            </Alert>
          )}
        </Card>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-40 lg:self-start">
        <Card className="flex flex-col gap-4 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-ink">Order summary</h2>
          <div>
            <p className="text-base font-medium text-ink">{item.title}</p>
            {item.sellerName ? <p className="text-sm text-ink-soft">Sold by {item.sellerName}</p> : null}
          </div>
          {summary}
          <Button type="submit" size="lg" disabled={loading || !canPay || !provider} aria-busy={loading}>
            {loading ? "Opening payment page..." : "Pay now"}
          </Button>
          <p className="flex items-start gap-2 text-sm text-ink-soft">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary-700" aria-hidden="true" />
            The seller is paid only after you give them your 6-digit handover code.
          </p>
        </Card>
      </aside>
    </form>
  );
}
