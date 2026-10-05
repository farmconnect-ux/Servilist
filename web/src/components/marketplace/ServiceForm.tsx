"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, Field, Input, Select, Textarea } from "@/components/ui/form";
import { CURRENCIES } from "@/lib/money";

/** Offer a service. Nothing is pre-filled; the provider describes their own work. */

const PRICING = [
  { value: "fixed", label: "Fixed price" },
  { value: "starting_at", label: "Starting price" },
  { value: "hourly", label: "Per hour" },
  { value: "custom_quote", label: "Priced by quote" },
];

const DELIVERY = [
  { value: "on_site_local", label: "At the client's location" },
  { value: "remote", label: "Done remotely" },
  { value: "hybrid", label: "Either" },
];

export function ServiceForm({ categories }: { categories: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    categorySlug: "",
    pricingModel: "starting_at",
    price: "",
    currency: "NGN",
    deliveryType: "on_site_local",
    city: "",
    country: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (fields: Partial<typeof form>) => setForm((current) => ({ ...current, ...fields }));
  const quoteOnly = form.pricingModel === "custom_quote";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.title.trim().length < 5) return setError("Give your service a title of at least 5 characters.");
    if (form.description.trim().length < 10) return setError("Describe the service in at least 10 characters.");
    if (!form.categorySlug) return setError("Choose a category.");
    if (!quoteOnly && !(Number(form.price) > 0)) return setError("Enter a price greater than zero.");
    if (form.country.trim().length < 2) return setError("Enter your country.");

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          categorySlug: form.categorySlug,
          pricingModel: form.pricingModel,
          basePriceMajor: quoteOnly ? 0 : Number(form.price),
          currency: form.currency,
          deliveryType: form.deliveryType,
          city: form.city.trim() || undefined,
          country: form.country.trim(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "We couldn't publish your service. Please try again.");
      }
      router.push(`/services/${json.data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't publish your service.");
      setBusy(false);
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field id="service-title" label="Service title" hint="For example: Generator repair and servicing." required>
          <Input
            id="service-title"
            value={form.title}
            maxLength={150}
            onChange={(event) => update({ title: event.target.value })}
          />
        </Field>
        <Field
          id="service-description"
          label="Description"
          hint="What you do, what is included, and your experience."
          required
        >
          <Textarea
            id="service-description"
            rows={5}
            maxLength={5000}
            value={form.description}
            onChange={(event) => update({ description: event.target.value })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="service-category" label="Category" required>
            <Select
              id="service-category"
              value={form.categorySlug}
              onChange={(event) => update({ categorySlug: event.target.value })}
            >
              <option value="">Choose one</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="service-delivery" label="Where the work is done">
            <Select
              id="service-delivery"
              value={form.deliveryType}
              onChange={(event) => update({ deliveryType: event.target.value })}
            >
              {DELIVERY.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="service-pricing" label="Pricing">
            <Select
              id="service-pricing"
              value={form.pricingModel}
              onChange={(event) => update({ pricingModel: event.target.value })}
            >
              {PRICING.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="service-currency" label="Currency">
            <Select
              id="service-currency"
              value={form.currency}
              onChange={(event) => update({ currency: event.target.value })}
            >
              {Object.keys(CURRENCIES).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Select>
          </Field>
          {!quoteOnly ? (
            <Field id="service-price" label="Price" required>
              <Input
                id="service-price"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={form.price}
                onChange={(event) => update({ price: event.target.value })}
              />
            </Field>
          ) : null}
          <Field id="service-city" label="City">
            <Input
              id="service-city"
              value={form.city}
              maxLength={100}
              onChange={(event) => update({ city: event.target.value })}
            />
          </Field>
          <Field id="service-country" label="Country" required>
            <Input
              id="service-country"
              value={form.country}
              maxLength={100}
              onChange={(event) => update({ country: event.target.value })}
            />
          </Field>
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={busy} aria-busy={busy}>
            {busy ? "Publishing..." : "Publish service"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
