"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, Field, Input, Textarea } from "@/components/ui/form";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Book a service, or act on a booking. The page sends only which service and
 * package; the database sets the provider, price and currency. A booking is an
 * agreement between client and provider and does not take payment.
 */

interface ServicePackage {
  name: string;
  priceMinor: number;
  timeline?: string;
  deliverables?: string | null;
}

async function post(url: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) return null;
    return json?.error?.message || "Something went wrong. Please try again.";
  } catch {
    return "Could not reach Servilist. Check your connection and try again.";
  }
}

export function ServiceBookingClient({
  serviceId,
  currency,
  basePriceMinor,
  packages,
  quoteOnly,
  viewer,
  loginHref,
}: {
  serviceId: string;
  currency: string;
  basePriceMinor: number;
  packages: ServicePackage[];
  /** The provider prices this service case by case. */
  quoteOnly: boolean;
  viewer: "guest" | "owner" | "member" | "restricted";
  loginHref: string;
}) {
  const router = useRouter();
  const options: ServicePackage[] = packages.filter((item) => item.priceMinor > 0);
  const [selected, setSelected] = useState<string>(options[0]?.name ?? "");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosen = options.find((item) => item.name === selected);
  const priceMinor = chosen?.priceMinor ?? basePriceMinor;

  async function book(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const problem = await post(`/api/v1/services/${serviceId}/book`, {
      packageName: chosen?.name,
      scheduledDate: date ? new Date(date).toISOString() : undefined,
      deliverablesNote: note.trim() || undefined,
    });
    if (problem) {
      setError(problem);
      setBusy(false);
      return;
    }
    router.push("/dashboard/bookings");
  }

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-6">
      <div>
        <p className="text-sm text-muted">{quoteOnly ? "Price" : options.length > 0 ? "Packages" : "Price"}</p>
        {quoteOnly ? (
          <p className="text-xl font-bold text-ink">Priced by quote</p>
        ) : options.length === 0 ? (
          <p className="text-[32px] leading-none font-bold text-ink">{formatMoney(basePriceMinor, currency)}</p>
        ) : null}
      </div>

      {!quoteOnly && options.length > 0 ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Choose a package</legend>
          {options.map((item) => {
            const active = item.name === selected;
            return (
              <label
                key={item.name}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-card border p-3 transition-colors",
                  active ? "border-primary-600 bg-primary-50" : "border-line hover:border-line-strong",
                )}
              >
                <input
                  type="radio"
                  name="package"
                  value={item.name}
                  checked={active}
                  onChange={() => setSelected(item.name)}
                  className="sr-only"
                />
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-ink">{item.name}</span>
                  <span className="text-base font-bold text-ink">{formatMoney(item.priceMinor, currency)}</span>
                </span>
                {item.timeline ? <span className="text-xs text-ink-soft">{item.timeline}</span> : null}
                {item.deliverables ? <span className="text-xs text-ink-soft">{item.deliverables}</span> : null}
              </label>
            );
          })}
        </fieldset>
      ) : null}

      {viewer === "guest" ? (
        <Link href={loginHref} className={buttonClass("primary", "lg")}>
          Sign in to book
        </Link>
      ) : viewer === "owner" ? (
        <p className="rounded-input bg-primary-50 p-3 text-sm text-ink">
          This is your service. Bookings appear under Bookings in your dashboard.
        </p>
      ) : viewer === "restricted" ? (
        <p className="rounded-input bg-surface-muted p-3 text-sm text-ink-soft">
          Your account is restricted, so you cannot book services.
        </p>
      ) : quoteOnly ? (
        <p className="rounded-input bg-surface-muted p-3 text-sm text-ink-soft">
          Post a request describing the job, and this provider and others can send you offers.
        </p>
      ) : (
        <form onSubmit={book} className="flex flex-col gap-4">
          <Field id="booking-date" label="Preferred date (optional)">
            <Input
              id="booking-date"
              type="datetime-local"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <Field id="booking-note" label="What do you need done?" hint="Location, access and anything the provider should know.">
            <Textarea
              id="booking-note"
              rows={3}
              maxLength={2000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <Button type="submit" size="lg" disabled={busy} aria-busy={busy}>
            {busy ? "Sending..." : `Request booking · ${formatMoney(priceMinor, currency)}`}
          </Button>
          <p className="text-sm text-ink-soft">
            The provider confirms before work starts. Payment is agreed between you; Servilist does
            not take payment for bookings yet.
          </p>
        </form>
      )}

      {viewer !== "guest" && quoteOnly ? (
        <Link href="/requests/new" className={buttonClass("primary")}>
          Post a request
        </Link>
      ) : null}
    </Card>
  );
}

const NEXT_STEPS: Record<string, { provider: { status: string; label: string }[]; client: { status: string; label: string }[] }> = {
  pending: {
    provider: [
      { status: "confirmed", label: "Confirm booking" },
      { status: "cancelled", label: "Decline" },
    ],
    client: [{ status: "cancelled", label: "Cancel request" }],
  },
  confirmed: {
    provider: [
      { status: "in_progress", label: "Start work" },
      { status: "cancelled", label: "Cancel" },
    ],
    client: [
      { status: "completed", label: "Mark as completed" },
      { status: "cancelled", label: "Cancel" },
    ],
  },
  in_progress: { provider: [], client: [{ status: "completed", label: "Mark as completed" }] },
};

/** The actions open to this party at the booking's current status. The server enforces them. */
export function BookingActions({
  bookingId,
  status,
  role,
}: {
  bookingId: string;
  status: string;
  role: "provider" | "client";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const steps = NEXT_STEPS[status]?.[role] ?? [];
  if (steps.length === 0) return null;

  async function move(next: string) {
    setBusy(true);
    setError(null);
    const problem = await post(`/api/v1/bookings/${bookingId}/status`, { status: next });
    setBusy(false);
    if (problem) {
      setError(problem);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <Button
            key={step.status}
            variant={step.status === "cancelled" ? "secondary" : "primary"}
            disabled={busy}
            onClick={() => move(step.status)}
          >
            {step.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
