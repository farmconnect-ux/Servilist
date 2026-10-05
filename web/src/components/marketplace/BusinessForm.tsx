"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonClass } from "@/components/ui/button";
import { Alert, Field, Input, Textarea } from "@/components/ui/form";

/**
 * Create or edit the member's business page. Nothing is pre-filled with
 * sample content, and there is no field for a verified status: that badge
 * comes from Servilist's own checks on the owner.
 */

export interface BusinessFormValues {
  businessName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  supportEmail: string;
  supportPhone: string;
  websiteUrl: string;
  returnPolicy: string;
  openingHours: string;
  registrationNumber: string;
}

export function BusinessForm({ initial, slug }: { initial: BusinessFormValues; slug: string | null }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  const update = (fields: Partial<BusinessFormValues>) => {
    setSavedSlug(null);
    setForm((current) => ({ ...current, ...fields }));
  };

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (form.businessName.trim().length < 2) {
      setError("Enter a business name of at least 2 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    setSavedSlug(null);
    try {
      const res = await fetch("/api/v1/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "The business page could not be saved. Please try again.");
      } else {
        setSavedSlug(json.data.slug);
        router.refresh();
      }
    } catch {
      setError("Could not reach Servilist. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-6" noValidate>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {savedSlug ? (
        <Alert tone="success">
          Saved.{" "}
          <Link href={`/business/${savedSlug}`} className="font-semibold underline">
            View your business page
          </Link>
        </Alert>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-ink">About the business</h2>
        <Field id="business-name" label="Business name" required>
          <Input
            id="business-name"
            value={form.businessName}
            maxLength={150}
            onChange={(event) => update({ businessName: event.target.value })}
          />
        </Field>
        <Field id="business-tagline" label="Tagline" hint="One line on what you sell.">
          <Input
            id="business-tagline"
            value={form.tagline}
            maxLength={250}
            onChange={(event) => update({ tagline: event.target.value })}
          />
        </Field>
        <Field id="business-description" label="Description">
          <Textarea
            id="business-description"
            rows={5}
            value={form.description}
            maxLength={3000}
            onChange={(event) => update({ description: event.target.value })}
          />
        </Field>
        <Field
          id="business-registration"
          label="Registration number"
          hint="Shown as you give it. Servilist does not check it."
        >
          <Input
            id="business-registration"
            value={form.registrationNumber}
            maxLength={100}
            onChange={(event) => update({ registrationNumber: event.target.value })}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-ink">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="business-email" label="Support email" hint="Shown publicly.">
            <Input
              id="business-email"
              type="email"
              value={form.supportEmail}
              maxLength={255}
              onChange={(event) => update({ supportEmail: event.target.value })}
            />
          </Field>
          <Field id="business-phone" label="Support phone" hint="Shown publicly.">
            <Input
              id="business-phone"
              type="tel"
              value={form.supportPhone}
              maxLength={30}
              onChange={(event) => update({ supportPhone: event.target.value })}
            />
          </Field>
        </div>
        <Field id="business-website" label="Website" hint="Must start with https://">
          <Input
            id="business-website"
            type="url"
            value={form.websiteUrl}
            maxLength={300}
            onChange={(event) => update({ websiteUrl: event.target.value })}
          />
        </Field>
        <Field id="business-hours" label="Opening hours">
          <Input
            id="business-hours"
            value={form.openingHours}
            maxLength={300}
            onChange={(event) => update({ openingHours: event.target.value })}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-ink">Images and policy</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="business-logo" label="Logo address" hint="A link to your logo, starting with https://">
            <Input
              id="business-logo"
              type="url"
              value={form.logoUrl}
              maxLength={500}
              onChange={(event) => update({ logoUrl: event.target.value })}
            />
          </Field>
          <Field id="business-banner" label="Banner address" hint="A wide image, starting with https://">
            <Input
              id="business-banner"
              type="url"
              value={form.bannerUrl}
              maxLength={500}
              onChange={(event) => update({ bannerUrl: event.target.value })}
            />
          </Field>
        </div>
        <Field id="business-returns" label="Return policy">
          <Textarea
            id="business-returns"
            rows={4}
            value={form.returnPolicy}
            maxLength={3000}
            onChange={(event) => update({ returnPolicy: event.target.value })}
          />
        </Field>
      </section>

      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row">
        <Button type="submit" size="lg" disabled={busy} aria-busy={busy}>
          {busy ? "Saving..." : slug ? "Save changes" : "Create business page"}
        </Button>
        {slug ? (
          <Link href={`/business/${slug}`} className={buttonClass("secondary", "lg")}>
            View page
          </Link>
        ) : null}
      </div>
    </form>
  );
}
