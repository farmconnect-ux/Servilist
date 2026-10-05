import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Globe, Mail, Phone } from "lucide-react";
import { ListingCard, Rating } from "@/components/marketplace/cards";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, EmptyState, VerifiedBadge } from "@/components/ui/card";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { getBusinessBySlug } from "@/server/repositories/businesses";
import { listListingsBySeller } from "@/server/repositories/listings";

/**
 * Business page (docs/UI_UX_SPEC.md sections 46 and 77): who the business is,
 * how to reach it, its policies and what it sells. The verified badge is the
 * owner's, set by Servilist staff; a business cannot give it to itself.
 */

function safeImage(value: unknown): string | null {
  const url = typeof value === "string" ? value.trim() : "";
  return /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : null;
}

async function load(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const db = await createDb();
  const business = await getBusinessBySlug(db, slug);
  return business ? { db, business } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const found = await load((await params).slug);
  if (!found) return { title: "Business not found" };
  const { business } = found;
  return {
    title: business.businessName,
    description:
      (business.tagline ?? business.description ?? "").slice(0, 160) ||
      `${business.businessName} on Servilist.`,
    alternates: { canonical: `/business/${business.slug}` },
  };
}

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const found = await load((await params).slug);
  if (!found) notFound();
  const { db, business } = found;

  const [viewer, allListings] = await Promise.all([
    getSessionUser(),
    listListingsBySeller(db, business.ownerId),
  ]);
  const listings = allListings.filter((listing) => listing.status === "active").slice(0, 24);
  const isOwner = viewer?.userId === business.ownerId;
  const owner = business.owner;

  const contacts = [
    business.supportPhone
      ? { icon: Phone, label: "Phone", value: business.supportPhone, href: `tel:${business.supportPhone.replace(/[^+\d]/g, "")}` }
      : null,
    business.supportEmail
      ? { icon: Mail, label: "Email", value: business.supportEmail, href: `mailto:${business.supportEmail}` }
      : null,
    business.websiteUrl
      ? { icon: Globe, label: "Website", value: business.websiteUrl.replace(/^https:\/\//, ""), href: business.websiteUrl }
      : null,
  ].filter((item) => item !== null);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-5 lg:px-6">
      {!business.isActive ? (
        <p role="status" className="rounded-input bg-danger-soft p-3 text-sm font-medium text-danger">
          This business page has been suspended and is hidden from buyers.
        </p>
      ) : null}

      <Card className="overflow-hidden">
        {business.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.bannerUrl} alt="" className="h-32 w-full object-cover md:h-48" />
        ) : (
          <div className="h-20 w-full bg-primary-50 md:h-28" aria-hidden="true" />
        )}
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-card border border-line bg-surface text-xl font-semibold text-primary-800">
              {business.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={business.logoUrl} alt="" className="size-full object-cover" />
              ) : (
                business.businessName.slice(0, 2).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[28px] leading-tight font-bold text-ink">{business.businessName}</h1>
                {owner?.verified ? <VerifiedBadge /> : null}
                <Badge tone="neutral">Business</Badge>
              </div>
              {business.tagline ? <p className="mt-1 text-base text-ink-soft">{business.tagline}</p> : null}
              <div className="mt-2">
                {owner && owner.reviewsCount > 0 ? (
                  <Rating value={owner.rating} count={owner.reviewsCount} />
                ) : (
                  <p className="text-xs text-muted">No reviews yet</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            {isOwner ? (
              <ButtonLink href="/dashboard/business" variant="secondary">
                Edit business page
              </ButtonLink>
            ) : null}
            {owner?.username ? (
              <ButtonLink href={`/seller/${owner.username}`} variant="secondary">
                Seller profile and reviews
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex flex-col gap-8">
          {business.description ? (
            <section aria-labelledby="about-title" className="flex flex-col gap-3">
              <h2 id="about-title" className="text-xl font-semibold text-ink md:text-2xl">
                About
              </h2>
              <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink-soft md:text-base">
                {business.description}
              </p>
            </section>
          ) : null}
          {business.returnPolicy ? (
            <section aria-labelledby="returns-title" className="flex flex-col gap-3">
              <h2 id="returns-title" className="text-xl font-semibold text-ink md:text-2xl">
                Return policy
              </h2>
              <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink-soft md:text-base">
                {business.returnPolicy}
              </p>
            </section>
          ) : null}
        </div>

        <Card className="flex h-fit flex-col gap-3 p-4">
          <h2 className="text-sm font-semibold text-muted">Contact and details</h2>
          {contacts.length > 0 ? (
            <ul className="flex flex-col">
              {contacts.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    rel={item.label === "Website" ? "noopener noreferrer nofollow" : undefined}
                    target={item.label === "Website" ? "_blank" : undefined}
                    className="flex min-h-11 items-center gap-3 text-sm text-ink hover:text-primary-700"
                  >
                    <item.icon className="size-4 shrink-0 text-muted" aria-hidden="true" />
                    <span className="sr-only">{item.label}: </span>
                    <span className="break-all">{item.value}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Contact this business through a listing&apos;s message button.</p>
          )}
          {business.openingHours ? (
            <p className="flex items-start gap-3 text-sm text-ink-soft">
              <Clock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
              <span>{business.openingHours}</span>
            </p>
          ) : null}
          {business.registrationNumber ? (
            <p className="border-t border-line pt-3 text-sm text-ink-soft">
              Registration number: <span className="font-medium text-ink">{business.registrationNumber}</span>
              <span className="block text-xs text-muted">Given by the business. Not checked by Servilist.</span>
            </p>
          ) : null}
          <p className="text-xs text-muted">
            On Servilist since{" "}
            {new Date(business.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </p>
        </Card>
      </div>

      <section aria-labelledby="listings-title" className="flex flex-col gap-4">
        <h2 id="listings-title" className="text-xl font-semibold text-ink md:text-2xl">
          Listings
        </h2>
        {listings.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
                    seller: item.seller,
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No listings yet"
            action={isOwner ? <ButtonLink href="/sell">Sell an item</ButtonLink> : undefined}
          >
            {isOwner ? "Your listings will appear here." : "This business has nothing listed right now."}
          </EmptyState>
        )}
      </section>
    </main>
  );
}
