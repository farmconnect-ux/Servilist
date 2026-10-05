import Link from "next/link";
import { notFound } from "next/navigation";
import { createDb } from "@/lib/db/server";
import { getListingBySlug } from "@/server/repositories/listings";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ListingActions } from "@/components/marketplace/ListingActions";
import { ReportButton } from "@/components/marketplace/TrustActions";
import { getSessionUser } from "@/server/auth/session";
import { isReleased } from "@/lib/release";
import { canParticipate } from "@/server/policies/access";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = await createDb();
  const [listing, viewer] = await Promise.all([getListingBySlug(db, slug), getSessionUser()]);

  if (!listing) {
    notFound();
  }

  const allImages = [
    listing.imageUrl,
    ...(listing.galleryImages || []).map((img) => img.url),
  ].filter(Boolean);

  const sellerHref = listing.seller.username ? `/seller/${listing.seller.username}` : "#";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/" className="hover:text-brand">Home</Link> &gt;{" "}
        <Link href={`/categories/${listing.category}`} className="capitalize hover:text-brand">
          {listing.category}
        </Link>{" "}
        &gt; <span className="line-clamp-1 font-semibold text-ink">{listing.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Image Gallery (7 cols) */}
        <div className="max-lg:contents lg:col-span-7 lg:flex lg:flex-col lg:gap-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-line bg-page max-lg:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="size-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge tone="success" className="capitalize">
                {listing.format.replace("_", " ")}
              </Badge>
              <Badge tone="neutral" className="capitalize">
                {listing.condition.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>

          {allImages.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="size-20 shrink-0 overflow-hidden rounded-control border border-line bg-page"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl} alt="" className="size-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}

          {/* Description & Specs Section */}
          <div className="rounded-card border border-line bg-surface p-6 max-lg:order-3">
            <h3 className="text-lg font-bold text-ink">Description</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
              {listing.description}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4 text-xs sm:grid-cols-3">
              <div>
                <span className="text-muted">Condition:</span>
                <p className="font-semibold text-ink capitalize">{listing.condition.replace(/_/g, " ")}</p>
              </div>
              <div>
                <span className="text-muted">Fulfillment:</span>
                <p className="font-semibold text-ink capitalize">{listing.fulfillment}</p>
              </div>
              <div>
                <span className="text-muted">Location:</span>
                <p className="font-semibold text-ink">{listing.city}, {listing.country}</p>
              </div>
              <div>
                <span className="text-muted">Published:</span>
                <p className="font-semibold text-ink">{new Date(listing.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-muted">Quantity:</span>
                <p className="font-semibold text-ink">{listing.quantity} available</p>
              </div>
              <div>
                <span className="text-muted">Negotiable:</span>
                <p className="font-semibold text-ink">{listing.negotiable ? "Yes" : "Fixed"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Buyer Actions & Seller Strip (5 cols) */}
        <div className="flex flex-col gap-6 max-lg:order-2 lg:col-span-5">
          <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 shadow-sm">
            <h1 className="text-2xl font-bold leading-snug text-ink sm:text-3xl">
              {listing.title}
            </h1>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-brand">
                {formatMoney(listing.amountMinor, listing.currency)}
              </span>
              {listing.negotiable ? (
                <span className="text-xs font-semibold text-muted">(Negotiable)</span>
              ) : null}
            </div>

            <p className="text-xs text-muted">Available in {listing.city}, {listing.country}</p>

            {/* Offers and messages are open; checkout opens with orders and payments */}
            {!viewer ? (
              <ButtonLink href={`/login?next=${encodeURIComponent(`/products/${slug}`)}`}>
                {listing.negotiable ? "Sign in to make an offer or message the seller" : "Sign in to message the seller"}
              </ButtonLink>
            ) : viewer.userId === listing.sellerId ? (
              <p className="rounded-[10px] bg-brand-soft px-3 py-2.5 text-sm text-ink">
                This is your listing. Offers from buyers appear under Offers in your dashboard.
              </p>
            ) : listing.status !== "active" ? (
              <p className="rounded-[10px] bg-page px-3 py-2.5 text-sm text-muted">
                This listing is no longer available.
              </p>
            ) : canParticipate(viewer) ? (
              <>
                {listing.format !== "auction" && isReleased("/checkout") ? (
                  <ButtonLink href={`/checkout?listingId=${listing.id}`}>
                    Buy now for {formatMoney(listing.amountMinor, listing.currency)}
                  </ButtonLink>
                ) : null}
                <ListingActions
                  listingId={listing.id}
                  sellerId={listing.sellerId}
                  currency={listing.currency}
                  negotiable={listing.negotiable}
                />
                {isReleased("/api/v1/reports") ? (
                  <ReportButton
                    targetType="listing"
                    targetId={listing.id}
                    label="Report this listing"
                  />
                ) : null}
              </>
            ) : null}

            {/* Escrow Guarantee Callout */}
            <div className="rounded-control bg-page p-3.5 text-xs text-muted">
              <p className="font-bold text-ink">Servilist Buyer Protection</p>
              <p className="mt-1">
                You pay through a licensed payment provider. The seller is paid after you inspect the item and give them your handover code.
              </p>
            </div>
          </div>

          {/* Seller Card (Section 56) */}
          <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted">Sold by</h4>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-lg font-bold text-brand-strong">
                {listing.seller.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link href={sellerHref} className="truncate text-base font-bold text-ink hover:text-brand">
                    {listing.seller.displayName}
                  </Link>
                  {listing.seller.verified ? (
                    <Badge tone="success">Verified</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted">
                  ★ {listing.seller.rating.toFixed(1)} ({listing.seller.reviewsCount} sales &bull; 99% positive)
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <ButtonLink href={sellerHref} variant="outline" className="flex-1 text-center text-xs">
                View Storefront
              </ButtonLink>
              <ButtonLink href="/dashboard" variant="ghost" className="text-center text-xs">
                Contact
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
