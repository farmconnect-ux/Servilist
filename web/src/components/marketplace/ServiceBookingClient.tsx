"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

interface ServicePackage {
  name: string;
  priceMinor: number;
  timeline: string;
  deliverables?: string;
}

interface ServiceBookingProps {
  serviceId: string;
  currency: string;
  basePriceMinor: number;
  packages: ServicePackage[];
  providerId: string;
}

export function ServiceBookingClient({
  serviceId,
  currency,
  basePriceMinor,
  packages: availablePackages,
}: ServiceBookingProps) {
  const router = useRouter();
  const packagesList = availablePackages.length > 0 ? availablePackages : [
    { name: "Standard", priceMinor: basePriceMinor, timeline: "2-3 business days", deliverables: "Standard service deliverables" }
  ];

  const [selectedPkg, setSelectedPkg] = useState<ServicePackage>(packagesList[0]!);
  const [modalOpen, setModalOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/services/${serviceId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageName: selectedPkg.name,
          amountMajor: selectedPkg.priceMinor / 100,
          currency,
          deliverablesNote: notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to book service");
      }

      setModalOpen(false);
      router.push(`/dashboard/orders?tab=purchases`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
          Service Packages & Pricing
        </h3>

        <div className="mt-4 space-y-3">
          {packagesList.map((pkg) => (
            <div
              key={pkg.name}
              onClick={() => setSelectedPkg(pkg)}
              className={`cursor-pointer rounded-xl border p-4 transition ${
                selectedPkg.name === pkg.name
                  ? "border-brand bg-brand/5 shadow-sm"
                  : "border-border hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-sm">{pkg.name}</span>
                <span className="font-extrabold text-brand text-base">
                  {formatMoney(pkg.priceMinor, currency)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">Estimated Delivery: {pkg.timeline}</p>
              {pkg.deliverables && (
                <p className="mt-2 text-xs text-ink">{pkg.deliverables}</p>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="mt-6 w-full font-bold"
        >
          Book {selectedPkg.name} ({formatMoney(selectedPkg.priceMinor, currency)}) 💼
        </Button>

        <p className="mt-3 text-[11px] text-center text-muted">
          🛡️ Escrow Protected: Funds are released only after service milestones are delivered and verified.
        </p>
      </Card>

      {/* Booking Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white shadow-2xl">
            <h3 className="font-bold text-lg text-ink">Confirm Service Booking</h3>
            <p className="text-xs text-muted">
              Package: <strong>{selectedPkg.name}</strong> · Amount:{" "}
              <strong>{formatMoney(selectedPkg.priceMinor, currency)}</strong>
            </p>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink">
                  Requirements / Notes for Provider
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your schedule, specific deliverables, or access details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-9 px-3 text-xs"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="min-h-9 px-3 text-xs"
                >
                  {submitting ? "Booking..." : "Confirm & Book Now"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
