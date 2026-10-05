import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { RequestCard } from "@/components/marketplace/cards";
import { Button, ButtonLink, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { createDb } from "@/lib/db/server";
import { listCategories } from "@/server/repositories/categories";
import { listBuyerRequests } from "@/server/repositories/requests";

export const metadata = {
  title: "Buyer requests",
  description: "See what buyers are looking for and send them an offer, or post your own request.",
};

/**
 * Request marketplace (docs/UI_UX_SPEC.md sections 20 and 21). Requests are a
 * first-class part of the marketplace: the page opens by inviting a buyer to
 * post, then shows what other buyers need.
 */

const PAGE_SIZE = 18;
type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined, max = 80): string {
  return ((Array.isArray(value) ? value[0] : value) ?? "").slice(0, max).trim();
}

export default async function RequestsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = first(params.q);
  const city = first(params.city, 50);
  const category = first(params.category, 60) || "all";
  const page = Math.max(1, Math.min(500, Number.parseInt(first(params.page, 4), 10) || 1));

  const db = await createDb();
  const [categories, { requests, total }] = await Promise.all([
    listCategories(db),
    listBuyerRequests(db, {
      q: q || undefined,
      city: city || undefined,
      category: category !== "all" ? category : undefined,
      page,
      limit: PAGE_SIZE,
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(q || city || category !== "all");

  function href(target: number): string {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (city) next.set("city", city);
    if (category !== "all") next.set("category", category);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/requests?${query}` : "/requests";
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-5 lg:px-6">
      <section className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-6 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="max-w-2xl">
          <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[40px]">
            Can&apos;t find what you need?
          </h1>
          <p className="mt-2 text-[15px] text-ink-soft md:text-base">
            Tell sellers what you&apos;re looking for. They&apos;ll send you offers.
          </p>
        </div>
        <ButtonLink href="/requests/new" size="lg" className="shrink-0">
          <Plus className="size-5" aria-hidden="true" />
          Post a request
        </ButtonLink>
      </section>

      <form
        action="/requests"
        method="get"
        role="search"
        className="grid gap-3 rounded-card border border-line bg-surface p-4 md:grid-cols-[1fr_200px_200px_auto]"
      >
        <label htmlFor="requests-q" className="sr-only">
          Search requests
        </label>
        <Input id="requests-q" name="q" type="search" defaultValue={q} maxLength={80} placeholder="Search requests" />
        <label htmlFor="requests-category" className="sr-only">
          Category
        </label>
        <Select id="requests-category" name="category" defaultValue={category}>
          <option value="all">All categories</option>
          {categories
            .filter((item) => !item.parentId)
            .map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
        </Select>
        <label htmlFor="requests-city" className="sr-only">
          City
        </label>
        <Input id="requests-city" name="city" defaultValue={city} maxLength={50} placeholder="City" />
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <section aria-label="Requests" className="flex flex-col gap-4">
        <p className="text-sm text-ink-soft" role="status">
          {total === 1 ? "1 open request" : `${total} open requests`}
        </p>

        {requests.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <li key={request.id}>
                <RequestCard
                  request={{
                    id: request.id,
                    title: request.title,
                    category: request.category,
                    requestType: request.requestType === "service" ? "service" : "good",
                    currency: request.currency,
                    budgetMinor: request.budgetMinor,
                    urgency: request.urgency,
                    city: request.city,
                    createdAt: request.createdAt,
                    buyer: request.buyer,
                  }}
                  responses={request.quotesCount}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={filtered ? "No requests match your search" : "No requests yet"}
            action={<ButtonLink href="/requests/new">Post a request</ButtonLink>}
          >
            {filtered
              ? "Try fewer filters, or post your own request."
              : "Tell sellers what you're looking for and let them come to you."}
          </EmptyState>
        )}

        {pages > 1 ? (
          <nav aria-label="Pages" className="mt-4 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Link href={href(page - 1)} className={buttonClass("secondary")}>
                <ChevronLeft className="size-4" aria-hidden="true" />
                Previous
              </Link>
            ) : null}
            <span className="text-sm text-ink-soft">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link href={href(page + 1)} className={buttonClass("secondary")}>
                Next
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </main>
  );
}
