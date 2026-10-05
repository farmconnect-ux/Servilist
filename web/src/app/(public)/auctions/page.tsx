import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AuctionCard } from "@/components/marketplace/cards";
import { Button, ButtonLink, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { createDb } from "@/lib/db/server";
import { listAuctions } from "@/server/repositories/auctions";

export const metadata = {
  title: "Auctions",
  description: "Bid on items from sellers across Africa. Auctions ending soonest are shown first.",
};

/** Auction marketplace (docs/UI_UX_SPEC.md section 29). */

const PAGE_SIZE = 20;
type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined, max = 80): string {
  return ((Array.isArray(value) ? value[0] : value) ?? "").slice(0, max).trim();
}

export default async function AuctionsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = first(params.q);
  const city = first(params.city, 50);
  const page = Math.max(1, Math.min(500, Number.parseInt(first(params.page, 4), 10) || 1));

  const { auctions, total } = await listAuctions(await createDb(), {
    q: q || undefined,
    city: city || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function href(target: number): string {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (city) next.set("city", city);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/auctions?${query}` : "/auctions";
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-5 lg:px-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[40px]">Auctions</h1>
        <p className="mt-1 text-sm text-ink-soft md:text-base">
          Bid on items from sellers. Auctions ending soonest come first.
        </p>
      </div>

      <form
        action="/auctions"
        method="get"
        role="search"
        className="grid gap-3 rounded-card border border-line bg-surface p-4 md:grid-cols-[1fr_220px_auto]"
      >
        <label htmlFor="auctions-q" className="sr-only">
          Search auctions
        </label>
        <Input id="auctions-q" name="q" type="search" defaultValue={q} maxLength={80} placeholder="Search auctions" />
        <label htmlFor="auctions-city" className="sr-only">
          City
        </label>
        <Input id="auctions-city" name="city" defaultValue={city} maxLength={50} placeholder="City" />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <section aria-label="Auctions" className="flex flex-col gap-4">
        <p className="text-sm text-ink-soft" role="status">
          {total === 1 ? "1 auction running" : `${total} auctions running`}
        </p>

        {auctions.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {auctions.map((auction) => (
              <li key={auction.id}>
                <AuctionCard auction={auction} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={q || city ? "No auctions match your search" : "No auctions running"}
            action={<ButtonLink href="/sell">Create an auction</ButtonLink>}
          >
            Have something buyers would compete for? List it as an auction.
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
