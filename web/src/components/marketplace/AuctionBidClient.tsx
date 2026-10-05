"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Alert, Field, Input } from "@/components/ui/form";
import { CURRENCIES, formatMoney, isCurrency } from "@/lib/money";

/**
 * Auction panel (docs/UI_UX_SPEC.md section 30): current bid, minimum next
 * bid, bid count and a countdown that updates every second. Amber marks an
 * auction that is ending soon. The server decides whether a bid is accepted.
 */

function remaining(endsAt: string, now: number): { text: string; soon: boolean; ended: boolean } {
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return { text: "Ended", soon: false, ended: true };
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  const text =
    days > 0 ? `${days}d ${pad(hours)}h ${pad(minutes)}m` : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  return { text, soon: ms < 60 * 60 * 1000, ended: false };
}

export function AuctionBidClient({
  listingId,
  currency,
  currentBidMinor,
  minimumNextMinor,
  bidsCount,
  endsAt,
  hasReserve,
  reserveMet,
  viewer,
  loginHref,
  canClose,
}: {
  listingId: string;
  currency: string;
  currentBidMinor: number;
  minimumNextMinor: number;
  bidsCount: number;
  endsAt: string;
  hasReserve: boolean;
  reserveMet: boolean;
  viewer: "guest" | "owner" | "member" | "restricted";
  loginHref: string;
  /** The seller or the highest bidder, who may close the auction once it has ended. */
  canClose: boolean;
}) {
  const router = useRouter();
  // The countdown starts after the page loads in the browser, so server and browser output match
  const [now, setNow] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const clock = now === null ? null : remaining(endsAt, now);
  const ended = clock?.ended ?? new Date(endsAt).getTime() <= Date.now();
  const factor = isCurrency(currency) ? CURRENCIES[currency].minorFactor : 100;
  const minimumMajor = minimumNextMinor / factor;

  async function send(url: string, body: unknown): Promise<{ ok: boolean; message: string; data?: { status?: string; orderId?: string | null } }> {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) return { ok: true, message: "", data: json.data };
      return { ok: false, message: json?.error?.message || "Something went wrong. Please try again." };
    } catch {
      return { ok: false, message: "Could not reach Servilist. Check your connection and try again." };
    }
  }

  async function bid(event: React.FormEvent) {
    event.preventDefault();
    const amountMajor = Number(amount);
    if (!Number.isFinite(amountMajor) || amountMajor < minimumMajor) {
      setError(`Your bid must be at least ${formatMoney(minimumNextMinor, currency)}.`);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await send(`/api/v1/auctions/${listingId}/bids`, { amountMajor });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      router.refresh();
      return;
    }
    setAmount("");
    setNotice("Your bid is in. You are the highest bidder.");
    router.refresh();
  }

  async function close() {
    setBusy(true);
    setError(null);
    const result = await send(`/api/v1/auctions/${listingId}/settle`, {});
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setNotice(
      result.data?.status === "sold"
        ? "Auction closed. The winner has 48 hours to pay for the order."
        : "Auction closed without a sale: there were no bids, or the reserve was not met.",
    );
    setOrderId(result.data?.orderId ?? null);
    if (!result.data?.orderId) router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{bidsCount > 0 ? "Current bid" : "Starting bid"}</p>
          <p className="text-[32px] leading-none font-bold text-ink">{formatMoney(currentBidMinor, currency)}</p>
        </div>
        <p className="text-sm text-ink-soft">{bidsCount === 1 ? "1 bid" : `${bidsCount} bids`}</p>
      </div>

      <div
        className={`flex items-center gap-2 rounded-input p-3 text-sm font-semibold ${
          clock?.soon ? "bg-accent-100 text-accent-600" : "bg-surface-muted text-ink"
        }`}
        role="timer"
        aria-live="off"
      >
        <Clock className="size-4" aria-hidden="true" />
        {ended ? (
          <span>This auction has ended</span>
        ) : (
          <>
            <span>{clock?.soon ? "Ending soon:" : "Ends in"}</span>
            <span className="tabular-nums">{clock?.text ?? "..."}</span>
          </>
        )}
      </div>

      {hasReserve ? (
        <Badge tone={reserveMet ? "success" : "warning"} className="self-start">
          {reserveMet ? "Reserve met" : "Reserve not yet met"}
        </Badge>
      ) : null}

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {orderId ? (
        <Link href={`/dashboard/orders/${orderId}`} className={buttonClass("primary", "lg")}>
          View the order
        </Link>
      ) : ended ? (
        canClose ? (
          <Button size="lg" onClick={close} disabled={busy} aria-busy={busy}>
            {busy ? "Closing..." : "Close auction"}
          </Button>
        ) : (
          <p className="text-sm text-ink-soft">Waiting for the seller or the highest bidder to close it.</p>
        )
      ) : viewer === "guest" ? (
        <Link href={loginHref} className={buttonClass("primary", "lg")}>
          Sign in to bid
        </Link>
      ) : viewer === "owner" ? (
        <p className="rounded-input bg-primary-50 p-3 text-sm text-ink">
          This is your auction. Its end time and reserve are fixed once the first bid arrives.
        </p>
      ) : viewer === "restricted" ? (
        <p className="rounded-input bg-surface-muted p-3 text-sm text-ink-soft">
          Your account is restricted, so you cannot bid.
        </p>
      ) : (
        <form onSubmit={bid} className="flex flex-col gap-3" noValidate>
          <Field
            id="bid-amount"
            label={`Your bid (${currency})`}
            hint={`Minimum next bid: ${formatMoney(minimumNextMinor, currency)}`}
          >
            <Input
              id="bid-amount"
              type="number"
              inputMode="decimal"
              min={minimumMajor}
              step="any"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </Field>
          <Button type="submit" size="lg" disabled={busy} aria-busy={busy}>
            {busy ? "Placing bid..." : "Place bid"}
          </Button>
          <p className="text-sm text-ink-soft">
            A bid is a commitment to buy at that price. A bid in the last five minutes extends the
            auction by five minutes.
          </p>
        </form>
      )}
    </div>
  );
}
