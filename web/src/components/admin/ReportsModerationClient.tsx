"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReportItem {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string | null;
  status: string;
  isDispute?: boolean;
  actionTaken?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
  reporter?: {
    id: string;
    username: string;
    displayName: string;
  };
}

export function ReportsModerationClient({
  initialReports,
}: {
  initialReports: ReportItem[];
}) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Send one decision and update the row. The server checks the permission again. */
  const send = async (id: string, url: string, body: Record<string, string>, status: string) => {
    setProcessingId(id);
    setErrors((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "That could not be done. Please try again.");
      }
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, resolutionNote: notes[id] || null } : r)),
      );
      router.refresh();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : "That could not be done.",
      }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolve = (
    id: string,
    status: "under_review" | "resolved" | "dismissed",
    actionTaken: "none" | "hide_target" = "none",
  ) =>
    send(
      id,
      `/api/v1/reports/${id}/resolve`,
      { status, actionTaken, ...(notes[id] ? { resolutionNote: notes[id] } : {}) },
      status,
    );

  const handleDispute = (id: string, orderId: string, outcome: "release" | "refund") =>
    send(
      id,
      `/api/v1/orders/${orderId}/dispute/resolve`,
      { outcome, ...(notes[id] ? { note: notes[id] } : {}) },
      "resolved",
    );

  return (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">
          No reports are waiting.
        </Card>
      ) : (
        reports.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-bold text-danger uppercase">
                    {r.isDispute ? "Order dispute" : r.targetType}
                  </span>
                  <h3 className="font-bold text-ink">{r.reason}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.status === "resolved"
                        ? "bg-primary-100 text-primary-800"
                        : r.status === "dismissed"
                        ? "bg-surface-muted text-ink"
                        : "bg-accent-100 text-accent-600"
                    }`}
                  >
                    {r.status.toUpperCase()}
                  </span>
                </div>

                {r.description && (
                  <p className="text-xs text-ink pt-1">{r.description}</p>
                )}

                <p className="text-[11px] text-muted pt-1">
                  Target ID: <span className="font-mono text-ink">{r.targetId}</span> · Reported by{" "}
                  {r.reporter?.displayName || "User"} · {new Date(r.createdAt).toLocaleDateString()}
                </p>

                {r.resolutionNote && (
                  <p className="text-xs text-muted italic">Note: {r.resolutionNote}</p>
                )}
              </div>

              {r.status !== "resolved" && r.status !== "dismissed" && (
                <div className="flex w-full flex-col gap-2 sm:w-72">
                  <label className="text-[11px] font-semibold text-muted" htmlFor={`note-${r.id}`}>
                    Note for the record (optional)
                  </label>
                  <textarea
                    id={`note-${r.id}`}
                    rows={2}
                    maxLength={1000}
                    value={notes[r.id] || ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    className="rounded-lg border border-border px-2 py-1.5 text-xs focus:border-brand focus:outline-none"
                  />
                  {errors[r.id] && (
                    <p role="alert" className="text-xs font-semibold text-danger">
                      {errors[r.id]}
                    </p>
                  )}
                  {r.isDispute ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleDispute(r.id, r.targetId, "release")}
                        disabled={processingId === r.id}
                        className="bg-primary-600 hover:bg-primary-700 text-white min-h-11 px-3 text-xs"
                      >
                        Release to seller
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDispute(r.id, r.targetId, "refund")}
                        disabled={processingId === r.id}
                        className="min-h-11 px-3 text-xs"
                      >
                        Refund the buyer
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(r.targetType === "listing" || r.targetType === "review") && (
                        <Button
                          onClick={() => handleResolve(r.id, "resolved", "hide_target")}
                          disabled={processingId === r.id}
                          className="bg-danger hover:bg-danger text-white min-h-11 px-3 text-xs"
                        >
                          {r.targetType === "listing" ? "Remove listing" : "Hide review"}
                        </Button>
                      )}
                      <Button
                        onClick={() => handleResolve(r.id, "resolved")}
                        disabled={processingId === r.id}
                        className="bg-primary-600 hover:bg-primary-700 text-white min-h-11 px-3 text-xs"
                      >
                        Mark resolved
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleResolve(r.id, "dismissed")}
                        disabled={processingId === r.id}
                        className="border-line text-muted hover:bg-surface-muted min-h-11 px-3 text-xs"
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                  {r.isDispute && (
                    <p className="text-[11px] text-muted">
                      A refund is recorded here and then made from the payment provider's dashboard.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
