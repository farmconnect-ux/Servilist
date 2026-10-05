"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OrderTrackingProps {
  orderId: string;
  orderNumber: string;
  status: string;
  isBuyer: boolean;
  isSeller: boolean;
  otpCode?: string | null;
  completedAt?: string | null;
  placedAt?: string | null;
  paidAt?: string | null;
  /** When an unpaid order stops holding the item. */
  paymentDueAt?: string;
  /** Payment providers the buyer can use for this order. */
  providers?: Array<{ name: string; label: string; description: string }>;
  /** Disputes open with the moderation tools (Sprint 5). */
  disputesOpen?: boolean;
}

const AWAITING_HANDOVER = ["in_escrow", "dispatched", "delivered"];

export function OrderTrackingClient({
  orderId,
  orderNumber,
  status: initialStatus,
  isBuyer,
  isSeller,
  otpCode,
  completedAt,
  placedAt,
  paidAt,
  paymentDueAt,
  providers = [],
  disputesOpen = false,
}: OrderTrackingProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [sellerOtpInput, setSellerOtpInput] = useState("");
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("item_not_received");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch(`/api/v1/orders/${orderId}/release-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: sellerOtpInput.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Invalid OTP code");
      }

      setStatus("completed");
      router.refresh();
    } catch (err: any) {
      setOtpError(err.message || "Failed to verify OTP");
    } finally {
      setSubmittingOtp(false);
    }
  };

  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /** Pay, cancel, or move a stage. The server decides whether each is allowed. */
  const orderAction = async (path: "pay" | "cancel" | "stage", body: Record<string, string>) => {
    setActionBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "That could not be done. Please try again.");
      }
      if (path === "pay") {
        window.location.href = json.data.checkoutUrl;
        return;
      }
      setStatus(json.data.status);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "That could not be done.");
    }
    setActionBusy(false);
  };

  const awaitingHandover = AWAITING_HANDOVER.includes(status);

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisputeLoading(true);

    try {
      const res = await fetch(`/api/v1/orders/${orderId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: disputeReason,
          description: disputeDescription,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to open dispute");
      }

      setStatus("disputed");
      setDisputeOpen(false);
      router.refresh();
    } catch (err: any) {
      setOtpError(err.message || "Failed to submit dispute");
    } finally {
      setDisputeLoading(false);
    }
  };

  // Section 41: each stage with its state and, where known, when it happened
  const reached = { pending_payment: 0, in_escrow: 1, dispatched: 2, delivered: 3, completed: 4 }[status] ?? 1;
  const closed = status === "cancelled" || status === "refunded";
  const stages = [
    { label: "Order placed", at: placedAt },
    { label: "Payment confirmed", at: paidAt },
    { label: "Dispatched", at: null },
    { label: "Delivered", at: null },
    { label: "Completed", at: completedAt },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-ink">Order progress</h2>
        {closed ? (
          <p className="mt-2 text-sm text-ink-soft">
            {status === "cancelled" ? "This order was cancelled." : "This order was refunded."}
          </p>
        ) : (
          <ol className="mt-4 flex flex-col">
            {stages.map((stage, index) => {
              const done = index < reached || status === "completed";
              const current = index === reached && status !== "completed";
              return (
                <li key={stage.label} className="flex gap-3" aria-current={current ? "step" : undefined}>
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-pill border-2 text-xs font-semibold ${
                        done
                          ? "border-primary-600 bg-primary-600 text-white"
                          : current
                            ? "border-primary-600 bg-surface text-primary-700"
                            : "border-line-strong bg-surface text-muted"
                      }`}
                    >
                      {done ? "✓" : ""}
                    </span>
                    {index < stages.length - 1 ? (
                      <span className={`w-0.5 flex-1 ${done ? "bg-primary-600" : "bg-line"}`} />
                    ) : null}
                  </div>
                  <div className="pb-5">
                    <p className={`text-sm ${done || current ? "font-semibold text-ink" : "text-muted"}`}>
                      {stage.label}
                      {current ? <span className="font-normal text-ink-soft"> (current)</span> : null}
                    </p>
                    {stage.at && (done || current) ? (
                      <p className="text-xs text-muted">
                        {new Date(stage.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      {actionError && (
        <div className="rounded-lg border border-danger/40 bg-danger-soft p-3 text-xs text-danger">
          {actionError}
        </div>
      )}

      {/* Buyer: pay for or cancel an unpaid order */}
      {isBuyer && status === "pending_payment" && (
        <Card className="p-6">
          <h4 className="font-bold text-ink">Complete your payment</h4>
          <p className="mt-1 text-xs text-muted">
            The item is held for you
            {paymentDueAt ? ` until ${new Date(paymentDueAt).toLocaleTimeString()}` : ""}. After that
            the order closes and you can order again.
          </p>
          {providers.length === 0 ? (
            <p className="mt-4 rounded-lg border border-accent-200 bg-accent-50 p-3 text-sm text-accent-600">
              Online payment is not available yet.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {providers.map((p) => (
                <Button
                  key={p.name}
                  disabled={actionBusy}
                  onClick={() => orderAction("pay", { provider: p.name })}
                  className="font-bold"
                >
                  Pay with {p.label}
                </Button>
              ))}
            </div>
          )}
          <div className="mt-3">
            <Button
              variant="outline"
              disabled={actionBusy}
              onClick={() => orderAction("cancel", {})}
              className="min-h-11 px-3 text-xs"
            >
              Cancel this order
            </Button>
          </div>
        </Card>
      )}

      {isSeller && status === "pending_payment" && (
        <Card className="p-6">
          <h4 className="font-bold text-ink">Waiting for the buyer to pay</h4>
          <p className="mt-1 text-xs text-muted">
            Do not hand over the item yet. This page changes when payment is confirmed.
          </p>
        </Card>
      )}

      {/* Buyer's Secret Handover OTP */}
      {isBuyer && awaitingHandover && (
        <Card className="border-accent-200 bg-accent-50/60 p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl"></span>
            <div>
              <h4 className="font-bold text-accent-600 text-base">
                Your Secret Handover OTP Code
              </h4>
              <p className="mt-1 text-xs text-accent-600 leading-relaxed">
                Provide this 6-digit code to the delivery driver or seller <strong>ONLY AFTER</strong> you have physically received and inspected the item.
              </p>

              <div className="mt-4 flex items-center gap-2">
                <div className="rounded-xl border border-accent-200 bg-surface px-6 py-3 font-mono text-2xl font-bold tracking-wide text-ink shadow-inner">
                  {otpCode || "••••••"}
                </div>
              </div>

              <p className="mt-3 text-[11px] text-accent-600">
                Giving this code completes the order and releases the payment to the seller. It cannot be undone.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Seller's Handover Verification Form */}
      {isSeller && awaitingHandover && (
        <Card className="p-6">
          {status !== "delivered" && (
            <div className="mb-4 flex flex-wrap gap-2 border-b pb-4">
              {status === "in_escrow" && (
                <Button
                  variant="outline"
                  disabled={actionBusy}
                  onClick={() => orderAction("stage", { stage: "dispatched" })}
                  className="min-h-11 px-3 text-xs"
                >
                  Mark as dispatched
                </Button>
              )}
              <Button
                variant="outline"
                disabled={actionBusy}
                onClick={() => orderAction("stage", { stage: "delivered" })}
                className="min-h-11 px-3 text-xs"
              >
                Mark as delivered
              </Button>
            </div>
          )}
          <h4 className="font-bold text-ink">Verify Handover & Release Escrow</h4>
          <p className="mt-1 text-xs text-muted">
            When you hand the item to the buyer, ask for their 6-digit handover code. Entering it here completes the order and marks the payment as due to you. Five wrong attempts lock the order.
          </p>

          <form onSubmit={handleVerifyOtp} className="mt-4 space-y-3">
            {otpError && (
              <div className="rounded-lg border border-danger/40 bg-danger-soft p-3 text-xs text-danger">
                {otpError}
              </div>
            )}

            <div className="flex max-w-sm gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit OTP"
                value={sellerOtpInput}
                onChange={(e) => setSellerOtpInput(e.target.value)}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-center font-mono text-lg font-bold tracking-wide focus:border-brand focus:outline-none"
              />
              <Button
                type="submit"
                disabled={submittingOtp || sellerOtpInput.length !== 6}
                className="font-bold"
              >
                {submittingOtp ? "Checking..." : "Complete order"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Completed State */}
      {status === "completed" && (
        <Card className="border-primary-200 bg-primary-50/50 p-6 text-primary-900">
          <h4 className="text-base font-bold flex items-center gap-2">
            <span></span> Handover Verified & Escrow Released
          </h4>
          <p className="mt-1 text-xs text-primary-800">
            The handover code was confirmed. The order is complete and the payment is due to the seller.
          </p>
          {completedAt && (
            <p className="mt-2 text-[11px] text-primary-700">
              Completed on: {new Date(completedAt).toLocaleString()}
            </p>
          )}
        </Card>
      )}

      {status === "disputed" && (
        <Card className="border-danger/40 bg-danger-soft/50 p-6">
          <h4 className="font-bold text-danger text-sm">This order is under review</h4>
          <p className="mt-1 text-xs text-danger">
            Servilist support is looking at this order. The payment stays with the provider until
            it is resolved.
          </p>
        </Card>
      )}

      {status === "cancelled" && (
        <Card className="p-6">
          <h4 className="font-bold text-ink text-sm">This order was cancelled</h4>
          <p className="mt-1 text-xs text-muted">Nothing was charged for it.</p>
        </Card>
      )}

      {/* Dispute Section */}
      {disputesOpen && awaitingHandover && (
        <div className="flex justify-end pt-2">
          {!disputeOpen ? (
            <Button
              variant="outline"
              onClick={() => setDisputeOpen(true)}
              className="text-xs text-danger border-danger/40 hover:bg-danger-soft min-h-11 px-3"
            >
              Raise an Escrow Dispute             </Button>
          ) : (
            <Card className="w-full border-danger/40 p-6">
              <h4 className="font-bold text-danger text-sm">Open Dispute with Support</h4>
              <p className="text-xs text-muted mt-1">
                A Servilist mediator will review the case, hold the funds, and assist both parties.
              </p>

              <form onSubmit={handleDispute} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink">Reason for Dispute</label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs focus:border-brand focus:outline-none"
                  >
                    <option value="item_not_received">Item Not Received / Delayed</option>
                    <option value="item_damaged_or_faulty">Item Damaged or Broken</option>
                    <option value="counterfeit_or_mismatched">Item Does Not Match Description</option>
                    <option value="vendor_unresponsive">Seller Unresponsive</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink">Describe the problem</label>
                  <textarea
                    rows={3}
                    required
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    placeholder="Provide details of what happened..."
                    className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-xs focus:border-brand focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="min-h-11 px-3 text-xs"
                    onClick={() => setDisputeOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={disputeLoading}
                    className="bg-danger hover:bg-danger text-white min-h-11 px-3 text-xs"
                  >
                    {disputeLoading ? "Submitting..." : "Submit Dispute"}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
