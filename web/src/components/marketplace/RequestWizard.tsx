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

export function RequestWizard({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: categories[0]?.slug || "electronics",
    requestType: "good" as "good" | "service" | "bulk_purchase" | "custom",
    budgetMajor: 45000,
    currency: "NGN",
    urgency: "Within 2-3 Days",
    conditionRequired: "Used - Good or Mint",
    city: "Lagos, Nigeria",
    country: "Nigeria",
    fulfillment: "both" as "pickup" | "delivery" | "both",
    deadlineDays: 7,
  });

  const update = (fields: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to post buyer request");
      }

      router.push(`/requests/${json.data.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 md:p-8">
      {/* Progress Bar */}
      <div className="mb-8 flex items-center justify-between border-b pb-4">
        {[
          { num: 1, label: "1. What you need" },
          { num: 2, label: "2. Budget & Urgency" },
          { num: 3, label: "3. Location & Post" },
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-2 text-sm font-semibold ${
              step >= s.num ? "text-brand" : "text-muted"
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step === s.num
                  ? "bg-brand text-white"
                  : step > s.num
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-muted"
              }`}
            >
              {step > s.num ? "✓" : s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-ink">Describe what you are looking for</h2>
            <p className="text-sm text-muted">
              Sellers and verified service providers across Pan-Africa will review your request and send direct quotes.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Request Type</label>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { type: "good", label: "Product / Good", desc: "Phones, parts, goods" },
                { type: "service", label: "Service", desc: "Repair, hiring, design" },
                { type: "bulk_purchase", label: "Bulk Order", desc: "Wholesale supplies" },
                { type: "custom", label: "Custom Project", desc: "Fabrication or tailor" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => update({ requestType: opt.type as any })}
                  className={`rounded-lg border p-3 text-left transition ${
                    formData.requestType === opt.type
                      ? "border-brand bg-brand/5 shadow-sm"
                      : "border-border hover:border-gray-300"
                  }`}
                >
                  <p className="font-semibold text-ink text-sm">{opt.label}</p>
                  <p className="text-xs text-muted">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Category</label>
            <select
              value={formData.category}
              onChange={(e) => update({ category: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Request Title</label>
            <input
              type="text"
              placeholder="e.g. Clean MacBook Pro M1 16GB / 512GB Space Gray"
              value={formData.title}
              onChange={(e) => update({ title: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Detailed Description</label>
            <textarea
              rows={4}
              placeholder="Specify requirements, preferred model years, color, warranty expectations, or deliverables..."
              value={formData.description}
              onChange={(e) => update({ description: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Condition Preference (if applicable)</label>
            <input
              type="text"
              placeholder="e.g. Brand New in Box, or Lightly Used without scratches"
              value={formData.conditionRequired}
              onChange={(e) => update({ conditionRequired: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="button"
              disabled={!formData.title.trim() || formData.title.length < 5 || !formData.description.trim()}
              onClick={() => setStep(2)}
            >
              Next: Budget & Urgency →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-ink">Budget & Timeline</h2>
            <p className="text-sm text-muted">
              Define your expected spend so sellers can provide realistic quotes matching your budget.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Budget Amount</label>
              <input
                type="number"
                min={1}
                value={formData.budgetMajor}
                onChange={(e) => update({ budgetMajor: Number(e.target.value) })}
                className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => update({ currency: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                {["NGN", "KES", "GHS", "ZAR", "EGP", "TZS", "UGX", "RWF", "USD"].map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">How soon do you need this?</label>
            <select
              value={formData.urgency}
              onChange={(e) => update({ urgency: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="Urgent - Today">Urgent - Today (Within 24 Hours)</option>
              <option value="Within 2-3 Days">Within 2-3 Days</option>
              <option value="Within 1 Week">Within 1 Week</option>
              <option value="Flexible / Planning Ahead">Flexible / Planning Ahead</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Accept Quotes For</label>
            <select
              value={formData.deadlineDays}
              onChange={(e) => update({ deadlineDays: Number(e.target.value) })}
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value={3}>3 Days</option>
              <option value={7}>7 Days (Recommended)</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button
              type="button"
              disabled={formData.budgetMajor <= 0}
              onClick={() => setStep(3)}
            >
              Next: Location & Post →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-ink">Location & Delivery Preference</h2>
            <p className="text-sm text-muted">
              Connect with nearby vendors or cross-border logistics sellers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">City / State</label>
              <input
                type="text"
                placeholder="e.g. Lagos, Ikeja"
                value={formData.city}
                onChange={(e) => update({ city: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Country</label>
              <select
                value={formData.country}
                onChange={(e) => update({ country: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                {["Nigeria", "Kenya", "Ghana", "South Africa", "Egypt", "Tanzania", "Uganda", "Rwanda"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Fulfillment Preference</label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {[
                { val: "both", label: "Either Pickup or Delivery" },
                { val: "delivery", label: "Delivery to Me Only" },
                { val: "pickup", label: "Local Pickup Only" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => update({ fulfillment: opt.val as any })}
                  className={`rounded-lg border p-3 text-left transition ${
                    formData.fulfillment === opt.val
                      ? "border-brand bg-brand/5 shadow-sm"
                      : "border-border hover:border-gray-300"
                  }`}
                >
                  <p className="font-semibold text-ink text-sm">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 text-xs text-muted">
            <span className="font-semibold text-ink">Escrow Protection:</span> When you accept a quote, funds are safely placed in licensed escrow until you verify delivery and release payment with your handover OTP.
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button
              type="button"
              disabled={loading || !formData.city.trim()}
              onClick={handleSubmit}
            >
              {loading ? "Publishing Request..." : "Post Buyer Request Now 🚀"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
