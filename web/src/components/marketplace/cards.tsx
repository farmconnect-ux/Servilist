import { Badge, Card, type BadgeTone } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import type { ListingSummary, RequestSummary } from "@/server/repositories/marketplace";

export function PriceDisplay({ amountMinor, currency }: { amountMinor: number; currency: string }) {
  return (
    <span className="text-sm font-bold text-brand">
      {amountMinor > 0 ? formatMoney(amountMinor, currency) : "Free or swap"}
    </span>
  );
}

const FORMATS: Record<ListingSummary["format"], { label: string; tone: BadgeTone }> = {
  auction: { label: "Auction", tone: "warning" },
  buy_now: { label: "Buy now", tone: "success" },
  service: { label: "Service", tone: "accent" },
  free_barter: { label: "Free or swap", tone: "brand" },
};

export function VerificationBadge({ verified }: { verified: boolean }) {
  return verified ? <Badge tone="success">Verified</Badge> : null;
}

export function ListingCard({ listing }: { listing: ListingSummary }) {
  const format = FORMATS[listing.format];
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] bg-page">
        {listing.imageUrl ? (
          // Member-supplied addresses on arbitrary hosts, so the image optimiser is not used
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : null}
        <Badge tone={format.tone} className="absolute top-3 left-3">
          {format.label}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 text-base leading-5 font-bold text-ink">{listing.title}</h3>
        <div className="flex items-center justify-between gap-2">
          <PriceDisplay amountMinor={listing.amountMinor} currency={listing.currency} />
          {listing.format === "auction" ? (
            <span className="text-xs text-muted">{listing.bidsCount} bids</span>
          ) : null}
        </div>
        <p className="text-xs text-muted">{listing.city}</p>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2">
          <span className="truncate text-xs font-semibold text-ink">
            {listing.seller.displayName}
          </span>
          <VerificationBadge verified={listing.seller.verified} />
        </div>
      </div>
    </Card>
  );
}

export function RequestCard({ request }: { request: RequestSummary }) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <Badge tone={request.requestType === "service" ? "accent" : "brand"}>
          {request.requestType === "service" ? "Service wanted" : "Item wanted"}
        </Badge>
        <span className="text-xs text-muted">{request.urgency}</span>
      </div>
      <h3 className="line-clamp-2 text-base leading-5 font-bold text-ink">{request.title}</h3>
      <p className="text-xs text-muted">{request.city}</p>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2">
        <span className="text-xs text-muted">Budget</span>
        <span className="text-sm font-bold text-ink">
          {formatMoney(request.budgetMinor, request.currency)}
        </span>
      </div>
    </Card>
  );
}

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/" method="get" role="search" className="flex w-full max-w-xl gap-2">
      <label htmlFor="q" className="sr-only">
        Search listings and requests
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        maxLength={80}
        placeholder="Search listings and requests"
        className="min-h-11 flex-1 rounded-[19px] border border-line-strong bg-page px-4 text-sm"
      />
      <button
        type="submit"
        className="min-h-11 rounded-[19px] bg-brand px-5 text-sm font-bold text-white hover:bg-brand-strong"
      >
        Search
      </button>
    </form>
  );
}
