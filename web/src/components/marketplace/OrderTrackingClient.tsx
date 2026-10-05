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
  otpVerifiedAt?: string | null;
}

export function OrderTrackingClient({
  orderId,
  orderNumber,
  status: initialStatus,
  isBuyer,
  isSeller,
  otpCode,
  otpVerifiedAt,
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
    { key: "pending_payment", label: "Payment Initiated" },
    { key: "in_escrow", label: "Held in Escrow" },
    { key: "dispatched", label: "In Transit" },
    { key: "completed", label: "Handover Verified" },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case "pending_payment":
        return 0;
      case "payment_confirmed":
      case "in_escrow":
      case "processing":
        return 1;
      case "dispatched":
      case "delivered":
        return 2;
      case "completed":
        return 3;
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
          Escrow Protection Lifecycle
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

      {/* Buyer's Secret Handover OTP */}
      {isBuyer && status !== "completed" && status !== "cancelled" && (
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
                ⚠️ Handing over this code releases funds from escrow to the seller permanently.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Seller's Handover Verification Form */}
      {isSeller && status !== "completed" && status !== "cancelled" && (
        <Card className="p-6">
          <h4 className="font-bold text-ink">Verify Handover & Release Escrow</h4>
          <p className="mt-1 text-xs text-muted">
            Upon delivering the package to the buyer, ask them for their 6-digit Handover OTP. Entering it here releases the escrow payment directly to your balance.
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
                {submittingOtp ? "Verifying..." : "Verify & Release 🚀"}
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
            This transaction has been successfully verified via OTP release. Funds have been credited to the seller's account.
          </p>
          {otpVerifiedAt && (
            <p className="mt-2 text-[11px] text-emerald-700">
              Completed on: {new Date(otpVerifiedAt).toLocaleString()}
            </p>
          )}
        </Card>
      )}

      {/* Dispute Section */}
      {status !== "completed" && status !== "cancelled" && status !== "disputed" && (
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
