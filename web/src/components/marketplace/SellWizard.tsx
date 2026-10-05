"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export function SellWizard({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    listingType: "fixed_price",
    categorySlug: categories[0]?.slug || "electronics",
    title: "",
    description: "",
    condition: "used_good",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    priceMajor: 50000,
    currency: "NGN",
    negotiable: false,
    quantity: 1,
    city: "Lagos, Nigeria",
    country: "Nigeria",
    fulfillment: "both",
  });

  const update = (fields: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create listing");
      }

      router.push(`/products/${json.data.slug || json.data.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col gap-6 p-6 sm:p-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between border-b border-line pb-4 text-xs font-semibold">
        <span className="text-brand font-bold">Step {step} of 4: {
          step === 1 ? "Format & Category" :
          step === 2 ? "Title & Description" :
          step === 3 ? "Pricing & Currency" :
          "Location & Preview"
        }</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`size-2.5 rounded-full ${s <= step ? "bg-brand" : "bg-line"}`}
            />
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-control bg-danger-soft p-3 text-xs font-semibold text-danger">
          {error}
        </div>
      ) : null}

      {/* STEP 1: Format & Category */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-bold text-ink">Choose Listing Format</label>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { id: "fixed_price", label: "Buy It Now", desc: "Fixed sale price" },
                { id: "negotiable", label: "Negotiable", desc: "Open to offers" },
                { id: "auction", label: "Auction", desc: "Timed bidding" },
                { id: "service", label: "Service", desc: "Handyman/trade" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => update({ listingType: fmt.id })}
                  className={`flex flex-col gap-1 rounded-control border p-3 text-left transition-all ${
                    formData.listingType === fmt.id
                      ? "border-brand bg-brand-soft/30 font-bold"
                      : "border-line bg-page hover:border-brand"
                  }`}
                >
                  <span className="text-sm font-bold text-ink">{fmt.label}</span>
                  <span className="text-xs text-muted">{fmt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="catSelect" className="text-sm font-bold text-ink">Marketplace Category</label>
            <select
              id="catSelect"
              value={formData.categorySlug}
              onChange={(e) => update({ categorySlug: e.target.value })}
              className="mt-1.5 min-h-11 w-full rounded-control border border-line bg-page px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="condSelect" className="text-sm font-bold text-ink">Item Condition</label>
            <select
              id="condSelect"
              value={formData.condition}
              onChange={(e) => update({ condition: e.target.value })}
              className="mt-1.5 min-h-11 w-full rounded-control border border-line bg-page px-3 text-sm"
            >
              <option value="new">Brand New (Unopened)</option>
              <option value="refurbished">Refurbished / Certified</option>
              <option value="used_like_new">Used - Like New</option>
              <option value="used_good">Used - Good Condition</option>
              <option value="used_fair">Used - Fair Condition</option>
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" onClick={() => setStep(2)}>Next: Details →</Button>
          </div>
        </div>
      )}

      {/* STEP 2: Details & Images */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <label htmlFor="itemTitle" className="text-sm font-bold text-ink">Listing Title *</label>
            <input
              id="itemTitle"
              type="text"
              value={formData.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="e.g. iPhone 15 Pro Max 256GB Natural Titanium"
              className="mt-1.5 min-h-11 w-full rounded-control border border-line bg-page px-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="itemDesc" className="text-sm font-bold text-ink">Full Description & Specs *</label>
            <textarea
              id="itemDesc"
              rows={4}
              value={formData.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Detail warranty, specifications, included accessories, or reasons for selling..."
              className="mt-1.5 w-full rounded-control border border-line bg-page p-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="itemImg" className="text-sm font-bold text-ink">Primary Photo Web URL</label>
            <input
              id="itemImg"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => update({ imageUrl: e.target.value })}
              placeholder="https://..."
              className="mt-1.5 min-h-11 w-full rounded-control border border-line bg-page px-3 text-sm"
            />
            <p className="mt-1 text-xs text-muted">Enter a direct photo URL or use the sample photo provided.</p>
          </div>

          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>← Back</Button>
            <Button
              type="button"
              disabled={formData.title.length < 3 || formData.description.length < 10}
              onClick={() => setStep(3)}
            >
              Next: Pricing →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Pricing & Currency */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="priceCurrency" className="text-sm font-bold text-ink">Currency</label>
              <select
                id="priceCurrency"
                value={formData.currency}
                onChange={(e) => update({ currency: e.target.value })}
                className="mt-1.5 min-h-11 w-full rounded-control border border-line bg-page px-3 text-sm font-bold"
              >
                <option value="NGN">NGN - Nigerian Naira (₦)</option>
                <option value="KES">KES - Kenyan Shilling (KSh)</option>
                <option value="GHS">GHS - Ghanaian Cedi (GH₵)</option>
                <option value="ZAR">ZAR - South African Rand (R)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EGP">EGP - Egyptian Pound (E£)</option>
                <option value="RWF">RWF - Rwandan Franc (FRw)</option>
                <option value="TZS">TZS - Tanzanian Shilling (TSh)</option>
                <option value="UGX">UGX - Ugandan Shilling (USh)</option>
                <option value="XOF">XOF - West African CFA (CFA)</option>
              </select>
            </div>

            <div>
              <label htmlFor="priceAmount" className="text-sm font-bold text-ink">Price</label>
              <input
                id="priceAmount"
                type="number"
                min="0"
                step="any"
                value={formData.priceMajor}
                onChange={(e) => update({ priceMajor: parseFloat(e.target.value) || 0 })}
                className="mt-1.5 min-h-11 w-full rounded-control border border-line bg-page px-3 text-sm font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="negCheck"
              type="checkbox"
              checked={formData.negotiable}
              onChange={(e) => update({ negotiable: e.target.checked })}
              className="size-4 rounded border-line"
            />
            <label htmlFor="negCheck" className="text-sm font-medium text-ink">
              Allow buyers to make offers / negotiate price
            </label>
          </div>

          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>← Back</Button>
            <Button type="button" onClick={() => setStep(4)}>Next: Location & Preview →</Button>
          </div>
        </div>
      )}

      {/* STEP 4: Location & Publish */}
      {step === 4 && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="citySelect" className="text-sm font-bold text-ink">Primary City / Hub</label>
              <select
                id="citySelect"
                value={formData.city}
                onChange={(e) => update({ city: e.target.value })}
                className="mt-1.5 min-h-11 w-full rounded-control border border-line bg-page px-3 text-sm"
              >
                <option value="Lagos, Nigeria">Lagos, Nigeria</option>
                <option value="Abuja, Nigeria">Abuja, Nigeria</option>
                <option value="Nairobi, Kenya">Nairobi, Kenya</option>
                <option value="Mombasa, Kenya">Mombasa, Kenya</option>
                <option value="Accra, Ghana">Accra, Ghana</option>
                <option value="Kumasi, Ghana">Kumasi, Ghana</option>
                <option value="Johannesburg, South Africa">Johannesburg, South Africa</option>
                <option value="Cape Town, South Africa">Cape Town, South Africa</option>
                <option value="Kigali, Rwanda">Kigali, Rwanda</option>
                <option value="Cairo, Egypt">Cairo, Egypt</option>
              </select>
            </div>

            <div>
              <label htmlFor="fulSelect" className="text-sm font-bold text-ink">Fulfillment Method</label>
              <select
                id="fulSelect"
                value={formData.fulfillment}
                onChange={(e) => update({ fulfillment: e.target.value })}
                className="mt-1.5 min-h-11 w-full rounded-control border border-line bg-page px-3 text-sm"
              >
                <option value="both">Local Meetup + Courier Delivery</option>
                <option value="pickup">Local Meetup Only</option>
                <option value="shipping">Nationwide Shipping Only</option>
              </select>
            </div>
          </div>

          {/* Summary Box */}
          <div className="rounded-control bg-page p-4 border border-line text-xs">
            <p className="font-bold text-ink">Ready to Publish:</p>
            <p className="mt-1 font-semibold text-brand text-sm">{formData.title}</p>
            <p className="text-muted">{formData.currency} {formData.priceMajor.toLocaleString()} · {formData.city}</p>
          </div>

          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={() => setStep(3)}>← Back</Button>
            <Button type="button" disabled={loading} onClick={handlePublish}>
              {loading ? "Publishing..." : "Publish Listing across Africa"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
