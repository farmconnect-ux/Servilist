import Link from "next/link";
import { notFound } from "next/navigation";
import { createDb } from "@/lib/db/server";
import { getSellerByUsername } from "@/server/repositories/sellerProfiles";
import { searchListings } from "@/server/repositories/listings";
import { ListingCard } from "@/components/marketplace/cards";
import { Badge, EmptyState } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const db = await createDb();
  const seller = await getSellerByUsername(db, username);

  if (!seller) {
    notFound();
  }

  // Get seller listings
  const { listings } = await searchListings(db, {
    limit: 20,
    page: 1,
  });
  const sellerListings = listings.filter((l) => l.sellerId === seller.id || l.seller.username === seller.username);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      {/* Seller Header Banner */}
      <div className="flex flex-col gap-6 rounded-card border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brand-soft text-2xl font-bold text-brand-strong">
              {seller.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-ink sm:text-3xl">{seller.displayName}</h1>
                {seller.verified ? <Badge tone="success">Verified Merchant</Badge> : null}
              </div>
              <p className="text-xs text-muted">@{seller.username} · Member since {new Date(seller.memberSince).toLocaleDateString()}</p>
              <p className="mt-1 text-sm text-ink">
                {seller.city || "Lagos"}, {seller.country || "Nigeria"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <ButtonLink href="/dashboard" variant="primary">
              Contact Merchant
            </ButtonLink>
          </div>
        </div>

        {/* Bio */}
        {seller.bio ? (
          <p className="text-sm leading-relaxed text-muted border-t border-line pt-4">
            {seller.bio}
          </p>
        ) : null}

        {/* Storefront Key Performance Indicators */}
        <div className="grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4 text-center">
          <div className="rounded-control bg-page p-3">
            <span className="text-xs text-muted">Rating</span>
            <p className="text-lg font-bold text-ink">★ {seller.ratingAverage.toFixed(1)}</p>
            <span className="text-[11px] text-muted">{seller.ratingCount} reviews</span>
          </div>
          <div className="rounded-control bg-page p-3">
            <span className="text-xs text-muted">Active Listings</span>
            <p className="text-lg font-bold text-ink">{seller.stats.activeListingsCount}</p>
            <span className="text-[11px] text-muted">In stock</span>
          </div>
          <div className="rounded-control bg-page p-3">
            <span className="text-xs text-muted">Sales Completed</span>
            <p className="text-lg font-bold text-ink">{seller.stats.completedSalesCount}</p>
            <span className="text-[11px] text-muted">Escrow verified</span>
          </div>
          <div className="rounded-control bg-page p-3">
            <span className="text-xs text-muted">Response Rate</span>
            <p className="text-sm font-bold text-ink">{seller.stats.responseRate}</p>
            <span className="text-[11px] text-muted">Fast response</span>
          </div>
        </div>
      </div>

      {/* Active Listings Section */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-ink">Storefront Listings ({sellerListings.length})</h2>

        {sellerListings.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sellerListings.map((item) => (
              <ListingCard
                key={item.id}
                listing={{
                  id: item.id,
                  slug: item.slug,
                  title: item.title,
                  category: item.category,
                  format: item.format as any,
                  currency: item.currency,
                  amountMinor: item.amountMinor,
                  bidsCount: item.bidsCount,
                  auctionEndsAt: null,
                  city: item.city,
                  imageUrl: item.imageUrl,
                  createdAt: item.createdAt,
                  seller: {
                    id: seller.id,
                    username: seller.username,
                    displayName: seller.displayName,
                    rating: seller.ratingAverage,
                    reviewsCount: seller.ratingCount,
                    verified: seller.verified,
                  },
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No active listings currently">
            This merchant does not have active listings available at this moment.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
