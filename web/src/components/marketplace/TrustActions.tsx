"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, Field, Textarea } from "@/components/ui/form";

async function post(url: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) return null;
    return json?.error?.message || "Something went wrong. Please try again.";
  } catch {
    return "Could not reach Servilist. Check your connection and try again.";
  }
}

/** Rate the other party once an order is completed. */
export function ReviewForm({ orderId, otherName }: { orderId: string; otherName: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) return <Alert tone="success">Thank you. Your review has been published.</Alert>;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (rating < 1) {
      setError("Choose a rating from 1 to 5.");
      return;
    }
    setBusy(true);
    setError(null);
    const problem = await post("/api/v1/reviews", {
      orderId,
      rating,
      comment: comment.trim() || undefined,
    });
    setBusy(false);
    if (problem) {
      setError(problem);
      return;
    }
    setDone(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <fieldset>
        <legend className="text-sm font-semibold text-ink">How was dealing with {otherName}?</legend>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-control border text-sm font-bold ${
                rating === value
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-surface text-ink hover:border-brand"
              }`}
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              {value}
              <span className="sr-only"> out of 5</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">1 is poor, 5 is excellent.</p>
      </fieldset>
      <Field id={`review-${orderId}`} label="Comment (optional)">
        <Textarea
          id={`review-${orderId}`}
          rows={3}
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Field>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Publishing..." : "Publish review"}
      </Button>
    </form>
  );
}

const REPORT_REASONS = [
  "Scam or fraud",
  "Counterfeit or prohibited item",
  "Wrong or misleading details",
  "Offensive or abusive",
  "Something else",
];

/** Flag a listing, member, review or request for the moderation team. */
export function ReportButton({
  targetType,
  targetId,
  label = "Report this",
}: {
  targetType: "listing" | "profile" | "review" | "request";
  targetId: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) return <Alert tone="success">Report sent. Our team will look at it.</Alert>;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-xs font-semibold text-muted underline hover:text-danger"
      >
        {label}
      </button>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (description.trim().length < 10) {
      setError("Tell us a little more about the problem.");
      return;
    }
    setBusy(true);
    setError(null);
    const problem = await post("/api/v1/reports", {
      targetType,
      targetId,
      reason,
      description: description.trim(),
    });
    setBusy(false);
    if (problem) {
      setError(problem);
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-card border border-line p-4" noValidate>
      <Field id={`report-reason-${targetId}`} label="What is wrong?">
        <select
          id={`report-reason-${targetId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink"
        >
          {REPORT_REASONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </Field>
      <Field id={`report-detail-${targetId}`} label="What happened?">
        <Textarea
          id={`report-detail-${targetId}`}
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <div className="flex gap-2">
        <Button type="submit" variant="danger" disabled={busy}>
          {busy ? "Sending..." : "Send report"}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
