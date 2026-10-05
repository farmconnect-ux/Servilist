"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Alert, Field, Input, Select, Textarea } from "@/components/ui/form";
import { CURRENCIES, formatMoney, toMinorUnits } from "@/lib/money";

/**
 * Post a request (docs/UI_UX_SPEC.md section 22). It opens with one question,
 * not a long form; the details follow, and the buyer sees a preview before
 * publishing. Nothing is pre-filled with sample content.
 */

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

const NEEDED_BY = [
  { days: 1, label: "Today or tomorrow" },
  { days: 3, label: "Within 3 days" },
  { days: 7, label: "Within a week" },
  { days: 14, label: "Within 2 weeks" },
  { days: 30, label: "Within a month" },
];

interface FormState {
  need: string;
  title: string;
  requestType: "good" | "service";
  category: string;
  budget: string;
  currency: string;
  city: string;
  country: string;
  deadlineDays: number;
  fulfillment: "pickup" | "shipping" | "both";
}

const EMPTY: FormState = {
  need: "",
  title: "",
  requestType: "good",
  category: "",
  budget: "",
  currency: "NGN",
  city: "",
  country: "",
  deadlineDays: 7,
  fulfillment: "both",
};

/** A short title taken from the start of what the buyer wrote. */
function suggestTitle(need: string): string {
  const firstLine = need.trim().split(/[\n.!?]/)[0]?.trim() ?? "";
  return firstLine.replace(/^(i need|i want|i am looking for|i'm looking for|looking for)\s+/i, "").slice(0, 100);
}

function detailsProblem(form: FormState): string | null {
  if (form.title.trim().length < 5) return "Give your request a short title of at least 5 characters.";
  if (!form.category) return "Choose a category.";
  if (!(Number(form.budget) > 0)) return "Enter your budget.";
  if (form.city.trim().length < 2) return "Enter your city.";
  if (form.country.trim().length < 2) return "Enter your country.";
  return null;
}

export function RequestWizard({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const update = (fields: Partial<FormState>) => setForm((current) => ({ ...current, ...fields }));
  const neededBy = NEEDED_BY.find((option) => option.days === form.deadlineDays)?.label ?? "";

  function continueFromNeed() {
    if (form.need.trim().length < 10) {
      setError("Tell sellers a little more about what you need.");
      return;
    }
    setError(null);
    if (!form.title) update({ title: suggestTitle(form.need) });
    setStep(1);
  }

  function continueFromDetails() {
    const missing = detailsProblem(form);
    if (missing) {
      setError(missing);
      return;
    }
    setError(null);
    setStep(2);
  }

  async function publish() {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.need.trim(),
          category: form.category,
          requestType: form.requestType,
          budgetMajor: Number(form.budget),
          currency: form.currency,
          urgency: neededBy,
          city: form.city.trim(),
          country: form.country.trim(),
          fulfillment: form.fulfillment,
          deadlineDays: form.deadlineDays,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "We couldn't publish your request. Please try again.");
      }
      router.push(`/requests/${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't publish your request.");
      setPublishing(false);
    }
  }

  return (
    <Card className="flex flex-col gap-6 p-4 sm:p-6">
      <p className="text-sm font-semibold text-muted" aria-live="polite">
        Step {step + 1} of 3
      </p>
      {error ? <Alert tone="danger">{error}</Alert> : null}

      {step === 0 ? (
        <section className="flex flex-col gap-4">
          <label htmlFor="request-need" className="text-2xl font-bold text-ink">
            What are you looking for?
          </label>
          <Textarea
            id="request-need"
            rows={6}
            maxLength={5000}
            value={form.need}
            onChange={(event) => update({ need: event.target.value })}
            placeholder="For example: I need a fairly used Toyota Camry between 2016 and 2019, in good condition, around Lagos."
            className="text-base"
          />
          <div className="flex justify-end">
            <Button size="lg" onClick={continueFromNeed}>
              Continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-ink">A few details</h2>
          <Field id="request-title" label="Short title" hint="This is what sellers see first." required>
            <Input
              id="request-title"
              value={form.title}
              maxLength={150}
              onChange={(event) => update({ title: event.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="request-type" label="I need">
              <Select
                id="request-type"
                value={form.requestType}
                onChange={(event) =>
                  update({ requestType: event.target.value === "service" ? "service" : "good" })
                }
              >
                <option value="good">A product</option>
                <option value="service">A service</option>
              </Select>
            </Field>
            <Field id="request-category" label="Category" required>
              <Select
                id="request-category"
                value={form.category}
                onChange={(event) => update({ category: event.target.value })}
              >
                <option value="">Choose one</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="request-currency" label="Currency">
              <Select
                id="request-currency"
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
            <Field id="request-budget" label="Budget" hint="The most you expect to pay." required>
              <Input
                id="request-budget"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={form.budget}
                onChange={(event) => update({ budget: event.target.value })}
              />
            </Field>
            <Field id="request-city" label="City" required>
              <Input
                id="request-city"
                value={form.city}
                maxLength={100}
                onChange={(event) => update({ city: event.target.value })}
              />
            </Field>
            <Field id="request-country" label="Country" required>
              <Input
                id="request-country"
                value={form.country}
                maxLength={100}
                onChange={(event) => update({ country: event.target.value })}
              />
            </Field>
            <Field id="request-deadline" label="Needed by">
              <Select
                id="request-deadline"
                value={String(form.deadlineDays)}
                onChange={(event) => update({ deadlineDays: Number(event.target.value) })}
              >
                {NEEDED_BY.map((option) => (
                  <option key={option.days} value={option.days}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="request-fulfillment" label="How you want to receive it">
              <Select
                id="request-fulfillment"
                value={form.fulfillment}
                onChange={(event) =>
                  update({ fulfillment: event.target.value as FormState["fulfillment"] })
                }
              >
                <option value="both">Pickup or delivery</option>
                <option value="pickup">I will collect it</option>
                <option value="shipping">Delivered to me</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-between gap-3">
            <Button variant="secondary" onClick={() => setStep(0)}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
            <Button onClick={continueFromDetails}>
              Preview
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-ink">Preview</h2>
          <p className="text-sm text-ink-soft">This is how sellers will see your request.</p>
          <div className="flex flex-col gap-3 rounded-card border border-line p-4">
            <Badge tone="brand" className="self-start">
              {form.requestType === "service" ? "Service needed" : "Need"}
            </Badge>
            <h3 className="text-xl font-semibold text-ink">{form.title}</h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted">Budget</dt>
                <dd className="font-semibold text-ink">
                  {formatMoney(toMinorUnits(Number(form.budget) || 0, form.currency), form.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Location</dt>
                <dd className="text-ink">{[form.city, form.country].filter(Boolean).join(", ")}</dd>
              </div>
              <div>
                <dt className="text-muted">Needed by</dt>
                <dd className="text-ink">{neededBy}</dd>
              </div>
            </dl>
            <p className="text-sm whitespace-pre-line text-ink-soft">{form.need}</p>
          </div>
          <div className="flex justify-between gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} disabled={publishing}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Edit
            </Button>
            <Button onClick={publish} disabled={publishing} aria-busy={publishing}>
              {publishing ? "Publishing..." : "Publish request"}
            </Button>
          </div>
        </section>
      ) : null}
    </Card>
  );
}
