import Link from "next/link";
import { createDb } from "@/lib/db/server";
import { listBuyerRequests } from "@/server/repositories/requests";
import { listCategories } from "@/server/repositories/categories";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Buyer Requests & Vendor Quotes · Servilist Africa",
  description: "Browse verified requests from buyers looking for products and services across Africa. Submit vendor quotes.",
};

interface RequestsPageProps {
  searchParams: Promise<{
    category?: string;
    city?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function RequestsFeedPage({ searchParams }: RequestsPageProps) {
  const { category, city, q, page } = await searchParams;
  const db = await createDb();

  const [categories, { requests, total }] = await Promise.all([
    listCategories(db),
    listBuyerRequests(db, {
      category: category && category !== "all" ? category : undefined,
      city: city && city !== "all" ? city : undefined,
      q,
      page: Number(page) || 1,
      limit: 20,
    }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      {/* Hero Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-ink via-ink/90 to-brand/80 p-8 text-white sm:flex-row sm:items-center">
        <div className="max-w-2xl">
          <span className="rounded-full bg-brand/30 px-3 py-1 text-xs font-bold text-white">
            REVERSE MARKETPLACE
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">
            Buyer Requests & Quotes
          </h1>
          <p className="mt-2 text-sm text-disabled">
            Can’t find what you need? Post what you want and let verified sellers and service providers pitch you with direct quotes.
          </p>
        </div>
        <div>
          <Link href="/requests/new">
            <Button className="bg-brand hover:bg-brand/90 text-white font-bold shadow-lg min-h-12 px-6">
              + Post a Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <form className="flex flex-wrap items-center gap-3 rounded-xl border bg-surface p-4 shadow-sm" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search requests (e.g. iPhone, solar inverter, wedding caterer)..."
          className="flex-1 min-w-[200px] rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />

        <select
          name="category"
          defaultValue={category || "all"}
          className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          name="city"
          defaultValue={city || "all"}
          className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="all">All Locations</option>
          <option value="Lagos">Lagos, Nigeria</option>
          <option value="Abuja">Abuja, Nigeria</option>
          <option value="Nairobi">Nairobi, Kenya</option>
          <option value="Accra">Accra, Ghana</option>
          <option value="Johannesburg">Johannesburg, South Africa</option>
        </select>

        <Button type="submit" variant="outline" className="min-h-11 px-3 text-xs">
          Filter
        </Button>
      </form>

      {/* Results List */}
      <div>
        <p className="mb-4 text-xs font-semibold text-muted uppercase tracking-wide">
          {total} Active Requests Found
        </p>

        {requests.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-lg font-bold text-ink">No requests match your filter</p>
            <p className="mt-1 text-sm text-muted">
              Be the first to post a request or try adjusting your search terms.
            </p>
            <Link href="/requests/new" className="mt-4">
              <Button>Post a Request Now</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((req) => (
              <Link key={req.id} href={`/requests/${req.id}`}>
                <Card className="h-full p-6 transition hover:shadow-md hover:border-brand/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="font-semibold text-brand uppercase">{req.category}</span>
                      <span>{req.urgency}</span>
                    </div>

                    <h3 className="mt-2 text-lg font-bold text-ink line-clamp-2">
                      {req.title}
                    </h3>

                    <p className="mt-2 text-xs text-muted line-clamp-3">
                      {req.description}
                    </p>
                  </div>

                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted">Budget:</span>
                      <span className="text-lg font-bold text-ink">
                        {formatMoney(req.budgetMinor, req.currency)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-muted">
                      <span>{req.city}</span>
                      <span className="font-medium text-brand">
                        {req.quotesCount} quote{req.quotesCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
