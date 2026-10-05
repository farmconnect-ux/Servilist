"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface VerificationItem {
  id: string;
  vendorId: string;
  businessName: string;
  registrationNumber?: string | null;
  taxId?: string | null;
  documentUrl?: string | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  submittedAt: string;
  vendor?: {
    id: string;
    username: string;
    displayName: string;
    verified: boolean;
  };
}

export function VendorVerificationClient({
  initialVerifications,
}: {
  initialVerifications: VerificationItem[];
}) {
  const router = useRouter();
  const [verifications, setVerifications] = useState(initialVerifications);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleReview = async (id: string, status: "approved" | "rejected", reason?: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/v1/verifications/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update verification");
      }

      setVerifications((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status } : v))
      );
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {verifications.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">
          No vendor verifications in queue.
        </Card>
      ) : (
        verifications.map((v) => (
          <Card key={v.id} className="p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-ink">{v.businessName}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      v.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : v.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {v.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-muted">
                  Vendor: <span className="font-medium text-ink">{v.vendor?.displayName}</span> (
                  @{v.vendor?.username}) · Submitted {new Date(v.submittedAt).toLocaleDateString()}
                </p>

                <div className="flex flex-wrap gap-4 text-xs text-muted pt-1">
                  {v.registrationNumber && (
                    <span>Reg No: <strong className="text-ink">{v.registrationNumber}</strong></span>
                  )}
                  {v.taxId && (
                    <span>Tax ID: <strong className="text-ink">{v.taxId}</strong></span>
                  )}
                  {v.documentUrl && (
                    <a
                      href={v.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand underline font-medium"
                    >
                      View KYC Document ↗
                    </a>
                  )}
                </div>
              </div>

              {v.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReview(v.id, "approved")}
                    disabled={processingId === v.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-9 px-3 text-xs"
                  >
                    Approve & Verify ✓
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const reason = prompt("Enter rejection reason:");
                      if (reason) handleReview(v.id, "rejected", reason);
                    }}
                    disabled={processingId === v.id}
                    className="border-red-200 text-red-600 hover:bg-red-50 min-h-9 px-3 text-xs"
                  >
                    Reject ✕
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
