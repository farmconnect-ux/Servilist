import { CategoryIcon } from "@/components/marketplace/CategoryIcon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createDb } from "@/lib/db/server";
import { getCategoryBySlug } from "@/server/repositories/categories";
import { searchListings } from "@/server/repositories/listings";
import { ListingCard } from "@/components/marketplace/cards";
import { EmptyState } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort } = await searchParams;

  const db = await createDb();
  const category = await getCategoryBySlug(db, slug);

  if (!category) {
    notFound();
  }

  const { listings, total } = await searchListings(db, {
    category: category.slug,
    sort: (sort as any) || "newest",
    limit: 24,
    page: 1,
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted">
          <Link href="/" className="hover:text-brand">Home</Link> &gt;{" "}
          <Link href="/categories" className="hover:text-brand">Categories</Link> &gt;{" "}
          <span className="font-semibold text-ink">{category.name}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CategoryIcon slug={category.slug} className="size-8 text-primary-700" />
            <div>
              <h1 className="text-2xl font-bold text-ink sm:text-3xl">{category.name}</h1>
              <p className="text-sm text-muted">{category.description}</p>
            </div>
          </div>
          <ButtonLink href="/sell" variant="secondary">
            Post in {category.name}
          </ButtonLink>
        </div>

        {category.subcategories && category.subcategories.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {category.subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/categories/${sub.slug}`}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="text-sm font-semibold text-muted">
          {total} {total === 1 ? "listing" : "listings"} available
        </span>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">Sort:</span>
          <Link
            href={`/categories/${slug}?sort=newest`}
            className={`font-semibold ${!sort || sort === "newest" ? "text-brand" : "text-muted hover:text-ink"}`}
          >
            Newest
          </Link>
          <span>·</span>
          <Link
            href={`/categories/${slug}?sort=price_asc`}
            className={`font-semibold ${sort === "price_asc" ? "text-brand" : "text-muted hover:text-ink"}`}
          >
            Price: Low to High
          </Link>
          <span>·</span>
          <Link
            href={`/categories/${slug}?sort=price_desc`}
            className={`font-semibold ${sort === "price_desc" ? "text-brand" : "text-muted hover:text-ink"}`}
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
        <EmptyState title={`No items listed under ${category.name} yet`}>
          Be the first trader to list an item in this category across African hubs.
        </EmptyState>
      )}
    </div>
  );
}
