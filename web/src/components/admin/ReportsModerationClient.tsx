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

  const handleResolve = async (id: string, status: "under_review" | "resolved" | "dismissed") => {
    setProcessingId(id);
    const note = prompt(`Enter resolution notes for setting to ${status}:`) || "Reviewed by administrator";

    try {
      const res = await fetch(`/api/v1/reports/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolutionNote: note }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to resolve report");
      }

      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, resolutionNote: note } : r))
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
      {reports.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">
          No moderation reports in queue. Clean record!
        </Card>
      ) : (
        reports.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 uppercase">
                    {r.targetType}
                  </span>
                  <h3 className="font-bold text-ink">{r.reason}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.status === "resolved"
                        ? "bg-emerald-100 text-emerald-800"
                        : r.status === "dismissed"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-amber-100 text-amber-800"
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
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleResolve(r.id, "resolved")}
                    disabled={processingId === r.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-9 px-3 text-xs"
                  >
                    Resolve & Action ✓
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleResolve(r.id, "dismissed")}
                    disabled={processingId === r.id}
                    className="border-gray-200 text-muted hover:bg-gray-50 min-h-9 px-3 text-xs"
                  >
                    Dismiss ✕
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
