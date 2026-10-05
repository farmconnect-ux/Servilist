"use client";

import { useState, useEffect } from "react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";

interface Bid {
  id: string;
  bidderId: string;
  amountMinor: number;
  createdAt: string;
  bidder?: {
    username: string;
    displayName: string;
    rating: number;
  };
}

interface AuctionBidClientProps {
  auctionId: string;
  currency: string;
  startingAmountMinor: number;
  currentAmountMinor: number;
  minIncrementMinor: number;
  reserveMet: boolean;
  endsAt: string;
  status: string;
  isSeller: boolean;
  currentUserId?: string | null;
  initialBids: Bid[];
}

export function AuctionBidClient({
  auctionId,
  currency,
  startingAmountMinor,
  currentAmountMinor,
  minIncrementMinor,
  reserveMet,
  endsAt,
  status: initialStatus,
  isSeller,
  currentUserId,
  initialBids,
}: AuctionBidClientProps) {
  const [currentPrice, setCurrentPrice] = useState(currentAmountMinor);
  const [status, setStatus] = useState(initialStatus);
  const [bids, setBids] = useState<Bid[]>(initialBids);
  const [customBidAmount, setCustomBidAmount] = useState<number>(
    (currentPrice + minIncrementMinor) / 100,
  );
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isEnded: boolean;
    isUnderFiveMinutes: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isEnded: false, isUnderFiveMinutes: false });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(endsAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isEnded: true, isUnderFiveMinutes: false });
        if (status === "active") setStatus("ended");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const isUnderFiveMinutes = diff <= 5 * 60 * 1000;

      setTimeLeft({ hours, minutes, seconds, isEnded: false, isUnderFiveMinutes });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [endsAt, status]);

  const minRequiredAmountMajor = (currentPrice + minIncrementMinor) / 100;

  const handlePlaceBid = async (amountMajor: number) => {
    if (!currentUserId) {
      window.location.href = `/login?next=/auctions/${auctionId}`;
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/v1/auctions/${auctionId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMajor }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to place bid");
      }

      setCurrentPrice(data.data.amountMinor);
      setSuccessMsg(
        `Bid of ${formatMoney(data.data.amountMinor, currency)} placed successfully!${
          data.data.extended ? " Auction extended by 5 minutes (Anti-sniping)." : ""
        }`,
      );

      // Refresh bids
      const bidsRes = await fetch(`/api/v1/auctions/${auctionId}/bids`);
      const bidsData = await bidsRes.json();
      if (bidsData.success) {
        setBids(bidsData.data);
      }
      setCustomBidAmount((data.data.amountMinor + minIncrementMinor) / 100);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/v1/auctions/${auctionId}/settle`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Settlement failed");
      }
      setStatus(data.data.status);
      setSuccessMsg(data.data.message);
      if (data.data.orderId) {
        setTimeout(() => {
          window.location.href = `/dashboard/orders/${data.data.orderId}`;
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-line bg-surface p-6 shadow-sm">
      {/* Live Timer Banner */}
      <div
        className={`rounded-xl p-4 text-center transition-colors ${
          timeLeft.isEnded
            ? "bg-surface-muted text-ink-soft"
            : timeLeft.isUnderFiveMinutes
              ? "bg-accent-100 text-accent-600 border border-accent-200 animate-pulse"
              : "bg-ink text-white"
        }`}
      >
        <div className="text-xs font-semibold uppercase tracking-wide">
          {timeLeft.isEnded ? "Auction Closed" : "Time Remaining"}
        </div>
        <div className="mt-1 font-mono text-3xl font-bold tracking-tight">
          {timeLeft.isEnded
            ? "Ended"
            : `${String(timeLeft.hours).padStart(2, "0")}h : ${String(timeLeft.minutes).padStart(2, "0")}m : ${String(timeLeft.seconds).padStart(2, "0")}s`}
        </div>
        {timeLeft.isUnderFiveMinutes && !timeLeft.isEnded && (
          <p className="mt-1 text-xs text-accent-600 font-medium">
            Anti-sniping active: bids placed in final minutes add 5 min extension.
          </p>
        )}
      </div>

      {/* Pricing & Status Overview */}
      <div className="grid grid-cols-2 gap-4 border-b border-line pb-4">
        <div>
          <div className="text-xs text-muted font-medium">Current High Bid</div>
          <div className="text-2xl font-bold text-ink">
            {formatMoney(currentPrice, currency)}
          </div>
          <div className="text-xs text-muted mt-0.5">
            Starts at: {formatMoney(startingAmountMinor, currency)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted font-medium">Reserve Status</div>
          <div
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold mt-1 ${
              reserveMet
                ? "bg-primary-100 text-primary-800"
                : "bg-surface-muted text-ink-soft"
            }`}
          >
            {reserveMet ? "Reserve Met ✓" : "Reserve Not Met"}
          </div>
          <div className="text-xs text-muted mt-1">
            Total Bids: <span className="font-semibold">{bids.length}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="rounded-lg bg-danger-soft p-3 text-xs text-danger border border-danger/40">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg bg-primary-50 p-3 text-xs text-primary-800 border border-primary-200">
          {successMsg}
        </div>
      )}

      {/* Bidding Controls (if active and not ended) */}
      {status === "active" && !timeLeft.isEnded ? (
        isSeller ? (
          <div className="rounded-xl bg-surface-muted p-4 text-center text-xs text-ink-soft">
            You are the seller of this auction. Sellers cannot bid on their own listings.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-ink-soft">
              Min next bid:{" "}
              <span className="font-semibold text-ink">
                {formatMoney(currentPrice + minIncrementMinor, currency)}
              </span>{" "}
              (+{formatMoney(minIncrementMinor, currency)} increment)
            </div>

            {/* Quick increment buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="text-xs py-2 h-auto"
                disabled={loading}
                onClick={() => handlePlaceBid(minRequiredAmountMajor)}
              >
                Bid {formatMoney(currentPrice + minIncrementMinor, currency)}
              </Button>
              <Button
                variant="outline"
                className="text-xs py-2 h-auto"
                disabled={loading}
                onClick={() =>
                  handlePlaceBid((currentPrice + minIncrementMinor * 2) / 100)
                }
              >
                +{formatMoney(minIncrementMinor * 2, currency)}
              </Button>
              <Button
                variant="outline"
                className="text-xs py-2 h-auto"
                disabled={loading}
                onClick={() =>
                  handlePlaceBid((currentPrice + minIncrementMinor * 5) / 100)
                }
              >
                +{formatMoney(minIncrementMinor * 5, currency)}
              </Button>
            </div>

            {/* Custom Bid Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-xs text-disabled">
                  {currency}
                </span>
                <input
                  type="number"
                  min={minRequiredAmountMajor}
                  value={customBidAmount}
                  onChange={(e) => setCustomBidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-line py-2 pl-12 pr-3 text-sm focus:border-ink focus:outline-none"
                  placeholder="Custom bid"
                />
              </div>
              <Button
                className="min-h-11 px-5 text-sm"
                disabled={loading || customBidAmount < minRequiredAmountMajor}
                onClick={() => handlePlaceBid(customBidAmount)}
              >
                {loading ? "Placing..." : "Place Bid"}
              </Button>
            </div>
          </div>
        )
      ) : (
        /* Auction Ended or Settled */
        <div className="space-y-3">
          <div className="rounded-xl bg-surface-muted p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Auction State
            </span>
            <p className="mt-1 text-sm font-medium text-ink capitalize">
              {status === "settled" ? "Settled (Order Generated)" : "Ended"}
            </p>
          </div>

          {status !== "settled" && (isSeller || (bids.length > 0 && bids[0].bidderId === currentUserId)) && (
            <Button
              className="w-full min-h-11 text-sm"
              disabled={loading}
              onClick={handleSettle}
            >
              {loading ? "Settling..." : "Settle Auction & Create Order"}
            </Button>
          )}
        </div>
      )}

      {/* Bid History Table */}
      <div className="border-t border-line pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">
          Bid History ({bids.length})
        </h4>
        {bids.length === 0 ? (
          <p className="text-xs text-disabled text-center py-4">No bids placed yet. Be the first to bid!</p>
        ) : (
          <div className="divide-y divide-line max-h-48 overflow-y-auto pr-1">
            {bids.map((bid, idx) => (
              <div key={bid.id} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-ink">
                    {bid.bidder?.displayName || `Bidder #${bid.bidderId.substring(0, 4)}`}
                  </span>
                  {idx === 0 && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.2 rounded bg-accent-100 text-accent-600 text-[10px] font-bold">
                      Highest
                    </span>
                  )}
                  <div className="text-[10px] text-disabled">
                    {new Date(bid.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div className="font-bold text-ink">
                  {formatMoney(bid.amountMinor, currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
