import Link from "next/link";
import { createDb } from "@/lib/db/server";
import { searchListings } from "@/server/repositories/listings";
import { listCategories } from "@/server/repositories/categories";
import { ListingCard, SearchBar } from "@/components/marketplace/cards";
import { EmptyState } from "@/components/ui/card";

export const metadata = {
  title: "Search Marketplace · Servilist Africa",
  description: "Search goods, vehicles, electronics and services across African cities.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
    condition?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const selectedCategory = params.category || "all";
  const selectedCity = params.city || "all";
  const selectedCondition = params.condition || "";
  const selectedSort = (params.sort as any) || "newest";

  const db = await createDb();
  const [categories, { listings, total }] = await Promise.all([
    listCategories(db),
    searchListings(db, {
      q: query || undefined,
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      city: selectedCity !== "all" ? selectedCity : undefined,
      condition: (selectedCondition as any) || undefined,
      sort: selectedSort,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      limit: 24,
      page: 1,
    }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted">
          <Link href="/" className="hover:text-brand">Home</Link> &gt; <span>Search</span>
        </nav>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Search Servilist</h1>
        <div className="mt-4">
          <SearchBar defaultValue={query} />
        </div>
      </div>

      {/* Filter Badges & Categories */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4 text-xs font-semibold">
        <span className="text-muted">Category:</span>
        <Link
          href={`/search?q=${encodeURIComponent(query)}&category=all`}
          className={`rounded-full px-3 py-1 ${selectedCategory === "all" ? "bg-brand text-white" : "bg-page text-ink hover:bg-brand-soft"}`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/search?q=${encodeURIComponent(query)}&category=${c.slug}`}
            className={`rounded-full px-3 py-1 ${selectedCategory === c.slug ? "bg-brand text-white" : "bg-page text-ink hover:bg-brand-soft"}`}
          >
            {c.icon} {c.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>Found {total} {total === 1 ? "result" : "results"}</span>
        <div className="flex items-center gap-3">
          <span>Sort by:</span>
          <Link
            href={`/search?q=${encodeURIComponent(query)}&category=${selectedCategory}&sort=newest`}
            className={selectedSort === "newest" ? "font-bold text-brand" : "hover:text-ink"}
          >
            Newest
          </Link>
          <span>·</span>
          <Link
            href={`/search?q=${encodeURIComponent(query)}&category=${selectedCategory}&sort=price_asc`}
            className={selectedSort === "price_asc" ? "font-bold text-brand" : "hover:text-ink"}
          >
            Price: Low to High
          </Link>
          <span>·</span>
          <Link
            href={`/search?q=${encodeURIComponent(query)}&category=${selectedCategory}&sort=price_desc`}
            className={selectedSort === "price_desc" ? "font-bold text-brand" : "hover:text-ink"}
          >
            Price: High to Low
          </Link>
        </div>
      </div>

      {listings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((item) => (
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
                  id: item.seller.id,
                  username: item.seller.username,
                  displayName: item.seller.displayName,
                  rating: item.seller.rating,
                  reviewsCount: item.seller.reviewsCount,
                  verified: item.seller.verified,
                },
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No items found">
          {query
            ? `No listings match "${query}". Try adjusting your keywords or category filters.`
            : "No listings are currently available for this search criteria."}
        </EmptyState>
      )}
    </div>
  );
}
