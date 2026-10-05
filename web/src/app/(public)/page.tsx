import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { ListingCard, RequestCard, SearchBar } from "@/components/marketplace/cards";
import { createDb } from "@/lib/db/server";
import { listActiveListings, listOpenRequests } from "@/server/repositories/marketplace";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.slice(0, 80).trim() ?? "";

  const db = await createDb();
  const [listings, requests] = await Promise.all([
    listActiveListings(db, { query, limit: 12 }),
    listOpenRequests(db, { query, limit: 6 }),
  ]);

  return (
    <main className="flex flex-col">
      <section className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:py-12">
          <h1 className="max-w-3xl text-3xl leading-tight font-extrabold text-ink sm:text-4xl">
            Buy what you need. Sell what you have. Request what you cannot find.
          </h1>
          <p className="max-w-2xl text-base text-muted">
            Classifieds, auctions and buyer requests for goods and services, priced in the local
            currency.
          </p>
          <SearchBar defaultValue={query} />
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="#listings">Buy</ButtonLink>
            <ButtonLink href="/sell" variant="secondary">
              Sell
            </ButtonLink>
            <ButtonLink href="/categories" variant="outline">
              Browse categories
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8">
        <section id="listings" aria-labelledby="listings-title" className="flex flex-col gap-4">
          <h2 id="listings-title" className="text-xl font-bold text-ink">
            {query ? `Listings matching "${query}"` : "Latest listings"}
          </h2>
          {listings.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyState title={query ? "No listings match your search" : "No listings yet"}>
              {query ? "Try a shorter or different search." : "Be the first to list something."}
            </EmptyState>
          )}
        </section>

        <section aria-labelledby="requests-title" className="flex flex-col gap-4">
          <div>
            <h2 id="requests-title" className="text-xl font-bold text-ink">
              {query ? `Buyer requests matching "${query}"` : "Buyer requests"}
            </h2>
            <p className="text-sm text-muted">
              Buyers say what they need and sellers respond with offers.
            </p>
          </div>
          {requests.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <EmptyState title={query ? "No requests match your search" : "No open requests yet"}>
              {query
                ? "Try a shorter or different search."
                : "Post what you are looking for and let sellers come to you."}
            </EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}
