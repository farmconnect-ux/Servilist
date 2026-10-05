"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input, Textarea } from "@/components/ui/form";

type Notice = { tone: "success" | "danger"; text: string } | null;

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

/** Offer and message forms shown to a signed-in member who is not the seller. */
export function ListingActions({
  listingId,
  sellerId,
  currency,
  negotiable,
}: {
  listingId: string;
  sellerId: string;
  currency: string;
  negotiable: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [offerNote, setOfferNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"offer" | "message" | null>(null);
  const [offerNotice, setOfferNotice] = useState<Notice>(null);
  const [messageNotice, setMessageNotice] = useState<Notice>(null);

  async function submitOffer(event: React.FormEvent) {
    event.preventDefault();
    const amountMajor = Number(amount);
    if (!Number.isFinite(amountMajor) || amountMajor <= 0) {
      setOfferNotice({ tone: "danger", text: "Enter the amount you want to offer." });
      return;
    }
    setBusy("offer");
    const error = await post("/api/v1/offers", {
      listingId,
      amountMajor,
      message: offerNote || undefined,
    });
    setBusy(null);
    if (error) {
      setOfferNotice({ tone: "danger", text: error });
      return;
    }
    setAmount("");
    setOfferNote("");
    setOfferNotice({
      tone: "success",
      text: "Offer sent. The seller has 48 hours to respond. Track it under Offers in your dashboard.",
    });
    router.refresh();
  }

  async function submitMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim()) {
      setMessageNotice({ tone: "danger", text: "Write a message first." });
      return;
    }
    setBusy("message");
    const error = await post("/api/v1/conversations", {
      recipientId: sellerId,
      listingId,
      body: message.trim(),
    });
    setBusy(null);
    if (error) {
      setMessageNotice({ tone: "danger", text: error });
      return;
    }
    setMessage("");
    setMessageNotice({ tone: "success", text: "Message sent. Replies appear under Messages." });
  }

  return (
    <div className="flex flex-col gap-5">
      {negotiable ? (
        <form onSubmit={submitOffer} className="flex flex-col gap-3" noValidate>
          <Field id="offer-amount" label={`Your offer (${currency})`}>
            <Input
              id="offer-amount"
              inputMode="decimal"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
          <Field id="offer-note" label="Note to the seller (optional)">
            <Textarea
              id="offer-note"
              rows={2}
              maxLength={1000}
              value={offerNote}
              onChange={(e) => setOfferNote(e.target.value)}
            />
          </Field>
          {offerNotice ? <Alert tone={offerNotice.tone}>{offerNotice.text}</Alert> : null}
          <Button type="submit" disabled={busy !== null}>
            {busy === "offer" ? "Sending offer..." : "Make an offer"}
          </Button>
        </form>
      ) : null}

      <form onSubmit={submitMessage} className="flex flex-col gap-3" noValidate>
        <Field id="seller-message" label="Message the seller">
          <Textarea
            id="seller-message"
            rows={3}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about condition, pickup or delivery"
          />
        </Field>
        {messageNotice ? <Alert tone={messageNotice.tone}>{messageNotice.text}</Alert> : null}
        <Button type="submit" variant="secondary" disabled={busy !== null}>
          {busy === "message" ? "Sending..." : "Send message"}
        </Button>
      </form>
    </div>
  );
}

/** Accept, decline, counter or withdraw a pending offer. The server decides which are allowed. */
export function OfferActions({
  offerId,
  currency,
  mine,
}: {
  offerId: string;
  currency: string;
  /** True when the signed-in member made this offer. */
  mine: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [countering, setCountering] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "reject" | "counter" | "cancel") {
    const body: Record<string, unknown> = { action };
    if (action === "counter") {
      const counterAmountMajor = Number(amount);
      if (!Number.isFinite(counterAmountMajor) || counterAmountMajor <= 0) {
        setError("Enter your counter-offer amount.");
        return;
      }
      body.counterAmountMajor = counterAmountMajor;
    }
    setBusy(true);
    setError(null);
    const problem = await post(`/api/v1/offers/${offerId}/respond`, body);
    setBusy(false);
    if (problem) {
      setError(problem);
      return;
    }
    setCountering(false);
    router.refresh();
  }

  if (mine) {
    return (
      <div className="flex flex-col gap-2">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Button variant="outline" disabled={busy} onClick={() => respond("cancel")}>
          Withdraw offer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {countering ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-40 flex-1">
            <Field id={`counter-${offerId}`} label={`Counter-offer (${currency})`}>
              <Input
                id={`counter-${offerId}`}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
          </div>
          <Button disabled={busy} onClick={() => respond("counter")}>
            Send
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => setCountering(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => respond("accept")}>
            Accept
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => setCountering(true)}>
            Counter
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => respond("reject")}>
            Decline
          </Button>
        </div>
      )}
    </div>
  );
}
