import Link from "next/link";
import { ArrowRight, Clock, Gavel, ImageOff, MapPin, Search, Star } from "lucide-react";
import { Badge, Card, VerifiedBadge } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import type { ListingSummary, RequestSummary } from "@/server/repositories/marketplace";

/**
 * Marketplace cards (docs/UI_UX_SPEC.md sections 14, 21 and 29).
 * They show only what the database holds: no placeholder ratings or counts.
 */

export { VerifiedBadge };

export function PriceDisplay({
  amountMinor,
  currency,
  size = "md",
}: {
  amountMinor: number;
  currency: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-2xl" };
  return (
    <span className={`${sizes[size]} font-bold text-ink`}>
      {amountMinor > 0 ? formatMoney(amountMinor, currency) : "Free"}
    </span>
  );
}

/** A seller's rating, shown only once they have real reviews. */
export function Rating({ value, count }: { value: number; count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
      <Star className="size-3.5 fill-accent-500 text-accent-500" aria-hidden="true" />
      <span className="font-medium">{value.toFixed(1)}</span>
      <span className="sr-only">out of 5 from</span>
      <span>({count})</span>
    </span>
  );
}

export function LocationDisplay({ city }: { city: string }) {
  if (!city) return null;
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{city}</span>
    </span>
  );
}

function ImagePlaceholder() {
  return (
    <div className="flex size-full items-center justify-center bg-surface-muted text-disabled">
      <ImageOff className="size-8" aria-hidden="true" />
      <span className="sr-only">No photo</span>
    </div>
  );
}

/** Section 14: image at 4:3, then title, price, location and seller. */
export function ListingCard({ listing }: { listing: ListingSummary }) {
  const href = `/products/${listing.slug || listing.id}`;
  const isAuction = listing.format === "auction";

  return (
    <Card className="group flex flex-col overflow-hidden transition-colors duration-200 hover:border-line-strong">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-surface-muted">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={listing.title}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <ImagePlaceholder />
        )}
        {isAuction ? (
          <Badge tone="accent" className="absolute top-2 left-2">
            <Gavel className="size-3" aria-hidden="true" />
            Auction
          </Badge>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={href}>
          <h3 className="line-clamp-2 text-[15px] leading-snug font-medium text-ink group-hover:text-primary-700 md:text-base">
            {listing.title}
          </h3>
        </Link>
        <PriceDisplay amountMinor={listing.amountMinor} currency={listing.currency} />
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <LocationDisplay city={listing.city} />
          {isAuction ? <span>· {listing.bidsCount} bids</span> : null}
        </p>
        <p className="mt-auto flex items-center gap-2 pt-1 text-xs text-ink-soft">
          <Rating value={listing.seller.rating} count={listing.seller.reviewsCount} />
          <span className="truncate">{listing.seller.displayName}</span>
          {listing.seller.verified ? <VerifiedBadge /> : null}
        </p>
      </div>
    </Card>
  );
}

/** Section 21: a buyer's need, with budget, location and the buyer's standing. */
export function RequestCard({
  request,
  responses,
}: {
  request: RequestSummary;
  /** How many sellers have responded, when the caller knows it. */
  responses?: number;
}) {
  const href = `/requests/${request.id}`;
  return (
    <Card className="flex flex-col gap-3 p-4 transition-colors duration-200 hover:border-line-strong">
      <div className="flex items-center justify-between gap-2">
        <Badge tone="brand">{request.requestType === "service" ? "Service needed" : "Need"}</Badge>
        {request.urgency ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Clock className="size-3.5" aria-hidden="true" />
            {request.urgency}
          </span>
        ) : null}
      </div>

      <Link href={href}>
        <h3 className="line-clamp-2 text-base font-semibold text-ink hover:text-primary-700">
          {request.title}
        </h3>
      </Link>

      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Budget</dt>
          <dd className="font-semibold text-ink">
            {request.budgetMinor > 0
              ? formatMoney(request.budgetMinor, request.currency)
              : "Open to offers"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Location</dt>
          <dd className="truncate text-ink-soft">{request.city}</dd>
        </div>
        {responses !== undefined ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Responses</dt>
            <dd className="text-ink-soft">
              {responses === 0
                ? "Be the first to respond"
                : responses === 1
                  ? "1 seller responded"
                  : `${responses} sellers responded`}
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="flex items-center gap-2 text-xs text-ink-soft">
        <span className="truncate">{request.buyer.displayName}</span>
        {request.buyer.verified ? <VerifiedBadge /> : null}
        <Rating value={request.buyer.rating} count={request.buyer.reviewsCount} />
      </p>

      <Link
        href={href}
        className="mt-auto inline-flex min-h-11 items-center justify-center gap-1.5 rounded-input border border-line-strong text-sm font-semibold text-ink transition-colors hover:border-primary-600 hover:text-primary-700"
      >
        View request
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </Card>
  );
}

/** Section 29: amber is reserved for auction urgency. */
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
  const href = `/auctions/${auction.id}`;
  return (
    <Card className="group flex flex-col overflow-hidden transition-colors duration-200 hover:border-line-strong">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-surface-muted">
        {auction.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={auction.imageUrl}
            alt={auction.title}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <ImagePlaceholder />
        )}
        <Badge tone="accent" className="absolute top-2 left-2">
          <Gavel className="size-3" aria-hidden="true" />
          Auction
        </Badge>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={href}>
          <h3 className="line-clamp-2 text-[15px] leading-snug font-medium text-ink group-hover:text-primary-700 md:text-base">
            {auction.title}
          </h3>
        </Link>
        <p className="text-xs text-muted">Current bid</p>
        <PriceDisplay amountMinor={auction.currentBidMinor} currency={auction.currency} />
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <span>{auction.bidsCount} bids</span>
          <span>·</span>
          <LocationDisplay city={auction.city} />
        </p>
        <p className="inline-flex items-center gap-1 text-xs font-medium text-accent-600">
          <Clock className="size-3.5" aria-hidden="true" />
          Ends {new Date(auction.endsAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>
    </Card>
  );
}

/** The large search used on the home and search pages. */
export function SearchBar({
  defaultValue = "",
  defaultCity = "",
}: {
  defaultValue?: string;
  defaultCity?: string;
}) {
  return (
    <form
      action="/search"
      method="get"
      role="search"
      className="flex w-full flex-col gap-2 rounded-card border border-line-strong bg-surface p-2 focus-within:border-primary-600 sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-2 px-2">
        <Search className="size-5 shrink-0 text-muted" aria-hidden="true" />
        <label htmlFor="home-q" className="sr-only">
          What are you looking for?
        </label>
        <input
          id="home-q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          maxLength={80}
          placeholder="What are you looking for?"
          className="min-h-11 w-full bg-transparent text-base text-ink placeholder:text-muted focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2 border-t border-line px-2 pt-2 sm:w-48 sm:border-t-0 sm:border-l sm:pt-0">
        <MapPin className="size-5 shrink-0 text-muted" aria-hidden="true" />
        <label htmlFor="home-city" className="sr-only">
          Location
        </label>
        <input
          id="home-city"
          name="city"
          type="text"
          defaultValue={defaultCity}
          maxLength={50}
          placeholder="City"
          className="min-h-11 w-full bg-transparent text-base text-ink placeholder:text-muted focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="min-h-12 rounded-input bg-primary-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-700 sm:min-h-11"
      >
        Search
      </button>
    </form>
  );
}
