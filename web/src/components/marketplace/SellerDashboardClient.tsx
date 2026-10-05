"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Metric } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

interface SellerDashboardProps {
  sellerId: string;
  sellerProfile: {
    displayName: string;
    verified: boolean;
    rating: number;
    reviewsCount: number;
  };
  listings: Array<{
    id: string;
    slug?: string;
    title: string;
    amountMinor: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    totalMinor: number;
    currency: string;
    status: string;
    createdAt: string;
    buyer?: { displayName: string };
  }>;
}

export function SellerDashboardClient({
  sellerProfile,
  listings: initialListings,
  orders,
}: SellerDashboardProps) {
  const [listings, setListings] = useState(initialListings);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycForm, setKycForm] = useState({
    businessName: "",
    registrationNumber: "",
    taxId: "",
    documentUrl: "",
  });
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycSubmitted, setKycSubmitted] = useState(false);

  // Financial aggregates
  const completedOrders = orders.filter((o) => o.status === "completed");
  const inEscrowOrders = orders.filter((o) => o.status === "in_escrow" || o.status === "processing" || o.status === "dispatched");
  const totalRevenueMinor = completedOrders.reduce((sum, o) => sum + o.totalMinor, 0);
  const inEscrowVolumeMinor = inEscrowOrders.reduce((sum, o) => sum + o.totalMinor, 0);

  const togglePause = async (id: string, currentlyPaused: boolean) => {
    try {
      const endpoint = currentlyPaused
        ? `/api/v1/listings/${id}/publish`
        : `/api/v1/listings/${id}/pause`;
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        setListings((prev) =>
          prev.map((l) =>
            l.id === id ? { ...l, status: currentlyPaused ? "active" : "paused" } : l
          )
        );
      }
    } catch {
      // silent
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycSubmitting(true);
    try {
      const res = await fetch("/api/v1/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kycForm),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setKycSubmitted(true);
        setKycModalOpen(false);
      }
    } catch {
      // silent
    } finally {
      setKycSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Verification Banner */}
      {!sellerProfile.verified && (
        <Card className="border-accent-200 bg-accent-50/70 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-bold text-accent-600">
                {kycSubmitted ? "KYC Documents Under Review " : "Become a Verified Pan-African Merchant "}
              </h3>
              <p className="mt-1 text-xs text-accent-600">
                {kycSubmitted
                  ? "Your verification documents have been submitted and are being reviewed by compliance staff."
                  : "Verified sellers get 3x higher quote conversion and badge credibility across all Pan-African regions."}
              </p>
            </div>
            {!kycSubmitted && (
              <Button
                onClick={() => setKycModalOpen(true)}
                className="bg-accent-600 hover:bg-accent-600 text-white min-h-11 px-3 text-xs"
              >
                Submit KYC Verification
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* KYC Modal */}
      {kycModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-surface shadow-2xl">
            <h3 className="font-bold text-lg text-ink">Vendor Verification Application</h3>
            <p className="text-xs text-muted">
              Submit business proof, tax identification, or government ID for verification.
            </p>

            <form onSubmit={handleKycSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lagos Prime Gadgets Ltd"
                  value={kycForm.businessName}
                  onChange={(e) => setKycForm({ ...kycForm, businessName: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Registration / CAC Number</label>
                <input
                  type="text"
                  placeholder="e.g. RC-1928374"
                  value={kycForm.registrationNumber}
                  onChange={(e) => setKycForm({ ...kycForm, registrationNumber: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Tax ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TIN-9920192"
                  value={kycForm.taxId}
                  onChange={(e) => setKycForm({ ...kycForm, taxId: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Proof Document URL (Cloud/Storage)</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={kycForm.documentUrl}
                  onChange={(e) => setKycForm({ ...kycForm, documentUrl: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 px-3 text-xs"
                  onClick={() => setKycModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={kycSubmitting}
                  className="min-h-11 px-3 text-xs"
                >
                  {kycSubmitting ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Financial Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Settled Earnings"
          value={formatMoney(totalRevenueMinor, "NGN")}
        />
        <Metric
          label="Pending Escrow Holding"
          value={formatMoney(inEscrowVolumeMinor, "NGN")}
        />
        <Metric
          label="Total Fulfilled Orders"
          value={String(completedOrders.length)}
        />
        <Metric
          label="Active Product Catalog"
          value={String(listings.filter((l) => l.status === "active").length)}
        />
      </div>

      {/* Incoming Orders Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="font-bold text-ink">Incoming Orders & Fulfillment</h3>
            <p className="text-xs text-muted">
              Orders requiring dispatch and handover OTP verification.
            </p>
          </div>
          <Link href="/dashboard/orders?tab=sales">
            <Button variant="outline" className="min-h-11 px-3 text-xs">
              View All Orders →
            </Button>
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">No seller orders yet.</p>
        ) : (
          <div className="mt-4 divide-y">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex justify-between items-center py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ink">{o.orderNumber}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        o.status === "completed"
                          ? "bg-primary-100 text-primary-800"
                          : o.status === "in_escrow"
                          ? "bg-info-soft text-info"
                          : "bg-accent-100 text-accent-600"
                      }`}
                    >
                      {o.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Buyer: {o.buyer?.displayName || "Customer"} ·{" "}
                    {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold text-sm text-ink">
                    {formatMoney(o.totalMinor, o.currency)}
                  </span>
                  <Link href={`/dashboard/orders/${o.id}`}>
                    <Button variant="outline" className="min-h-11 px-3 text-xs">
                      Fulfill / Verify OTP
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Inventory Catalog Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="font-bold text-ink">Catalog & Inventory Management</h3>
            <p className="text-xs text-muted">
              Manage your active listings, pause inventory, and post new products.
            </p>
          </div>
          <Link href="/sell">
            <Button className="min-h-11 px-3 text-xs">+ Add New Listing</Button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">
            You haven't published any listings yet.
          </p>
        ) : (
          <div className="mt-4 divide-y">
            {listings.map((l) => (
              <div key={l.id} className="flex justify-between items-center py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-ink">{l.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        l.status === "active"
                          ? "bg-primary-100 text-primary-800"
                          : "bg-surface-muted text-ink"
                      }`}
                    >
                      {l.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Price: {formatMoney(l.amountMinor, l.currency)} · Listed{" "}
                    {new Date(l.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => togglePause(l.id, l.status === "paused")}
                    className="min-h-11 px-3 text-xs"
                  >
                    {l.status === "paused" ? "Resume" : "Pause"}
                  </Button>
                  <Link href={`/products/${l.slug || l.id}`}>
                    <Button variant="outline" className="min-h-11 px-3 text-xs">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
