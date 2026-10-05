import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { listAuctionsAction } from "@/server/services/auctions";

export const dynamic = "force-dynamic";

export default async function AuctionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status || "active") as any;
  const page = params.page ? parseInt(params.page) : 1;

  const { auctions, total } = await listAuctionsAction({
    status,
    category: params.category,
    page,
    limit: 24,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            Live Bidding
          </span>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
            Marketplace Auctions
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Bid on authentic items, verified collectibles, and high-demand products across Nigeria.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          <Link
            href="/auctions?status=active"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              status === "active"
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Live Auctions
          </Link>
          <Link
            href="/auctions?status=ended"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              status === "ended"
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Closed
          </Link>
          <Link
            href="/sell?format=auction"
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            + Create Auction
          </Link>
        </div>
      </div>

      {/* Grid */}
      {auctions.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-stone-300 p-12 text-center">
          <p className="text-stone-500 text-sm">No auctions found in this category or status.</p>
          <Link
            href="/sell?format=auction"
            className="mt-4 inline-block text-xs font-semibold text-amber-600 hover:underline"
          >
            Be the first to list an auction →
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {auctions.map((auction) => {
            const endsAtDate = new Date(auction.endsAt);
            const isEnded = new Date() >= endsAtDate;

            return (
              <Link
                key={auction.id}
                href={`/auctions/${auction.id}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Image */}
                <div className="aspect-square w-full overflow-hidden bg-stone-100">
                  <img
                    src={
                      auction.listing?.imageUrl ||
                      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={auction.listing?.title || "Auction Item"}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 rounded-full bg-stone-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    {isEnded ? "Ended" : "Live"}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                    {auction.listing?.category || "General"}
                  </div>
                  <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-stone-900 group-hover:text-amber-600">
                    {auction.listing?.title || "Untitled Auction Item"}
                  </h3>

                  <div className="mt-4 flex items-end justify-between border-t border-stone-100 pt-3">
                    <div>
                      <span className="text-[10px] text-stone-500">Current Bid</span>
                      <div className="text-base font-bold text-stone-900">
                        {formatMoney(auction.currentAmountMinor, auction.currency)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-stone-500">
                        {auction.totalBids} bid{auction.totalBids !== 1 ? "s" : ""}
                      </span>
                      <div className="text-[11px] font-medium text-amber-700">
                        {isEnded
                          ? "Closed"
                          : `Ends ${endsAtDate.toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}`}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
