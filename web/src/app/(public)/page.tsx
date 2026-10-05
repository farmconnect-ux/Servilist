import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  type LucideIcon,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Store,
  Wrench,
} from "lucide-react";
import { CategoryIcon } from "@/components/marketplace/CategoryIcon";
import { ListingCard, RequestCard, SearchBar } from "@/components/marketplace/cards";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { createDb } from "@/lib/db/server";
import { isReleased } from "@/lib/release";
import { listCategories } from "@/server/repositories/categories";
import {
  countActiveListingsByCategory,
  listActiveListings,
  listOpenRequests,
} from "@/server/repositories/marketplace";

/**
 * Home page (docs/UI_UX_SPEC.md sections 11 to 13, 86).
 *
 * A first-time visitor should see at once that they can buy, sell, request, or
 * find a service. Every figure and card comes from the database; sections for
 * parts of the marketplace that are not open yet are left out, not faked.
 */

const PAGE = "mx-auto w-full max-w-7xl px-4 md:px-5 lg:px-6";

interface QuickAction {
  href: string;
  title: string;
  text: string;
  icon: LucideIcon;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: "/search",
    title: "Buy",
    text: "Browse products from sellers near you and across Africa.",
    icon: ShoppingBag,
  },
  {
    href: "/sell",
    title: "Sell",
    text: "List what you have in a few steps, priced in your own currency.",
    icon: Store,
  },
  {
    href: "/requests/new",
    title: "Request",
    text: "Tell sellers what you need and let them send offers.",
    icon: ClipboardList,
  },
  {
    href: "/services",
    title: "Find a service",
    text: "Hire a provider for repairs, cleaning, transport and more.",
    icon: Wrench,
  },
];

function SectionHeading({
  id,
  title,
  text,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  text?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="text-2xl font-bold text-ink md:text-[32px] md:leading-tight">
          {title}
        </h2>
        {text ? <p className="mt-1 text-sm text-ink-soft md:text-base">{text}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary-700 hover:underline sm:inline-flex"
        >
          {linkLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const db = await createDb();
  const [listings, requests, categories, counts] = await Promise.all([
    listActiveListings(db, { limit: 10 }),
    listOpenRequests(db, { limit: 6 }),
    listCategories(db),
    countActiveListingsByCategory(db),
  ]);

  const quickActions = QUICK_ACTIONS.filter((action) => isReleased(action.href));
  const topCategories = categories.filter((category) => !category.parentId).slice(0, 12);

  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-line bg-surface">
        <div className={`${PAGE} flex flex-col items-center gap-6 py-12 text-center md:py-16`}>
          <h1 className="max-w-3xl text-[32px] leading-tight font-bold tracking-tight text-ink md:text-5xl md:leading-[1.1]">
            Buy what you need.
            <br />
            Sell what you have.
            <br />
            <span className="text-primary-700">Request what you can&apos;t find.</span>
          </h1>
          <p className="max-w-2xl text-[15px] text-ink-soft md:text-base">
            Buy products, discover services, sell your items, or tell sellers exactly what
            you&apos;re looking for.
          </p>
          <div className="w-full max-w-3xl">
            <SearchBar />
          </div>
          <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href="/search" size="lg" className="sm:flex-1">
              Buy something
            </ButtonLink>
            <ButtonLink href="/sell" size="lg" variant="secondary" className="sm:flex-1">
              Sell something
            </ButtonLink>
            {isReleased("/requests/new") ? (
              <ButtonLink href="/requests/new" size="lg" variant="secondary" className="sm:flex-1">
                Post a request
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </section>

      <div className={`${PAGE} flex flex-col gap-16 py-12`}>
        {/* Quick actions */}
        <section aria-label="What you can do">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <li key={action.href}>
                <Link href={action.href} className="group block h-full">
                  <Card className="flex h-full flex-col gap-3 p-6 transition-colors duration-200 group-hover:border-primary-600">
                    <span className="flex size-12 items-center justify-center rounded-card bg-primary-50 text-primary-700">
                      <action.icon className="size-6" aria-hidden="true" />
                    </span>
                    <h2 className="text-xl font-semibold text-ink">{action.title}</h2>
                    <p className="text-sm text-ink-soft">{action.text}</p>
                    <ArrowRight
                      className="mt-auto size-5 text-primary-700 transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Popular categories */}
        {topCategories.length > 0 ? (
          <section aria-labelledby="categories-title" className="flex flex-col gap-6">
            <SectionHeading
              id="categories-title"
              title="Popular categories"
              href="/categories"
              linkLabel="All categories"
            />
            {/* A horizontal carousel on mobile, a grid from tablet up */}
            <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-6">
              {topCategories.map((category) => {
                const count = counts.get(category.slug) ?? 0;
                return (
                  <li key={category.id} className="w-36 shrink-0 snap-start md:w-auto">
                    <Link href={`/categories/${category.slug}`} className="group block h-full">
                      <Card className="flex h-full flex-col items-center gap-2 p-4 text-center transition-colors duration-200 group-hover:border-primary-600">
                        <CategoryIcon slug={category.slug} className="size-6 text-primary-700" />
                        <span className="text-sm font-medium text-ink">{category.name}</span>
                        <span className="text-xs text-muted">
                          {count === 1 ? "1 listing" : `${count} listings`}
                        </span>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* Featured products */}
        <section aria-labelledby="listings-title" className="flex flex-col gap-6">
          <SectionHeading
            id="listings-title"
            title="Latest listings"
            text="Newly listed by sellers."
            href="/search"
            linkLabel="See all"
          />
          {listings.length > 0 ? (
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {listings.map((listing) => (
                <li key={listing.id}>
                  <ListingCard listing={listing} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No listings yet"
              action={<ButtonLink href="/sell">Sell something</ButtonLink>}
            >
              Be the first to list an item for sale.
            </EmptyState>
          )}
        </section>

        {/* People are looking for */}
        {isReleased("/requests") ? (
          <section aria-labelledby="requests-title" className="flex flex-col gap-6">
            <SectionHeading
              id="requests-title"
              title="People are looking for"
              text="Buyers post what they need. Sellers respond with offers."
              href="/requests"
              linkLabel="All requests"
            />
            {requests.length > 0 ? (
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {requests.map((request) => (
                  <li key={request.id}>
                    <RequestCard request={request} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No requests yet"
                action={<ButtonLink href="/requests/new">Post a request</ButtonLink>}
              >
                Tell sellers what you&apos;re looking for and let them come to you.
              </EmptyState>
            )}
          </section>
        ) : null}

        {/* Trust and safety */}
        <section aria-labelledby="trust-title" className="flex flex-col gap-6">
          <SectionHeading id="trust-title" title="Trade with confidence" />
          <ul className="grid gap-4 md:grid-cols-3">
            <li>
              <Card className="flex h-full flex-col gap-2 p-6">
                <ShieldCheck className="size-6 text-primary-700" aria-hidden="true" />
                <h3 className="text-base font-semibold text-ink">Pay through a licensed provider</h3>
                <p className="text-sm text-ink-soft">
                  Online payments are handled by a licensed payment provider, and the seller is paid
                  only after you confirm handover with your code.
                </p>
              </Card>
            </li>
            <li>
              <Card className="flex h-full flex-col gap-2 p-6">
                <MapPin className="size-6 text-primary-700" aria-hidden="true" />
                <h3 className="text-base font-semibold text-ink">Meet safely</h3>
                <p className="text-sm text-ink-soft">
                  Meet in a public place and check the item before you give your handover code.
                </p>
              </Card>
            </li>
            <li>
              <Card className="flex h-full flex-col gap-2 p-6">
                <ClipboardList className="size-6 text-primary-700" aria-hidden="true" />
                <h3 className="text-base font-semibold text-ink">Report a problem</h3>
                <p className="text-sm text-ink-soft">
                  Report a listing, or open a dispute on a paid order, and our team will step in.
                </p>
              </Card>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
