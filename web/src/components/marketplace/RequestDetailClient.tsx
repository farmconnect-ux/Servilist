"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

interface QuoteItem {
  id: string;
  requestId: string;
  providerId: string;
  amountMinor: number;
  currency: string;
  timeline: string;
  message: string;
  status: string;
  createdAt: string;
  provider: {
    id: string;
    username: string;
    displayName: string;
    rating: number;
    reviewsCount: number;
    verified: boolean;
  };
}

interface RequestDetailProps {
  requestId: string;
  currency: string;
  initialQuotes: QuoteItem[];
  isOwner: boolean;
  requestStatus: string;
}

export function RequestDetailClient({
  requestId,
  currency,
  initialQuotes,
  isOwner,
  requestStatus,
}: RequestDetailProps) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteItem[]>(initialQuotes);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quote form state
  const [quoteData, setQuoteData] = useState({
    amountMajor: 40000,
    currency: currency || "NGN",
    timeline: "2-3 business days",
    message: "",
  });

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/requests/${requestId}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to submit quote");
      }

      setShowQuoteForm(false);
      router.refresh();
      // Reload quotes
      const refRes = await fetch(`/api/v1/requests/${requestId}/quotes`);
      const refJson = await refRes.json();
      if (refJson.success && refJson.data) {
        setQuotes(refJson.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit quote");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    setAcceptingQuoteId(quoteId);
    setError(null);

    try {
      const res = await fetch(`/api/v1/requests/${requestId}/quotes/${quoteId}/accept`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to accept quote");
      }

      router.refresh();
      // Refresh quotes status
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quoteId
            ? { ...q, status: "accepted" }
            : { ...q, status: "rejected" }
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to accept quote");
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Quote Submission Bar for Vendors */}
      {!isOwner && requestStatus === "open" && (
        <Card className="border-brand/20 bg-brand/5 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-bold text-ink">Have what this buyer needs?</h3>
              <p className="text-sm text-muted">
                Submit a competitive proposal or quotation. The buyer will be notified immediately.
              </p>
            </div>
            <Button
              onClick={() => setShowQuoteForm((v) => !v)}
              className="bg-brand hover:bg-brand/90"
            >
              {showQuoteForm ? "Cancel Quote" : "Send Vendor Quote 💬"}
            </Button>
          </div>

          {showQuoteForm && (
            <form onSubmit={handleQuoteSubmit} className="mt-6 space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-ink">Your Offer Amount ({currency})</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quoteData.amountMajor}
                    onChange={(e) => setQuoteData({ ...quoteData, amountMajor: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink">Estimated Timeline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24 hours, or 2-3 business days"
                    value={quoteData.timeline}
                    onChange={(e) => setQuoteData({ ...quoteData, timeline: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">Proposal / Message to Buyer</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your item condition, delivery timeline, or warranty..."
                  value={quoteData.message}
                  onChange={(e) => setQuoteData({ ...quoteData, message: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowQuoteForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting Quote..." : "Submit Quote"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* Submitted Quotes Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="font-bold text-ink">Vendor Quotes ({quotes.length})</h3>
            <p className="text-xs text-muted">
              {isOwner
                ? "Review quotes submitted by sellers. Accepting one will lock the quote into an escrow order."
                : "Active offers submitted on this request."}
            </p>
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">
            No quotes submitted yet. Be the first vendor to respond!
          </div>
        ) : (
          <div className="mt-4 divide-y">
            {quotes.map((q) => (
              <div key={q.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{q.provider.displayName}</span>
                    {q.provider.verified && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        VERIFIED
                      </span>
                    )}
                    <span className="text-xs text-muted">★ {q.provider.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-ink">{q.message}</p>
                  <p className="text-xs text-muted">
                    Timeline: <span className="font-medium text-ink">{q.timeline}</span> · Posted{" "}
                    {new Date(q.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="text-right">
                    <span className="text-lg font-bold text-ink">
                      {formatMoney(q.amountMinor, q.currency)}
                    </span>
                    <span
                      className={`block text-xs font-semibold ${
                        q.status === "accepted"
                          ? "text-emerald-600"
                          : q.status === "rejected"
                          ? "text-red-500"
                          : "text-amber-600"
                      }`}
                    >
                      {q.status.toUpperCase()}
                    </span>
                  </div>

                  {isOwner && q.status === "pending" && (
                    <Button
                      disabled={acceptingQuoteId === q.id}
                      onClick={() => handleAcceptQuote(q.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-9 px-3 text-xs"
                    >
                      {acceptingQuoteId === q.id ? "Accepting..." : "Accept Quote"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
