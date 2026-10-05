import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Card } from "@/components/ui/card";
import { ListingCard, RequestCard, AuctionCard, SearchBar } from "@/components/marketplace/cards";
import { createDb } from "@/lib/db/server";
import { listActiveListings, listOpenRequests } from "@/server/repositories/marketplace";

export const metadata = {
  title: "Servilist · Buy, Sell, Request & Hire Across Africa",
  description:
    "Buy what you need. Sell what you have. Request what you cannot find. Pan-African two-sided marketplace with escrow protection and reverse matching.",
};

const CATEGORIES = [
  { slug: "phones-tablets", name: "Phones & Tablets", icon: "📱", count: "1,240+ items" },
  { slug: "vehicles", name: "Vehicles & Auto", icon: "🚗", count: "890+ items" },
  { slug: "real-estate", name: "Real Estate & Housing", icon: "🏠", count: "540+ properties" },
  { slug: "home-furniture", name: "Home & Furniture", icon: "🛋️", count: "720+ items" },
  { slug: "electronics", name: "Electronics & Tech", icon: "💻", count: "1,100+ items" },
  { slug: "services", name: "Skilled Services", icon: "🛠️", count: "480+ providers", href: "/services" },
  { slug: "fashion", name: "Fashion & Beauty", icon: "👗", count: "960+ items" },
  { slug: "agriculture", name: "Agriculture & Food", icon: "🌾", count: "350+ farm items" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; city?: string | string[] }>;
}) {
  const { q, city } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.slice(0, 80).trim() ?? "";
  const selectedCity = (Array.isArray(city) ? city[0] : city)?.slice(0, 50).trim() ?? "";

  const db = await createDb();
  const [listings, requests] = await Promise.all([
    listActiveListings(db, { query, limit: 12 }),
    listOpenRequests(db, { query, limit: 6 }),
  ]);

  const auctionListings = listings.filter((l) => l.format === "auction");

  return (
    <main className="flex flex-col min-h-screen bg-[#fafaf9]">
      {/* 1. HERO SECTION */}
      <section className="relative border-b border-zinc-200 bg-linear-to-b from-white via-zinc-50 to-[#fafaf9] pt-10 pb-16 sm:pt-14 sm:pb-20">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
            Pan-African Two-Sided Marketplace & Escrow
          </div>

          <h1 className="max-w-4xl text-3xl font-black tracking-tight text-zinc-900 sm:text-5xl sm:leading-tight">
            BUY WHAT YOU NEED. <br className="hidden sm:inline" />
            <span className="text-emerald-700">SELL WHAT YOU HAVE.</span> <br className="hidden sm:inline" />
            REQUEST WHAT YOU CANNOT FIND.
          </h1>

          <p className="max-w-2xl text-base text-zinc-600 sm:text-lg">
            A unified commerce platform combining direct e-commerce, skilled services, live auctions, and
            a reverse marketplace where buyers post requests and verified sellers quote.
          </p>

          <div className="w-full max-w-3xl mt-2">
            <SearchBar defaultValue={query} defaultCity={selectedCity} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-1 text-xs">
            <span className="font-semibold text-zinc-500">Quick actions:</span>
            <Link
              href="#listings"
              className="rounded-full bg-white border border-zinc-300 px-3.5 py-1.5 font-bold text-zinc-800 hover:border-emerald-600 hover:text-emerald-700 transition"
            >
              🛒 Buy Products
            </Link>
            <Link
              href="/sell"
              className="rounded-full bg-emerald-50 border border-emerald-300 px-3.5 py-1.5 font-bold text-emerald-800 hover:bg-emerald-100 transition"
            >
              💰 + Sell an Item
            </Link>
            <Link
              href="/requests/new"
              className="rounded-full bg-white border border-zinc-300 px-3.5 py-1.5 font-bold text-zinc-800 hover:border-emerald-600 hover:text-emerald-700 transition"
            >
              📢 Post a Request
            </Link>
            <Link
              href="/services"
              className="rounded-full bg-white border border-zinc-300 px-3.5 py-1.5 font-bold text-zinc-800 hover:border-emerald-600 hover:text-emerald-700 transition"
            >
              🛠️ Hire Services
            </Link>
          </div>
        </div>
      </section>

      {/* 2. DUAL-ENGINE QUICK ACTION CARDS */}
      <section className="mx-auto w-full max-w-7xl px-4 -mt-8 sm:px-6 z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex flex-col justify-between hover:border-emerald-500 transition shadow-sm bg-white">
            <div>
              <div className="text-3xl mb-3">🛒</div>
              <h3 className="text-base font-bold text-zinc-900">Buy Products</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Browse verified phones, electronics, vehicles, and goods from authenticated sellers.
              </p>
            </div>
            <Link href="#listings" className="mt-4 text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline">
              Explore Products →
            </Link>
          </Card>

          <Card className="p-5 flex flex-col justify-between hover:border-emerald-500 transition shadow-sm bg-white border-l-4 border-l-emerald-600">
            <div>
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-base font-bold text-zinc-900">Sell Anything</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Turn your inventory into cash. Instant listing, buyer messaging, and escrow payouts.
              </p>
            </div>
            <Link href="/sell" className="mt-4 text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline">
              + Start Selling →
            </Link>
          </Card>

          <Card className="p-5 flex flex-col justify-between hover:border-emerald-500 transition shadow-sm bg-white border-l-4 border-l-amber-500">
            <div>
              <div className="text-3xl mb-3">📢</div>
              <h3 className="text-base font-bold text-zinc-900">Post a Request</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Can&apos;t find what you need? Publish your budget and let verified vendors quote.
              </p>
            </div>
            <Link href="/requests/new" className="mt-4 text-xs font-bold text-amber-600 flex items-center gap-1 hover:underline">
              Create Buyer Request →
            </Link>
          </Card>

          <Card className="p-5 flex flex-col justify-between hover:border-emerald-500 transition shadow-sm bg-white">
            <div>
              <div className="text-3xl mb-3">🛠️</div>
              <h3 className="text-base font-bold text-zinc-900">Hire Services</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Book verified plumbers, mechanics, carpenters, and pros with milestone escrow.
              </p>
            </div>
            <Link href="/services" className="mt-4 text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline">
              Browse Services →
            </Link>
          </Card>
        </div>
      </section>

      {/* 3. POPULAR CATEGORIES GRID */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Popular Categories</h2>
            <p className="text-xs text-zinc-500">Explore listings and services across verified categories</p>
          </div>
          <Link href="/categories" className="text-xs font-bold text-emerald-700 hover:underline">
            View All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href || `/categories/${cat.slug}`}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 bg-white hover:border-emerald-500 hover:shadow-xs transition text-center group"
            >
              <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-xs font-bold text-zinc-900 line-clamp-1 group-hover:text-emerald-700">
                {cat.name}
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5">{cat.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. DEMAND-SIDE: PEOPLE ARE LOOKING FOR (REVERSE MARKETPLACE) */}
      <section className="border-y border-zinc-200 bg-zinc-100/60 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                Reverse Marketplace
              </div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
                People Are Looking For
              </h2>
              <p className="text-xs text-zinc-500">
                Buyers have published these active demands. Review their budgets and submit your quote.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ButtonLink href="/requests/new" variant="outline" size="sm">
                + Post a Request
              </ButtonLink>
              <Link href="/requests" className="text-xs font-bold text-emerald-700 hover:underline shrink-0">
                View All Requests →
              </Link>
            </div>
          </div>

          {requests.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={query ? "No requests match your search" : "No open requests yet"}
              action={
                <ButtonLink href="/requests/new" variant="primary" size="sm">
                  Post What You Are Looking For
                </ButtonLink>
              }
            >
              {query
                ? "Try a shorter or different search query."
                : "Post what you cannot find and let merchants and service providers come to you with offers."}
            </EmptyState>
          )}
        </div>
      </section>

      {/* 5. SUPPLY-SIDE: LATEST LISTINGS & PRODUCTS */}
      <section id="listings" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
              {query ? `Listings matching "${query}"` : "Latest Listings & Products"}
            </h2>
            <p className="text-xs text-zinc-500">
              Verified goods ready for direct checkout or safe in-person OTP exchange
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink href="/sell" variant="primary" size="sm">
              + Post a Listing
            </ButtonLink>
          </div>
        </div>

        {listings.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={query ? "No listings match your search" : "No listings yet"}
            action={
              <ButtonLink href="/sell" variant="primary" size="sm">
                Create First Listing
              </ButtonLink>
            }
          >
            {query ? "Try searching for a different keyword or city." : "Be the first vendor to list something on Servilist."}
          </EmptyState>
        )}
      </section>

      {/* 6. LIVE AUCTIONS SECTION (IF ANY AUCTIONS ACTIVE) */}
      {auctionListings.length > 0 && (
        <section className="border-t border-zinc-200 bg-amber-50/30 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                  ⚡ Real-Time Bidding
                </div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
                  Live Timed Auctions
                </h2>
                <p className="text-xs text-zinc-500">
                  Compete for deals with anti-sniping protection and automated escrow settlement.
                </p>
              </div>
              <Link href="/auctions" className="text-xs font-bold text-amber-700 hover:underline">
                View All Auctions →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {auctionListings.map((a) => (
                <AuctionCard
                  key={a.id}
                  auction={{
                    id: a.id,
                    title: a.title,
                    imageUrl: a.imageUrl,
                    currentBidMinor: a.amountMinor,
                    bidsCount: a.bidsCount,
                    currency: a.currency,
                    endsAt: a.auctionEndsAt || new Date().toISOString(),
                    city: a.city,
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. TRUST, SAFETY & ESCROW PILLARS */}
      <section className="border-t border-zinc-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight sm:text-3xl">
              Engineered for Trust Across Africa
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              Every transaction is protected by cryptographic OTP release, double-entry escrow, and verified vendor identities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border border-zinc-200 bg-zinc-50/50">
              <div className="size-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mb-4">
                🛡️
              </div>
              <h3 className="text-base font-bold text-zinc-900">100% Escrow Protection</h3>
              <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                When you pay online, your funds are locked in an audited double-entry ledger. Money is only released
                to the seller after you inspect the item and share your secret 6-digit handover OTP.
              </p>
            </Card>

            <Card className="p-6 border border-zinc-200 bg-zinc-50/50">
              <div className="size-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mb-4">
                🏛️
              </div>
              <h3 className="text-base font-bold text-zinc-900">Verified Vendors & CAC Check</h3>
              <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                We review national ID cards, business registration certificates (CAC), and physical storefront addresses
                before issuing the Verified Merchant badge to protect buyers from fraud.
              </p>
            </Card>

            <Card className="p-6 border border-zinc-200 bg-zinc-50/50">
              <div className="size-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mb-4">
                ⚡
              </div>
              <h3 className="text-base font-bold text-zinc-900">2-Sided Intelligent Matching</h3>
              <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                Post what you are looking for in natural language. Our PostgreSQL tsvector engine automatically notifies
                matching sellers, so you receive competitive quotes without endless searching.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 8. DESIGN SYSTEM PROMPT BANNER */}
      <section className="border-t border-zinc-200 bg-zinc-900 py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
              UI/UX Design System Specification
            </span>
            <h3 className="text-xl font-black mt-1">Live Component Library & Token Spec</h3>
            <p className="text-xs text-zinc-400 max-w-xl mt-1">
              Inspect the interactive design system showcase displaying primary green and accent amber scales, typography scales,
              button heights (44px/48px), input rings, status badges, and responsive card layouts.
            </p>
          </div>
          <ButtonLink
            href="/design-system"
            variant="primary"
            size="md"
            className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 font-bold"
          >
            Explore Design System Spec →
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
