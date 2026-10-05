import Link from "next/link";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { ListingCard, RequestCard, SearchBar } from "@/components/marketplace/cards";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { createDb } from "@/lib/db/server";
import { isReleased } from "@/lib/release";
import { cn } from "@/lib/utils";
import { listCategories } from "@/server/repositories/categories";
import { searchListings } from "@/server/repositories/listings";
import { listBuyerRequests } from "@/server/repositories/requests";
import { LISTING_CONDITIONS } from "@/server/validators/listing";

export const metadata = {
  title: "Search",
  description: "Search products and buyer requests across Africa.",
};

/**
 * Search results (docs/UI_UX_SPEC.md sections 18, 19 and 79).
 *
 * Filters sit beside the results on desktop and fold away on phones. The
 * filters are an ordinary form, so search works without scripts and every
 * result page has its own address.
 */

const PAGE_SIZE = 24;
const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

const CONDITION_LABELS: Record<(typeof LISTING_CONDITIONS)[number], string> = {
  new: "New",
  refurbished: "Refurbished",
  used_like_new: "Used, like new",
  used_good: "Used, good",
  used_fair: "Used, fair",
};

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined, max = 80): string {
  return ((Array.isArray(value) ? value[0] : value) ?? "").slice(0, max).trim();
}

function price(value: string): number | undefined {
  const amount = Number(value);
  return value !== "" && Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = first(params.q);
  const city = first(params.city, 50);
  const category = first(params.category, 60) || "all";
  const conditionParam = first(params.condition, 20);
  const condition = (LISTING_CONDITIONS as readonly string[]).includes(conditionParam)
    ? (conditionParam as (typeof LISTING_CONDITIONS)[number])
    : undefined;
  const sortParam = first(params.sort, 20);
  const sort: Sort = SORTS.some((option) => option.value === sortParam) ? (sortParam as Sort) : "newest";
  const minPrice = price(first(params.minPrice, 15));
  const maxPrice = price(first(params.maxPrice, 15));
  const page = Math.max(1, Math.min(500, Number.parseInt(first(params.page, 4), 10) || 1));
  const requestsOpen = isReleased("/requests");
  const tab = requestsOpen && first(params.tab, 10) === "requests" ? "requests" : "products";

  const db = await createDb();
  const [categories, products, requests] = await Promise.all([
    listCategories(db),
    searchListings(db, {
      q: q || undefined,
      category: category !== "all" ? category : undefined,
      city: city || undefined,
      condition,
      sort,
      minPrice,
      maxPrice,
      limit: PAGE_SIZE,
      page: tab === "products" ? page : 1,
    }),
    requestsOpen
      ? listBuyerRequests(db, {
          q: q || undefined,
          category: category !== "all" ? category : undefined,
          city: city || undefined,
          limit: PAGE_SIZE,
          page: tab === "requests" ? page : 1,
        })
      : Promise.resolve({ requests: [], total: 0 }),
  ]);

  const total = tab === "products" ? products.total : requests.total;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /** The current search with some values changed; empty values are left out of the address. */
  function href(changes: Record<string, string | number | undefined>): string {
    const next = new URLSearchParams();
    const values: Record<string, string | number | undefined> = {
      q,
      city,
      category: category === "all" ? "" : category,
      condition,
      sort: sort === "newest" ? "" : sort,
      minPrice,
      maxPrice,
      tab: tab === "products" ? "" : tab,
      ...changes,
    };
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== "") next.set(key, String(value));
    }
    const query = next.toString();
    return query ? `/search?${query}` : "/search";
  }

  const filters = (
    <form action="/search" method="get" className="flex flex-col gap-4">
      {q ? <input type="hidden" name="q" value={q} /> : null}
      {tab === "requests" ? <input type="hidden" name="tab" value="requests" /> : null}
      <Field id="filter-category" label="Category">
        <Select id="filter-category" name="category" defaultValue={category}>
          <option value="all">All categories</option>
          {categories
            .filter((item) => !item.parentId)
            .map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
        </Select>
      </Field>
      <Field id="filter-city" label="Location">
        <Input id="filter-city" name="city" defaultValue={city} maxLength={50} placeholder="City" />
      </Field>
      {tab === "products" ? (
        <>
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-semibold text-ink">Price</legend>
            <div className="mt-1.5 flex items-center gap-2">
              <label htmlFor="filter-min" className="sr-only">
                Lowest price
              </label>
              <Input
                id="filter-min"
                name="minPrice"
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="Min"
                defaultValue={minPrice ?? ""}
              />
              <span className="text-muted">to</span>
              <label htmlFor="filter-max" className="sr-only">
                Highest price
              </label>
              <Input
                id="filter-max"
                name="maxPrice"
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="Max"
                defaultValue={maxPrice ?? ""}
              />
            </div>
          </fieldset>
          <Field id="filter-condition" label="Condition">
            <Select id="filter-condition" name="condition" defaultValue={condition ?? ""}>
              <option value="">Any condition</option>
              {LISTING_CONDITIONS.map((value) => (
                <option key={value} value={value}>
                  {CONDITION_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="filter-sort" label="Sort by">
            <Select id="filter-sort" name="sort" defaultValue={sort}>
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </>
      ) : null}
      <Button type="submit">Apply filters</Button>
      <Link href={href({ category: "", city: "", condition: "", minPrice: "", maxPrice: "", sort: "" })} className={buttonClass("ghost")}>
        Clear filters
      </Link>
    </form>
  );

  const tabClass = (active: boolean) =>
    cn(
      "inline-flex min-h-11 items-center border-b-2 px-4 text-sm font-semibold transition-colors",
      active ? "border-primary-600 text-primary-700" : "border-transparent text-ink-soft hover:text-ink",
    );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-5 lg:px-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[40px]">
          {q ? `Results for "${q}"` : "Search"}
        </h1>
        <SearchBar defaultValue={q} defaultCity={city} />
      </div>

      {requestsOpen ? (
        <nav aria-label="Result type" className="flex border-b border-line">
          <Link
            href={href({ tab: "", page: "" })}
            className={tabClass(tab === "products")}
            aria-current={tab === "products" ? "page" : undefined}
          >
            Products ({products.total})
          </Link>
          <Link
            href={href({ tab: "requests", page: "" })}
            className={tabClass(tab === "requests")}
            aria-current={tab === "requests" ? "page" : undefined}
          >
            Requests ({requests.total})
          </Link>
        </nav>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters: a folding panel on phones and tablets, a sidebar on desktop */}
        <aside aria-label="Filters">
          <details className="rounded-card border border-line bg-surface lg:hidden">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-4 text-sm font-semibold text-ink">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filters and sorting
            </summary>
            <div className="border-t border-line p-4">{filters}</div>
          </details>
          <div className="hidden rounded-card border border-line bg-surface p-4 lg:block">
            <h2 className="mb-4 text-base font-semibold text-ink">Filters</h2>
            {filters}
          </div>
        </aside>

        <section aria-label="Results" className="flex min-w-0 flex-col gap-4">
          <p className="text-sm text-ink-soft" role="status">
            {total === 1 ? "1 result" : `${total} results`}
            {city ? ` in ${city}` : ""}
          </p>

          {tab === "products" ? (
            products.listings.length > 0 ? (
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {products.listings.map((item) => (
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
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No products match your search"
                action={
                  requestsOpen ? (
                    <Link href="/requests/new" className={buttonClass("primary")}>
                      Post a request
                    </Link>
                  ) : undefined
                }
              >
                Try fewer filters or different words
                {requestsOpen ? ", or tell sellers what you need and let them come to you." : "."}
              </EmptyState>
            )
          ) : requests.requests.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {requests.requests.map((item) => (
                <li key={item.id}>
                  <RequestCard
                    request={{
                      id: item.id,
                      title: item.title,
                      category: item.category,
                      requestType: item.requestType === "service" ? "service" : "good",
                      currency: item.currency,
                      budgetMinor: item.budgetMinor,
                      urgency: item.urgency,
                      city: item.city,
                      createdAt: item.createdAt,
                      buyer: item.buyer,
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No requests match your search"
              action={
                <Link href="/requests/new" className={buttonClass("primary")}>
                  Post a request
                </Link>
              }
            >
              Tell sellers what you&apos;re looking for and let them come to you.
            </EmptyState>
          )}

          {pages > 1 ? (
            <nav aria-label="Pages" className="mt-4 flex items-center justify-center gap-3">
              {page > 1 ? (
                <Link href={href({ page: page - 1 })} className={buttonClass("secondary")}>
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </Link>
              ) : null}
              <span className="text-sm text-ink-soft">
                Page {page} of {pages}
              </span>
              {page < pages ? (
                <Link href={href({ page: page + 1 })} className={buttonClass("secondary")}>
                  Next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              ) : null}
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  );
}
