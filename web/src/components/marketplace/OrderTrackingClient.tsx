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

  const steps = [
    { key: "pending_payment", label: "Order Placed" },
    { key: "in_escrow", label: "Paid, Held by Provider" },
    { key: "dispatched", label: "In Transit" },
    { key: "completed", label: "Handover Verified" },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case "pending_payment":
        return 0;
      case "in_escrow":
        return 1;
      case "dispatched":
      case "delivered":
        return 2;
      case "completed":
        return 3;
      case "cancelled":
        return -1;
      default:
        return 1;
    }
  };

  const currentStepIdx = getStepIndex(status);

  return (
    <div className="space-y-6">
      {/* Escrow Progress Bar */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
          Order Progress
        </h3>

        <div className="mt-6 flex items-center justify-between">
          {steps.map((s, idx) => {
            const isCompleted = currentStepIdx >= idx;
            const isCurrent = currentStepIdx === idx;

            return (
              <div key={s.key} className="flex flex-1 flex-col items-center relative">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                    isCompleted
                      ? "bg-brand text-white shadow-sm"
                      : "bg-gray-100 text-muted"
                  } ${isCurrent ? "ring-4 ring-brand/20" : ""}`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span className="mt-2 text-[11px] font-semibold text-center text-ink">
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
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
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
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
              className="min-h-9 px-3 text-xs"
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
        <Card className="border-amber-200 bg-amber-50/60 p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🔑</span>
            <div>
              <h4 className="font-bold text-amber-900 text-base">
                Your Secret Handover OTP Code
              </h4>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                Provide this 6-digit code to the delivery driver or seller <strong>ONLY AFTER</strong> you have physically received and inspected the item.
              </p>

              <div className="mt-4 flex items-center gap-2">
                <div className="rounded-xl border border-amber-300 bg-white px-6 py-3 font-mono text-2xl font-black tracking-widest text-ink shadow-inner">
                  {otpCode || "••••••"}
                </div>
              </div>

              <p className="mt-3 text-[11px] text-amber-700">
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
                  className="min-h-9 px-3 text-xs"
                >
                  Mark as dispatched
                </Button>
              )}
              <Button
                variant="outline"
                disabled={actionBusy}
                onClick={() => orderAction("stage", { stage: "delivered" })}
                className="min-h-9 px-3 text-xs"
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
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
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
                className="flex-1 rounded-lg border border-border px-3 py-2 text-center font-mono text-lg font-bold tracking-widest focus:border-brand focus:outline-none"
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
        <Card className="border-emerald-200 bg-emerald-50/50 p-6 text-emerald-950">
          <h4 className="text-base font-bold flex items-center gap-2">
            <span>🎉</span> Handover Verified & Escrow Released
          </h4>
          <p className="mt-1 text-xs text-emerald-800">
            The handover code was confirmed. The order is complete and the payment is due to the seller.
          </p>
          {completedAt && (
            <p className="mt-2 text-[11px] text-emerald-700">
              Completed on: {new Date(completedAt).toLocaleString()}
            </p>
          )}
        </Card>
      )}

      {status === "disputed" && (
        <Card className="border-red-200 bg-red-50/50 p-6">
          <h4 className="font-bold text-red-800 text-sm">This order is under review</h4>
          <p className="mt-1 text-xs text-red-700">
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
              className="text-xs text-red-600 border-red-200 hover:bg-red-50 min-h-9 px-3"
            >
              Raise an Escrow Dispute ⚠️
            </Button>
          ) : (
            <Card className="w-full border-red-200 p-6">
              <h4 className="font-bold text-red-800 text-sm">Open Dispute with Support</h4>
              <p className="text-xs text-muted mt-1">
                A Servilist mediator will review the case, hold the funds, and assist both parties.
              </p>

              <form onSubmit={handleDispute} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink">Reason for Dispute</label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none"
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
                    className="min-h-9 px-3 text-xs"
                    onClick={() => setDisputeOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={disputeLoading}
                    className="bg-red-600 hover:bg-red-700 text-white min-h-9 px-3 text-xs"
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
