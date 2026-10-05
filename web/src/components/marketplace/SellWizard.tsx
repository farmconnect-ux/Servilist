"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Package,
  Star,
  Trash2,
} from "lucide-react";
import { CategoryIcon } from "@/components/marketplace/CategoryIcon";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, Field, Input, Select, Textarea } from "@/components/ui/form";
import { CURRENCIES, formatMoney, toMinorUnits } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Sell flow (docs/UI_UX_SPEC.md sections 31 to 37): seven steps with a stepper
 * beside the form on desktop and a progress bar on phones. Nothing is
 * pre-filled with sample content; the listing shows only what the seller
 * enters and the photos they upload.
 */

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

const STEPS = ["Type", "Category", "Details", "Photos", "Price", "Delivery", "Preview"] as const;
const MAX_PHOTOS = 8;

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "refurbished", label: "Refurbished" },
  { value: "used_like_new", label: "Used, like new" },
  { value: "used_good", label: "Used, good condition" },
  { value: "used_fair", label: "Used, fair condition" },
];

const FULFILLMENT = [
  { value: "pickup", label: "Pickup", text: "The buyer collects the item from you." },
  { value: "shipping", label: "Seller delivery", text: "You deliver or send the item to the buyer." },
  { value: "both", label: "Either", text: "The buyer can collect it or have it delivered." },
];

const CURRENCY_NAMES: Record<string, string> = {
  NGN: "Nigerian naira",
  KES: "Kenyan shilling",
  GHS: "Ghanaian cedi",
  ZAR: "South African rand",
  USD: "US dollar",
  EGP: "Egyptian pound",
  RWF: "Rwandan franc",
  TZS: "Tanzanian shilling",
  UGX: "Ugandan shilling",
  XOF: "West African CFA franc",
};

interface FormState {
  categorySlug: string;
  title: string;
  description: string;
  condition: string;
  quantity: string;
  photos: string[];
  price: string;
  currency: string;
  negotiable: boolean;
  fulfillment: string;
  city: string;
  country: string;
}

const EMPTY: FormState = {
  categorySlug: "",
  title: "",
  description: "",
  condition: "",
  quantity: "1",
  photos: [],
  price: "",
  currency: "NGN",
  negotiable: false,
  fulfillment: "",
  city: "",
  country: "",
};

/** What is still missing on a step, or null when the step is complete. */
function problem(step: number, form: FormState): string | null {
  switch (step) {
    case 1:
      return form.categorySlug ? null : "Choose a category.";
    case 2:
      if (form.title.trim().length < 3) return "Give your listing a title of at least 3 characters.";
      if (form.description.trim().length < 10) return "Describe the item in at least 10 characters.";
      if (!form.condition) return "Choose the item's condition.";
      if (!(Number(form.quantity) >= 1)) return "Quantity must be at least 1.";
      return null;
    case 3:
      return form.photos.length > 0 ? null : "Add at least one photo.";
    case 4:
      return Number(form.price) > 0 ? null : "Enter a price greater than zero.";
    case 5:
      if (!form.fulfillment) return "Choose how the buyer gets the item.";
      if (form.city.trim().length < 2) return "Enter the city the item is in.";
      if (form.country.trim().length < 2) return "Enter the country the item is in.";
      return null;
    default:
      return null;
  }
}

export function SellWizard({ categories }: { categories: CategoryOption[] }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<{ slug: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const update = (fields: Partial<FormState>) => setForm((current) => ({ ...current, ...fields }));
  const categoryName = categories.find((item) => item.slug === form.categorySlug)?.name ?? "";

  function next() {
    const missing = problem(step, form);
    if (missing) {
      setError(missing);
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function addPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    const room = MAX_PHOTOS - form.photos.length;
    const added: string[] = [];
    let failure: string | null = files.length > room ? `You can add up to ${MAX_PHOTOS} photos.` : null;

    for (const file of Array.from(files).slice(0, room)) {
      const body = new FormData();
      body.set("file", file);
      try {
        const res = await fetch("/api/v1/listings/images", { method: "POST", body });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) added.push(json.data.url);
        else failure = json?.error?.message || "A photo could not be uploaded.";
      } catch {
        failure = "Could not reach Servilist. Check your connection and try again.";
      }
    }

    setForm((current) => ({ ...current, photos: [...current.photos, ...added] }));
    setError(failure);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function movePhoto(from: number, to: number) {
    setForm((current) => {
      const photos = [...current.photos];
      const [moved] = photos.splice(from, 1);
      if (moved !== undefined) photos.splice(to, 0, moved);
      return { ...current, photos };
    });
  }

  async function publish() {
    for (let check = 1; check <= 5; check += 1) {
      const missing = problem(check, form);
      if (missing) {
        setStep(check);
        setError(missing);
        return;
      }
    }
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingType: form.negotiable ? "negotiable" : "fixed_price",
          categorySlug: form.categorySlug,
          title: form.title.trim(),
          description: form.description.trim(),
          condition: form.condition,
          quantity: Math.floor(Number(form.quantity)),
          imageUrl: form.photos[0],
          galleryImages: form.photos.slice(1),
          priceMajor: Number(form.price),
          currency: form.currency,
          negotiable: form.negotiable,
          fulfillment: form.fulfillment,
          city: form.city.trim(),
          country: form.country.trim(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "We couldn't publish your listing. Please try again.");
      }
      setPublished({ slug: json.data.slug || json.data.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't publish your listing.");
    }
    setPublishing(false);
  }

  if (published) {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-pill bg-primary-50 text-primary-700">
          <Check className="size-6" aria-hidden="true" />
        </span>
        <h2 className="text-2xl font-bold text-ink">Listing published</h2>
        <p className="max-w-md text-sm text-ink-soft">
          Buyers can now find it in search and in its category.
        </p>
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <Link href={`/products/${published.slug}`} className={cn(buttonClass("primary"), "flex-1")}>
            View listing
          </Link>
          <Link href="/dashboard" className={cn(buttonClass("secondary"), "flex-1")}>
            Go to dashboard
          </Link>
        </div>
      </Card>
    );
  }

  const priceMinor = Number(form.price) > 0 ? toMinorUnits(Number(form.price), form.currency) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Stepper: a list beside the form on desktop, a progress bar on phones */}
      <nav aria-label="Steps">
        <div className="lg:hidden">
          <p className="text-sm font-semibold text-ink">
            {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")} · {STEPS[step]}
          </p>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-pill bg-line"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
            aria-label="Progress"
          >
            <div
              className="h-full rounded-pill bg-primary-600 transition-all duration-200"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
        <ol className="hidden flex-col gap-1 lg:flex">
          {STEPS.map((label, position) => (
            <li
              key={label}
              aria-current={position === step ? "step" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-input px-3 text-sm",
                position === step ? "bg-primary-50 font-semibold text-primary-800" : "text-ink-soft",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-pill text-xs font-semibold",
                  position < step
                    ? "bg-primary-600 text-white"
                    : position === step
                      ? "border border-primary-600 text-primary-700"
                      : "border border-line-strong text-muted",
                )}
              >
                {position < step ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  String(position + 1).padStart(2, "0")
                )}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </nav>

      <Card className="flex flex-col gap-6 p-4 sm:p-6">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        {step === 0 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-ink">What are you listing?</h2>
            <div className="flex items-start gap-4 rounded-card border-2 border-primary-600 bg-primary-50 p-4">
              <Package className="size-8 shrink-0 text-primary-700" aria-hidden="true" />
              <div>
                <p className="text-base font-semibold text-ink">Sell a product</p>
                <p className="text-sm text-ink-soft">A physical item, new or used, at a price you set.</p>
              </div>
            </div>
            <p className="text-sm text-muted">Services and auctions will be added here when they open.</p>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-ink">Choose a category</h2>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {categories.map((category) => {
                const selected = form.categorySlug === category.slug;
                return (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => update({ categorySlug: category.slug })}
                      aria-pressed={selected}
                      className={cn(
                        "flex min-h-20 w-full flex-col items-start gap-2 rounded-card border p-3 text-left text-sm font-medium transition-colors",
                        selected
                          ? "border-primary-600 bg-primary-50 text-primary-800"
                          : "border-line bg-surface text-ink hover:border-line-strong",
                      )}
                    >
                      <CategoryIcon slug={category.slug} className="size-5" />
                      {category.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-ink">Describe the item</h2>
            <Field id="sell-title" label="Title" hint="Brand, model and the detail buyers search for." required>
              <Input
                id="sell-title"
                value={form.title}
                maxLength={150}
                onChange={(event) => update({ title: event.target.value })}
              />
            </Field>
            <Field
              id="sell-description"
              label="Description"
              hint="Condition, what is included, and any faults."
              required
            >
              <Textarea
                id="sell-description"
                rows={5}
                value={form.description}
                maxLength={5000}
                onChange={(event) => update({ description: event.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="sell-condition" label="Condition" required>
                <Select
                  id="sell-condition"
                  value={form.condition}
                  onChange={(event) => update({ condition: event.target.value })}
                >
                  <option value="">Choose one</option>
                  {CONDITIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="sell-quantity" label="Quantity" required>
                <Input
                  id="sell-quantity"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={form.quantity}
                  onChange={(event) => update({ quantity: event.target.value })}
                />
              </Field>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-ink">Add photos</h2>
            <p className="text-sm text-ink-soft">
              At least 1, and 5 or more sells faster. Up to {MAX_PHOTOS}, JPEG, PNG or WebP, 5 MB each.
              The first photo is the cover.
            </p>
            <input
              ref={fileInput}
              id="sell-photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(event) => addPhotos(event.target.files)}
            />
            <label
              htmlFor="sell-photos"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void addPhotos(event.dataTransfer.files);
              }}
              className={cn(
                "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line-strong p-6 text-center hover:border-primary-600",
                (uploading || form.photos.length >= MAX_PHOTOS) && "pointer-events-none opacity-60",
              )}
            >
              <ImagePlus className="size-8 text-primary-700" aria-hidden="true" />
              <span className="text-sm font-semibold text-ink">
                {uploading ? "Uploading..." : "Add photos"}
              </span>
              <span className="hidden text-xs text-muted md:block">or drag and drop them here</span>
            </label>

            {form.photos.length > 0 ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {form.photos.map((url, position) => (
                  <li key={url} className="flex flex-col gap-1">
                    <div className="relative aspect-square overflow-hidden rounded-input border border-line bg-surface-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Photo ${position + 1}`} className="size-full object-cover" />
                      {position === 0 ? (
                        <span className="absolute top-1 left-1 inline-flex items-center gap-1 rounded-control bg-primary-600 px-1.5 py-0.5 text-xs font-medium text-white">
                          <Star className="size-3" aria-hidden="true" />
                          Cover
                        </span>
                      ) : null}
                    </div>
                    <div className="flex justify-between">
                      <button
                        type="button"
                        disabled={position === 0}
                        onClick={() => movePhoto(position, position - 1)}
                        className="flex size-11 items-center justify-center rounded-input text-ink-soft hover:bg-surface-muted disabled:opacity-40"
                        aria-label={`Move photo ${position + 1} earlier`}
                      >
                        <ChevronLeft className="size-5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          update({ photos: form.photos.filter((_, index) => index !== position) })
                        }
                        className="flex size-11 items-center justify-center rounded-input text-danger hover:bg-danger-soft"
                        aria-label={`Remove photo ${position + 1}`}
                      >
                        <Trash2 className="size-5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={position === form.photos.length - 1}
                        onClick={() => movePhoto(position, position + 1)}
                        className="flex size-11 items-center justify-center rounded-input text-ink-soft hover:bg-surface-muted disabled:opacity-40"
                        aria-label={`Move photo ${position + 1} later`}
                      >
                        <ChevronRight className="size-5" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {step === 4 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-ink">Set your price</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="sell-currency" label="Currency" hint="Buyers see the price in this currency.">
                <Select
                  id="sell-currency"
                  value={form.currency}
                  onChange={(event) => update({ currency: event.target.value })}
                >
                  {Object.keys(CURRENCIES).map((code) => (
                    <option key={code} value={code}>
                      {code} · {CURRENCY_NAMES[code] ?? code}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="sell-price" label="Price" required>
                <Input
                  id="sell-price"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(event) => update({ price: event.target.value })}
                />
              </Field>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.negotiable}
                onChange={(event) => update({ negotiable: event.target.checked })}
                className="size-5 accent-primary-600"
              />
              Negotiable: let buyers send me offers
            </label>
          </section>
        ) : null}

        {step === 5 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-ink">How does the buyer get it?</h2>
            <fieldset className="grid gap-3 sm:grid-cols-3">
              <legend className="sr-only">Handover</legend>
              {FULFILLMENT.map((option) => {
                const selected = form.fulfillment === option.value;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer flex-col gap-1 rounded-card border p-3 transition-colors",
                      selected ? "border-primary-600 bg-primary-50" : "border-line hover:border-line-strong",
                    )}
                  >
                    <input
                      type="radio"
                      name="fulfillment"
                      value={option.value}
                      checked={selected}
                      onChange={() => update({ fulfillment: option.value })}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold text-ink">{option.label}</span>
                    <span className="text-xs text-ink-soft">{option.text}</span>
                  </label>
                );
              })}
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="sell-city" label="City" hint="Shown publicly. Your address is never shown." required>
                <Input
                  id="sell-city"
                  value={form.city}
                  maxLength={100}
                  onChange={(event) => update({ city: event.target.value })}
                />
              </Field>
              <Field id="sell-country" label="Country" required>
                <Input
                  id="sell-country"
                  value={form.country}
                  maxLength={100}
                  onChange={(event) => update({ country: event.target.value })}
                />
              </Field>
            </div>
          </section>
        ) : null}

        {step === 6 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-ink">Preview</h2>
            <p className="text-sm text-ink-soft">This is how buyers will see your listing.</p>
            <div className="grid gap-4 rounded-card border border-line p-4 sm:grid-cols-[200px_1fr]">
              <div className="aspect-[4/3] overflow-hidden rounded-input bg-surface-muted">
                {form.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.photos[0]} alt={form.title} className="size-full object-cover" />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-xs text-muted">{categoryName}</p>
                <h3 className="text-xl font-semibold text-ink">{form.title}</h3>
                <p className="text-2xl font-bold text-ink">{formatMoney(priceMinor, form.currency)}</p>
                <p className="text-sm text-ink-soft">
                  {CONDITIONS.find((option) => option.value === form.condition)?.label} ·{" "}
                  {[form.city, form.country].filter(Boolean).join(", ")}
                  {form.negotiable ? " · Open to offers" : ""}
                </p>
                <p className="mt-2 line-clamp-4 text-sm whitespace-pre-line text-ink-soft">
                  {form.description}
                </p>
                <p className="text-xs text-muted">
                  {form.photos.length === 1 ? "1 photo" : `${form.photos.length} photos`} ·{" "}
                  {FULFILLMENT.find((option) => option.value === form.fulfillment)?.label}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          {step > 0 ? (
            <Button variant="secondary" onClick={back} disabled={publishing}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              {step === STEPS.length - 1 ? "Edit" : "Back"}
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={uploading}>
              Continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button onClick={publish} disabled={publishing} aria-busy={publishing}>
              {publishing ? "Publishing..." : "Publish listing"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
