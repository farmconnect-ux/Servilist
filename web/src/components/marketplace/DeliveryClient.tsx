"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, Field, Input, Select } from "@/components/ui/form";

/**
 * Delivery tracker for an order the buyer asked to have delivered
 * (docs/UI_UX_SPEC.md section 41). The seller reports each step; Servilist is
 * not connected to any courier, and says so. Marking a parcel delivered does
 * not pay the seller: that still takes the buyer's handover code.
 */

const STEPS = [
  { value: "dispatched", label: "Dispatched" },
  { value: "in_transit", label: "In transit" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
] as const;

type Step = (typeof STEPS)[number]["value"];

export interface DeliveryView {
  carrierName: string;
  trackingCode: string | null;
  estimatedDeliveryAt: string | null;
  status: Step;
  events: { id: string; status: Step; note: string | null; createdAt: string }[];
}

function when(value: string): string {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export function DeliveryClient({
  orderId,
  delivery,
  isSeller,
  orderStatus,
}: {
  orderId: string;
  delivery: DeliveryView | null;
  isSeller: boolean;
  orderStatus: string;
}) {
  const router = useRouter();
  const [carrier, setCarrier] = useState("");
  const [code, setCode] = useState("");
  const [expected, setExpected] = useState("");
  const [note, setNote] = useState("");
  const [next, setNext] = useState<Step | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(path: string, body: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Something went wrong. Please try again.");
      } else {
        setNote("");
        setNext("");
        router.refresh();
      }
    } catch {
      setError("Could not reach Servilist. Check your connection and try again.");
    }
    setBusy(false);
  }

  function dispatch(event: React.FormEvent) {
    event.preventDefault();
    if (carrier.trim().length < 2) {
      setError("Say who is delivering the item.");
      return;
    }
    void send("delivery", {
      carrierName: carrier.trim(),
      trackingCode: code.trim() || undefined,
      // The end of the chosen day, so "today" is never in the past
      estimatedDeliveryAt: expected ? new Date(`${expected}T23:59:00`).toISOString() : undefined,
      note: note.trim() || undefined,
    });
  }

  function report(event: React.FormEvent) {
    event.preventDefault();
    if (!next) {
      setError("Choose the next step.");
      return;
    }
    void send("delivery/track", { status: next, note: note.trim() || undefined });
  }

  if (!delivery) {
    if (!isSeller) {
      return (
        <Card className="flex items-start gap-3 p-4">
          <Truck className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden="true" />
          <p className="text-sm text-ink-soft">
            {orderStatus === "pending_payment"
              ? "Delivery details appear here after you pay and the seller sends the item."
              : "The seller has not sent the item yet. Delivery details will appear here."}
          </p>
        </Card>
      );
    }
    // "dispatched" covers a seller who marked the order sent before adding the details
    if (orderStatus !== "in_escrow" && orderStatus !== "dispatched") return null;
    return (
      <Card className="flex flex-col gap-4 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-ink">Send this order</h2>
        <p className="text-sm text-ink-soft">
          The buyer asked for delivery. Tell them who is bringing it and how to follow it.
        </p>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <form onSubmit={dispatch} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="delivery-carrier"
              label="Delivered by"
              hint="A courier company, a rider's name, or yourself."
              required
            >
              <Input
                id="delivery-carrier"
                value={carrier}
                maxLength={80}
                onChange={(event) => setCarrier(event.target.value)}
              />
            </Field>
            <Field id="delivery-code" label="Tracking code" hint="If the courier gave you one.">
              <Input
                id="delivery-code"
                value={code}
                maxLength={100}
                onChange={(event) => setCode(event.target.value)}
              />
            </Field>
            <Field id="delivery-expected" label="Expected delivery date">
              <Input
                id="delivery-expected"
                type="date"
                value={expected}
                onChange={(event) => setExpected(event.target.value)}
              />
            </Field>
            <Field id="delivery-note" label="Note for the buyer">
              <Input
                id="delivery-note"
                value={note}
                maxLength={300}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
          </div>
          <Button type="submit" disabled={busy} aria-busy={busy} className="self-start">
            {busy ? "Saving..." : "Mark as dispatched"}
          </Button>
        </form>
      </Card>
    );
  }

  const reached = STEPS.findIndex((step) => step.value === delivery.status);
  const remaining = STEPS.slice(reached + 1);
  const canUpdate = isSeller && orderStatus === "dispatched" && remaining.length > 0;

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Delivery</h2>
          <p className="text-sm text-ink-soft">
            Delivered by <span className="font-medium text-ink">{delivery.carrierName}</span>
          </p>
        </div>
        <dl className="text-sm sm:text-right">
          {delivery.trackingCode ? (
            <div>
              <dt className="inline text-muted">Tracking code: </dt>
              <dd className="inline font-medium text-ink">{delivery.trackingCode}</dd>
            </div>
          ) : null}
          {delivery.estimatedDeliveryAt ? (
            <div>
              <dt className="inline text-muted">Expected: </dt>
              <dd className="inline font-medium text-ink">
                {new Date(delivery.estimatedDeliveryAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <ol className="flex flex-col">
        {STEPS.map((step, position) => {
          const done = position <= reached;
          const event = delivery.events.find((item) => item.status === step.value);
          return (
            <li key={step.value} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-pill text-xs ${
                    done ? "bg-primary-600 text-white" : "border border-line-strong text-muted"
                  }`}
                >
                  {done ? <Check className="size-3.5" aria-hidden="true" /> : position + 1}
                </span>
                {position < STEPS.length - 1 ? (
                  <span className={`my-1 w-0.5 flex-1 ${position < reached ? "bg-primary-600" : "bg-line"}`} />
                ) : null}
              </div>
              <div className="min-h-12 pb-3">
                <p className={`text-sm font-medium ${done ? "text-ink" : "text-muted"}`}>
                  {step.label}
                  <span className="sr-only">{done ? " (done)" : " (not yet)"}</span>
                </p>
                {event ? <p className="text-xs text-muted">{when(event.createdAt)}</p> : null}
                {event?.note ? <p className="text-sm text-ink-soft">{event.note}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="rounded-input bg-surface-muted p-3 text-sm text-ink-soft">
        These updates come from the seller. Servilist is not connected to the courier.
        {isSeller
          ? " You are paid when the buyer gives you their handover code."
          : " Give the seller your handover code only after you have received and checked the item."}
      </p>

      {canUpdate ? (
        <form onSubmit={report} className="flex flex-col gap-4 border-t border-line pt-4" noValidate>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="delivery-next" label="Next step" required>
              <Select
                id="delivery-next"
                value={next}
                onChange={(event) => setNext(event.target.value as Step | "")}
              >
                <option value="">Choose one</option>
                {remaining.map((step) => (
                  <option key={step.value} value={step.value}>
                    {step.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="delivery-update-note" label="Note for the buyer">
              <Input
                id="delivery-update-note"
                value={note}
                maxLength={300}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
          </div>
          <Button type="submit" disabled={busy} aria-busy={busy} className="self-start">
            {busy ? "Saving..." : "Update delivery"}
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
