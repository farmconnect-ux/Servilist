import Link from "next/link";
import { Badge, Card, VerifiedBadge, type BadgeTone } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import type { ListingSummary, RequestSummary } from "@/server/repositories/marketplace";

export function PriceDisplay({
  amountMinor,
  currency,
  size = "md",
}: {
  amountMinor: number;
  currency: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-sm font-bold text-emerald-700",
    md: "text-lg font-black text-emerald-700 tracking-tight",
    lg: "text-2xl font-black text-emerald-700 tracking-tight",
  };

  return (
    <span className={sizeClasses[size]}>
      {amountMinor > 0 ? formatMoney(amountMinor, currency) : "Free / Barter"}
    </span>
  );
}

const FORMAT_CONFIG: Record<
  ListingSummary["format"],
  { label: string; tone: BadgeTone; icon?: string }
> = {
  auction: { label: "Live Auction", tone: "accent", icon: "⚡" },
  buy_now: { label: "Buy Now", tone: "success", icon: "🛒" },
  service: { label: "Service", tone: "info", icon: "🛠️" },
  free_barter: { label: "Free / Swap", tone: "brand", icon: "🔄" },
};

export { VerifiedBadge };

/** Product & Listing Card adhering to the UI Design Specification */
export function ListingCard({ listing }: { listing: ListingSummary }) {
  const format = FORMAT_CONFIG[listing.format] || FORMAT_CONFIG.buy_now;
  const productHref = `/products/${listing.slug || listing.id}`;
  const sellerHref = listing.seller.username ? `/seller/${listing.seller.username}` : "#";

  return (
    <Card
      variant="interactive"
      className="group flex flex-col overflow-hidden bg-white border border-zinc-200"
    >
      <Link href={productHref} className="relative aspect-[4/3] w-full bg-zinc-100 overflow-hidden block">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={listing.title}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-zinc-300 bg-zinc-100">
            <svg className="size-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
        )}

        <Badge
          tone={format.tone}
          className="absolute top-2.5 left-2.5 backdrop-blur-xs shadow-xs font-bold"
        >
          {format.icon ? `${format.icon} ` : ""}
          {format.label}
        </Badge>

        {listing.format === "auction" && (
          <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-bold text-amber-300 backdrop-blur-xs">
            {listing.bidsCount} bids
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between p-4 gap-2">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 mb-1">
            <span className="truncate">{listing.category || "General"}</span>
            <span className="shrink-0 flex items-center gap-0.5">
              <svg className="size-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              {listing.city}
            </span>
          </div>

          <Link href={productHref}>
            <h3 className="line-clamp-2 text-sm font-bold text-zinc-900 group-hover:text-emerald-700 leading-snug">
              {listing.title}
            </h3>
          </Link>
        </div>

        <div className="mt-2 pt-2 border-t border-zinc-100">
          <div className="flex items-baseline justify-between">
            <PriceDisplay amountMinor={listing.amountMinor} currency={listing.currency} size="md" />
            {listing.seller.rating > 0 && (
              <span className="text-xs font-bold text-zinc-700 flex items-center gap-0.5">
                <span className="text-amber-500">★</span> {listing.seller.rating.toFixed(1)}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <Link
              href={sellerHref}
              className="truncate font-medium text-zinc-600 hover:text-emerald-700"
            >
              {listing.seller.displayName}
            </Link>
            {listing.seller.verified && <VerifiedBadge />}
          </div>
        </div>
      </div>
    </Card>
  );
}

/** Reverse Marketplace / Buyer Demand Card */
export function RequestCard({ request }: { request: RequestSummary }) {
  const urgencyColor =
    request.urgency === "urgent" || request.urgency === "high"
      ? "warning"
      : request.urgency === "flexible"
      ? "neutral"
      : "brand";

  return (
    <Card
      variant="interactive"
      className="flex flex-col justify-between p-4 bg-white border border-zinc-200 border-l-4 border-l-emerald-600"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge tone={request.requestType === "service" ? "info" : "brand"}>
            {request.requestType === "service" ? "Service Wanted" : "Item Wanted"}
          </Badge>
          <Badge tone={urgencyColor as BadgeTone} pill>
            {request.urgency || "Standard"}
          </Badge>
        </div>

        <Link href={`/requests/${request.id}`}>
          <h3 className="line-clamp-2 text-base font-bold text-zinc-900 hover:text-emerald-700">
            {request.title}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
          <span>📍 {request.city}</span>
          <span>•</span>
          <span>{request.category}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Target Budget
          </span>
          <span className="text-base font-black text-zinc-900">
            {request.budgetMinor > 0
              ? formatMoney(request.budgetMinor, request.currency)
              : "Negotiable"}
          </span>
        </div>

        <Link
          href={`/requests/${request.id}`}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition"
        >
          Make Offer →
        </Link>
      </div>
    </Card>
  );
}

/** Live Auction Card with Countdown Indicator */
export function AuctionCard({
  auction,
}: {
  auction: {
    id: string;
    title: string;
    imageUrl?: string | null;
    currentBidMinor: number;
    bidsCount: number;
    currency: string;
    endsAt: string;
    city: string;
  };
}) {
  return (
    <Card variant="interactive" className="group flex flex-col overflow-hidden bg-white border border-amber-200">
      <Link href={`/auctions/${auction.id}`} className="relative aspect-[4/3] w-full bg-zinc-100 overflow-hidden block">
        {auction.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={auction.imageUrl}
            alt={auction.title}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-zinc-100 text-zinc-300">
            ⚡
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-amber-500/90 backdrop-blur-xs px-2.5 py-1 text-xs font-bold text-white shadow-xs">
          <span className="size-2 rounded-full bg-white animate-pulse" />
          Live Auction
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>📍 {auction.city}</span>
            <span className="font-semibold text-amber-600">{auction.bidsCount} bids placed</span>
          </div>
          <Link href={`/auctions/${auction.id}`}>
            <h3 className="line-clamp-2 text-sm font-bold text-zinc-900 group-hover:text-amber-600">
              {auction.title}
            </h3>
          </Link>
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Current Bid</span>
            <span className="text-base font-black text-amber-600">
              {formatMoney(auction.currentBidMinor, auction.currency)}
            </span>
          </div>
          <Link
            href={`/auctions/${auction.id}`}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 shadow-xs transition"
          >
            Place Bid
          </Link>
        </div>
      </div>
    </Card>
  );
}

/** Global Search Bar with Integrated Location Selector */
export function SearchBar({
  defaultValue = "",
  defaultCity = "",
}: {
  defaultValue?: string;
  defaultCity?: string;
}) {
  const CITIES = [
    { value: "", label: "All Locations (Pan-Africa)" },
    { value: "lagos", label: "Lagos, Nigeria" },
    { value: "abuja", label: "Abuja, Nigeria" },
    { value: "port-harcourt", label: "Port Harcourt, Nigeria" },
    { value: "ibadan", label: "Ibadan, Nigeria" },
    { value: "kano", label: "Kano, Nigeria" },
    { value: "accra", label: "Accra, Ghana" },
    { value: "nairobi", label: "Nairobi, Kenya" },
  ];

  return (
    <form
      action="/search"
      method="get"
      role="search"
      className="flex w-full flex-col sm:flex-row items-stretch gap-2 bg-white p-1.5 rounded-2xl border border-zinc-300 shadow-sm focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20"
    >
      <div className="flex flex-1 items-center px-3 gap-2">
        <svg
          className="size-5 text-zinc-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <label htmlFor="q" className="sr-only">
          Search products, services, or buyer requests
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          maxLength={80}
          placeholder="Search products, services, or buyer requests..."
          className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none min-h-10"
        />
      </div>

      <div className="flex items-center border-t sm:border-t-0 sm:border-l border-zinc-200 px-3 py-1">
        <svg
          className="size-4 text-zinc-400 mr-2 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          />
        </svg>
        <select
          name="city"
          defaultValue={defaultCity}
          aria-label="Location"
          className="bg-transparent text-xs font-semibold text-zinc-700 focus:outline-none cursor-pointer pr-4"
        >
          {CITIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="min-h-11 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white hover:bg-emerald-700 shadow-xs transition active:scale-[0.98] shrink-0"
      >
        Search
      </button>
    </form>
  );
}
