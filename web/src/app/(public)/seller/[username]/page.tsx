import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { ListingCard, Rating } from "@/components/marketplace/cards";
import { ReportButton } from "@/components/marketplace/TrustActions";
import { Card, EmptyState, VerifiedBadge } from "@/components/ui/card";
import { createDb } from "@/lib/db/server";
import { isReleased } from "@/lib/release";
import { getSessionUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";
import { listListingsBySeller } from "@/server/repositories/listings";
import { listReviewsForProfile } from "@/server/repositories/moderation";
import { getSellerByUsername } from "@/server/repositories/sellerProfiles";

/**
 * Seller profile (docs/UI_UX_SPEC.md sections 17 and 77). It shows what the
 * database can vouch for: verification, rating from real reviews, how long the
 * member has been here, and their listings. Figures that are not measured yet
 * (response rate, follower counts) are left out.
 */

function safeImage(value: unknown): string | null {
  const url = typeof value === "string" ? value.trim() : "";
  return /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const seller = await getSellerByUsername(await createDb(), username);
  if (!seller) return { title: "Seller not found" };
  return {
    title: seller.displayName,
    description: seller.bio?.slice(0, 160) ?? `Listings from ${seller.displayName} on Servilist.`,
    alternates: { canonical: `/seller/${seller.username}` },
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-input bg-surface-muted p-3 text-center">
      <dd className="text-xl font-bold text-ink">{value}</dd>
      <dt className="text-xs text-muted">{label}</dt>
    </div>
  );
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const db = await createDb();
  const seller = await getSellerByUsername(db, username);
  if (!seller) notFound();

  const reviewsOpen = isReleased("/api/v1/reviews");
  const [allListings, reviews, viewer] = await Promise.all([
    listListingsBySeller(db, seller.id),
    reviewsOpen ? listReviewsForProfile(db, seller.id) : Promise.resolve([]),
    getSessionUser(),
  ]);
  const listings = allListings.filter((item) => item.status === "active");
  const place = [seller.city, seller.country].filter(Boolean).join(", ");
  const canReport =
    viewer !== null && viewer.userId !== seller.id && canParticipate(viewer) && isReleased("/api/v1/reports");

  const tab =
    "inline-flex min-h-11 items-center border-b-2 border-transparent px-4 text-sm font-semibold text-ink-soft hover:border-line-strong hover:text-ink";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-5 lg:px-6">
      <Card className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <span
            className="flex size-16 shrink-0 items-center justify-center rounded-pill bg-primary-50 text-xl font-semibold text-primary-800 md:size-20"
            aria-hidden="true"
          >
            {seller.displayName.slice(0, 2).toUpperCase()}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[32px]">
                {seller.displayName}
              </h1>
              {seller.verified ? <VerifiedBadge /> : null}
            </div>
            {seller.ratingCount > 0 ? (
              <Rating value={seller.ratingAverage} count={seller.ratingCount} />
            ) : (
              <p className="text-sm text-muted">No reviews yet</p>
            )}
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
              {place ? (
                <li className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-muted" aria-hidden="true" />
                  {place}
                </li>
              ) : null}
              <li className="flex items-center gap-1.5">
                <CalendarDays className="size-4 text-muted" aria-hidden="true" />
                Joined{" "}
                {new Date(seller.memberSince).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </li>
            </ul>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 md:max-w-md">
          <Stat label="Active listings" value={String(listings.length)} />
          <Stat
            label={seller.ratingCount === 1 ? "Review" : "Reviews"}
            value={seller.ratingCount > 0 ? `${seller.ratingAverage.toFixed(1)} (${seller.ratingCount})` : "0"}
          />
        </dl>

        {canReport ? <ReportButton targetType="profile" targetId={seller.id} label="Report this member" /> : null}
      </Card>

      <nav aria-label="Profile sections" className="flex overflow-x-auto border-b border-line">
        <a href="#listings" className={tab}>
          Listings ({listings.length})
        </a>
        {reviewsOpen ? (
          <a href="#reviews" className={tab}>
            Reviews ({reviews.length})
          </a>
        ) : null}
        {seller.bio ? (
          <a href="#about" className={tab}>
            About
          </a>
        ) : null}
      </nav>

      <section id="listings" aria-labelledby="listings-title" className="flex scroll-mt-40 flex-col gap-4">
        <h2 id="listings-title" className="text-xl font-semibold text-ink md:text-2xl">
          Listings
        </h2>
        {listings.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {listings.map((item) => (
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
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No active listings">
            This seller has nothing listed at the moment.
          </EmptyState>
        )}
      </section>

      {reviewsOpen ? (
        <section id="reviews" aria-labelledby="reviews-title" className="flex scroll-mt-40 flex-col gap-4">
          <h2 id="reviews-title" className="text-xl font-semibold text-ink md:text-2xl">
            Reviews
          </h2>
          {reviews.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {reviews.map((review) => (
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
            <p className="text-sm text-muted">No reviews yet. Reviews appear after completed orders.</p>
          )}
        </section>
      ) : null}

      {seller.bio ? (
        <section id="about" aria-labelledby="about-title" className="flex scroll-mt-40 flex-col gap-3">
          <h2 id="about-title" className="text-xl font-semibold text-ink md:text-2xl">
            About
          </h2>
          <p className="max-w-3xl text-[15px] leading-relaxed whitespace-pre-line text-ink-soft md:text-base">
            {seller.bio}
          </p>
        </section>
      ) : null}
    </main>
  );
}
