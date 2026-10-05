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
  signedIn: boolean;
}

export function RequestDetailClient({
  requestId,
  currency,
  initialQuotes,
  isOwner,
  requestStatus,
  signedIn,
}: RequestDetailProps) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteItem[]>(initialQuotes);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quote form state
  const [quoteData, setQuoteData] = useState({
    amountMajor: 0,
    currency: currency || "NGN",
    timeline: "",
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
        <div className="rounded-lg border border-danger/40 bg-danger-soft p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Quote Submission Bar for Vendors */}
      {!isOwner && requestStatus === "open" && (
        <Card className="border-brand/20 bg-brand/5 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-bold text-ink">Can you supply this?</h3>
              <p className="text-sm text-muted">
                Send the buyer your price and how soon you can deliver.
              </p>
            </div>
            {signedIn ? (
              <Button onClick={() => setShowQuoteForm((v) => !v)} variant={showQuoteForm ? "secondary" : "primary"}>
                {showQuoteForm ? "Close" : "Make an offer"}
              </Button>
            ) : (
              <a
                href={`/login?next=${encodeURIComponent(`/requests/${requestId}`)}`}
                className="inline-flex min-h-11 items-center justify-center rounded-input bg-primary-600 px-[18px] text-sm font-semibold text-white hover:bg-primary-700"
              >
                Sign in to make an offer
              </a>
            )}
          </div>

          {showQuoteForm && (
            <form onSubmit={handleQuoteSubmit} className="mt-6 space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-ink">Your price ({currency})</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quoteData.amountMajor || ""}
                    onChange={(e) => setQuoteData({ ...quoteData, amountMajor: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink">Delivery time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24 hours, or 2-3 business days"
                    value={quoteData.timeline}
                    onChange={(e) => setQuoteData({ ...quoteData, timeline: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">Message to the buyer</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your item condition, delivery timeline, or warranty..."
                  value={quoteData.message}
                  onChange={(e) => setQuoteData({ ...quoteData, message: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowQuoteForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Sending..." : "Send offer"}
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
            <h3 className="font-bold text-ink">Offers ({quotes.length})</h3>
            <p className="text-xs text-muted">
              {isOwner
                ? "Compare what sellers have offered. Accepting one closes the request and opens a handover order."
                : "Only the buyer and each seller can see an offer."}
            </p>
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">
            No offers yet.
          </div>
        ) : (
          <div className="mt-4 divide-y">
            {quotes.map((q) => (
              <div key={q.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{q.provider.displayName}</span>
                    {q.provider.verified && (
                      <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-800">
                        Verified
                      </span>
                    )}
                    {q.provider.reviewsCount > 0 ? (
                      <span className="text-xs text-muted">
                        ★ {q.provider.rating.toFixed(1)} ({q.provider.reviewsCount})
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-ink">{q.message}</p>
                  <p className="text-xs text-muted">
                    Delivery: <span className="font-medium text-ink">{q.timeline}</span> · Posted{" "}
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
                          ? "text-primary-600"
                          : q.status === "rejected"
                          ? "text-danger"
                          : "text-accent-600"
                      }`}
                    >
                      {q.status === "pending" ? "Waiting for the buyer" : q.status === "accepted" ? "Accepted" : q.status === "rejected" ? "Not chosen" : "Withdrawn"}
                    </span>
                  </div>

                  {isOwner && q.status === "pending" && (
                    <Button
                      disabled={acceptingQuoteId === q.id}
                      onClick={() => handleAcceptQuote(q.id)}
                      className="bg-primary-600 hover:bg-primary-700 text-white min-h-11 px-3 text-xs"
                    >
                      {acceptingQuoteId === q.id ? "Accepting..." : "Accept offer"}
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
