import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, MessageSquare, ShieldCheck, Tag } from "lucide-react";
import { AuctionBidClient } from "@/components/marketplace/AuctionBidClient";
import { ListingActions } from "@/components/marketplace/ListingActions";
import { ProductGallery } from "@/components/marketplace/ProductGallery";
import { ReportButton } from "@/components/marketplace/TrustActions";
import { ListingCard, Rating } from "@/components/marketplace/cards";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, VerifiedBadge } from "@/components/ui/card";
import { createDb } from "@/lib/db/server";
import { formatMoney } from "@/lib/money";
import { isReleased } from "@/lib/release";
import { getSessionUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";
import { getAuctionBids, getAuctionState, minimumNextBid } from "@/server/repositories/auctions";
import { getListingBySlug, searchListings } from "@/server/repositories/listings";
import { listReviewsForProfile } from "@/server/repositories/moderation";

/**
 * Product page (docs/UI_UX_SPEC.md sections 15, 16, 62 and 77).
 * Desktop: gallery beside the summary. Phone: gallery, summary, then details,
 * with the main actions fixed at the bottom of the screen.
 */

const CONDITIONS: Record<string, string> = {
  new: "New",
  refurbished: "Refurbished",
  used_like_new: "Used, like new",
  used_good: "Used, good condition",
  used_fair: "Used, fair condition",
};

const FULFILLMENT: Record<string, string> = {
  pickup: "Pickup from the seller",
  shipping: "Delivery by the seller",
  both: "Pickup or delivery",
};

function safeImage(value: unknown): string | null {
  const url = typeof value === "string" ? value.trim() : "";
  return /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(await createDb(), slug);
  if (!listing) return { title: "Listing not found" };
  const description = listing.description.slice(0, 160);
  const image = safeImage(listing.imageUrl);
  return {
    title: listing.title,
    description,
    alternates: { canonical: `/products/${listing.slug}` },
    openGraph: { title: listing.title, description, images: image ? [image] : undefined },
  };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-3 text-sm last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = await createDb();
  const [listing, viewer] = await Promise.all([getListingBySlug(db, slug), getSessionUser()]);
  if (!listing) notFound();

  const reviewsOpen = isReleased("/api/v1/reviews");
  const [reviews, related] = await Promise.all([
    reviewsOpen ? listReviewsForProfile(db, listing.sellerId) : Promise.resolve([]),
    searchListings(db, { category: listing.category, limit: 5, page: 1 }),
  ]);

  const images = [listing.imageUrl, ...(listing.galleryImages ?? []).map((image) => image.url)]
    .map(safeImage)
    .filter((url): url is string => url !== null)
    .filter((url, position, all) => all.indexOf(url) === position);

  const auctionsOpen = isReleased("/api/v1/auctions");
  const [auction, bids] =
    listing.format === "auction" && auctionsOpen
      ? await Promise.all([getAuctionState(db, listing.id), getAuctionBids(db, listing.id)])
      : [null, []];

  const sellerHref = listing.seller.username ? `/seller/${listing.seller.username}` : null;
  const isAuction = listing.format === "auction";
  const isOwner = viewer?.userId === listing.sellerId;
  const available = listing.status === "active";
  const canAct = Boolean(viewer) && !isOwner && available && canParticipate(viewer ?? null);
  const canBuy = canAct && !isAuction && isReleased("/checkout");
  const loginHref = `/login?next=${encodeURIComponent(`/products/${slug}`)}`;
  const relatedListings = related.listings.filter((item) => item.id !== listing.id).slice(0, 4);
  const price = formatMoney(listing.amountMinor, listing.currency);
  // The bid panel replaces the price and buy actions while an auction is open
  const bidding = isAuction && available && auction?.endsAt ? auction : null;
  // Some listings already carry the country in the city field
  const place =
    listing.country && listing.city.toLowerCase().includes(listing.country.toLowerCase())
      ? listing.city
      : [listing.city, listing.country].filter(Boolean).join(", ");

  return (
    // Extra bottom padding on phones keeps content clear of the fixed action bar
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 pb-28 md:px-5 md:pb-8 lg:px-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <li>
            <Link href="/" className="hover:text-primary-700">
              Home
            </Link>
          </li>
          <ChevronRight className="size-4" aria-hidden="true" />
          <li>
            <Link href={`/categories/${listing.category}`} className="capitalize hover:text-primary-700">
              {listing.category}
            </Link>
          </li>
          <ChevronRight className="size-4" aria-hidden="true" />
          <li className="line-clamp-1 text-ink" aria-current="page">
            {listing.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <ProductGallery images={images} title={listing.title} />

        {/* Summary and actions */}
        <section aria-label="Summary" className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {isAuction ? <Badge tone="accent">Auction</Badge> : null}
            {!available ? <Badge tone="neutral">No longer available</Badge> : null}
          </div>
          <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[32px]">{listing.title}</h1>
          <Rating value={listing.seller.rating} count={listing.seller.reviewsCount} />
          {bidding ? null : (
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-[32px] leading-none font-bold text-ink">{price}</span>
              {listing.negotiable ? <span className="text-sm text-muted">Open to offers</span> : null}
              {isAuction ? <span className="text-sm text-muted">Final bid</span> : null}
            </p>
          )}
          <ul className="flex flex-col gap-2 text-sm text-ink-soft">
            <li className="flex items-center gap-2">
              <Tag className="size-4 text-muted" aria-hidden="true" />
              {CONDITIONS[listing.condition] ?? listing.condition.replace(/_/g, " ")}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-muted" aria-hidden="true" />
              {place}
            </li>
          </ul>

          <div id="actions" className="flex scroll-mt-40 flex-col gap-4">
            {bidding ? (
              <>
                <AuctionBidClient
                  listingId={listing.id}
                  currency={listing.currency}
                  currentBidMinor={listing.amountMinor}
                  minimumNextMinor={minimumNextBid(listing.amountMinor, listing.bidsCount)}
                  bidsCount={listing.bidsCount}
                  endsAt={bidding.endsAt as string}
                  hasReserve={bidding.hasReserve}
                  reserveMet={bidding.reserveMet}
                  viewer={!viewer ? "guest" : isOwner ? "owner" : canAct ? "member" : "restricted"}
                  loginHref={loginHref}
                  canClose={isOwner || (Boolean(viewer) && bids[0]?.bidderId === viewer?.userId)}
                />
                {canAct ? (
                  <ListingActions
                    listingId={listing.id}
                    sellerId={listing.sellerId}
                    currency={listing.currency}
                    negotiable={false}
                  />
                ) : null}
              </>
            ) : !viewer ? (
              <ButtonLink href={loginHref} size="lg">
                Sign in to buy or contact the seller
              </ButtonLink>
            ) : isOwner ? (
              <p className="rounded-input bg-primary-50 p-3 text-sm text-ink">
                This is your listing. Offers from buyers appear under Offers in your dashboard.
              </p>
            ) : !available ? (
              <p className="rounded-input bg-surface-muted p-3 text-sm text-ink-soft">
                This listing is no longer available.
              </p>
            ) : canAct ? (
              <>
                {canBuy ? (
                  <ButtonLink href={`/checkout?listingId=${listing.id}`} size="lg">
                    Buy now
                  </ButtonLink>
                ) : null}
                <ListingActions
                  listingId={listing.id}
                  sellerId={listing.sellerId}
                  currency={listing.currency}
                  negotiable={listing.negotiable}
                />
              </>
            ) : (
              <p className="rounded-input bg-surface-muted p-3 text-sm text-ink-soft">
                Your account is restricted, so you cannot buy or send messages.
              </p>
            )}
          </div>

          <p className="flex items-start gap-2 rounded-input bg-surface-muted p-3 text-sm text-ink-soft">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary-700" aria-hidden="true" />
            You pay through a licensed payment provider. The seller is paid after you inspect the
            item and give them your handover code.
          </p>

          {/* Trust information sits beside the decision (section 77) */}
          <Card className="flex flex-col gap-3 p-4">
            <h2 className="text-sm font-semibold text-muted">Seller</h2>
            <div className="flex items-center gap-3">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-primary-50 text-base font-semibold text-primary-800"
                aria-hidden="true"
              >
                {listing.seller.displayName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-base font-semibold text-ink">
                    {listing.seller.displayName}
                  </span>
                  {listing.seller.verified ? <VerifiedBadge /> : null}
                </p>
                {listing.seller.reviewsCount > 0 ? (
                  <Rating value={listing.seller.rating} count={listing.seller.reviewsCount} />
                ) : (
                  <p className="text-xs text-muted">No reviews yet</p>
                )}
              </div>
            </div>
            {sellerHref ? (
              <ButtonLink href={sellerHref} variant="secondary">
                View seller profile
              </ButtonLink>
            ) : null}
          </Card>

          {canAct && isReleased("/api/v1/reports") ? (
            <ReportButton targetType="listing" targetId={listing.id} label="Report this listing" />
          ) : null}
        </section>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section aria-labelledby="description-title" className="flex flex-col gap-3">
          <h2 id="description-title" className="text-xl font-semibold text-ink md:text-2xl">
            Description
          </h2>
          <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink-soft md:text-base">
            {listing.description}
          </p>
        </section>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="specs-title" className="flex flex-col gap-1">
            <h2 id="specs-title" className="text-xl font-semibold text-ink md:text-2xl">
              Specifications
            </h2>
            <dl>
              <DetailRow
                label="Condition"
                value={CONDITIONS[listing.condition] ?? listing.condition.replace(/_/g, " ")}
              />
              <DetailRow label="Quantity available" value={String(listing.quantity)} />
              <DetailRow
                label={isAuction ? (listing.bidsCount > 0 ? "Current bid" : "Starting bid") : "Price"}
                value={isAuction ? price : listing.negotiable ? `${price}, open to offers` : `${price}, fixed`}
              />
              <DetailRow
                label="Listed"
                value={new Date(listing.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
              />
            </dl>
          </section>

          <section aria-labelledby="delivery-title" className="flex flex-col gap-1">
            <h2 id="delivery-title" className="text-xl font-semibold text-ink md:text-2xl">
              Delivery
            </h2>
            <dl>
              <DetailRow label="Handover" value={FULFILLMENT[listing.fulfillment] ?? listing.fulfillment} />
              <DetailRow
                label="Item location"
                value={place}
              />
            </dl>
          </section>
        </div>
      </div>

      {isAuction && auctionsOpen ? (
        <section aria-labelledby="bids-title" className="flex flex-col gap-4">
          <h2 id="bids-title" className="text-xl font-semibold text-ink md:text-2xl">
            Bid history
          </h2>
          {bids.length > 0 ? (
            <Card className="p-4">
              <ol className="flex flex-col">
                {bids.map((bid, position) => (
                  <li
                    key={bid.id}
                    className="flex items-center justify-between gap-4 border-b border-line py-3 text-sm last:border-b-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">
                        {bid.bidderName}
                        {position === 0 ? <Badge tone="success" className="ml-2">Highest</Badge> : null}
                      </span>
                      <span className="block text-xs text-muted">
                        {new Date(bid.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold text-ink">
                      {formatMoney(bid.amountMinor, bid.currency)}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          ) : (
            <p className="text-sm text-muted">No bids yet.</p>
          )}
        </section>
      ) : null}

      {reviewsOpen ? (
        <section aria-labelledby="reviews-title" className="flex flex-col gap-4">
          <h2 id="reviews-title" className="text-xl font-semibold text-ink md:text-2xl">
            Reviews of this seller
          </h2>
          {reviews.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {reviews.slice(0, 6).map((review) => (
                <li key={review.id}>
                  <Card className="flex h-full flex-col gap-2 p-4">
                    <Rating value={review.rating} count={1} />
                    {review.comment ? <p className="text-sm text-ink-soft">{review.comment}</p> : null}
                    <p className="mt-auto text-xs text-muted">
                      {review.reviewer?.displayName ?? "A member"} ·{" "}
                      {new Date(review.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              This seller has no reviews yet. Reviews appear after completed orders.
            </p>
          )}
        </section>
      ) : null}

      {relatedListings.length > 0 ? (
        <section aria-labelledby="related-title" className="flex flex-col gap-4">
          <h2 id="related-title" className="text-xl font-semibold text-ink md:text-2xl">
            More in this category
          </h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {relatedListings.map((item) => (
              <li key={item.id}>
                <ListingCard
                  listing={{
                    id: item.id,
                    slug: item.slug,
                    title: item.title,
                    category: item.category,
                    format: item.format === "auction" ? "auction" : "buy_now",
                    currency: item.currency,
                    amountMinor: item.amountMinor,
                    bidsCount: item.bidsCount,
                    auctionEndsAt: null,
                    city: item.city,
                    imageUrl: safeImage(item.imageUrl),
                    createdAt: item.createdAt,
                    seller: item.seller,
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Phone: the main actions stay within reach (section 62), above the bottom navigation */}
      {available && !isOwner ? (
        <div className="fixed inset-x-0 bottom-16 z-30 flex gap-2 border-t border-line bg-surface p-3 md:hidden">
          {bidding ? (
            <ButtonLink href="#actions" className="flex-1">
              {viewer ? "Place a bid" : "Sign in to bid"}
            </ButtonLink>
          ) : canAct ? (
            <>
              <ButtonLink href="#actions" variant="secondary" className="flex-1">
                <MessageSquare className="size-4" aria-hidden="true" />
                {listing.negotiable ? "Message or offer" : "Message"}
              </ButtonLink>
              {canBuy ? (
                <ButtonLink href={`/checkout?listingId=${listing.id}`} className="flex-1">
                  Buy now
                </ButtonLink>
              ) : null}
            </>
          ) : !viewer ? (
            <ButtonLink href={loginHref} className="flex-1">
              Sign in to buy
            </ButtonLink>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
