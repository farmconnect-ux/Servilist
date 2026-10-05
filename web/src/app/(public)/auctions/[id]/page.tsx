import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/server/auth/session";
import { getAuctionDetailsAction } from "@/server/services/auctions";
import { AuctionBidClient } from "@/components/marketplace/AuctionBidClient";

export const dynamic = "force-dynamic";

export default async function AuctionDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const user = await getSessionUser();
  const details = await getAuctionDetailsAction(id);

  if (!details) {
    notFound();
  }

  const { auction, bids } = details;
  const isSeller = user?.userId === auction.sellerId;
  const reserveMet =
    auction.reserveAmountMinor !== null
      ? auction.currentAmountMinor >= auction.reserveAmountMinor
      : true;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex text-xs text-stone-500">
        <Link href="/" className="hover:text-stone-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/auctions" className="hover:text-stone-900">
          Auctions
        </Link>
        <span className="mx-2">/</span>
        <span className="truncate text-stone-900 font-medium max-w-xs">
          {auction.listing?.title || "Auction Details"}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left column: Gallery & Listing information (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="aspect-4/3 w-full bg-stone-100 overflow-hidden">
              <img
                src={
                  auction.listing?.imageUrl ||
                  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"
                }
                alt={auction.listing?.title || "Auction Listing"}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {auction.listing?.category || "Auction"}
              </span>
              <h1 className="mt-2 text-2xl font-bold text-stone-900">
                {auction.listing?.title}
              </h1>
              <p className="mt-1 text-xs text-stone-500">
                Location: {auction.listing?.city}, {auction.listing?.country}
              </p>
            </div>

            <div className="border-t border-stone-100 pt-4">
              <h3 className="text-sm font-semibold text-stone-900 mb-2">Seller Information</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 font-bold text-white text-sm">
                  {auction.seller?.displayName?.charAt(0) || "S"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-stone-900">
                    {auction.seller?.displayName || "Verified Seller"}
                    {auction.seller?.verified && (
                      <span className="ml-1 text-xs text-emerald-600 font-medium">✓ Verified</span>
                    )}
                  </div>
                  <div className="text-xs text-stone-500">
                    Rating: {auction.seller?.rating ? auction.seller.rating.toFixed(1) : "New"} (
                    {auction.seller?.reviewsCount || 0} reviews)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Bidding Panel & Live Timer (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6">
            <AuctionBidClient
              auctionId={auction.id}
              currency={auction.currency}
              startingAmountMinor={auction.startingAmountMinor}
              currentAmountMinor={auction.currentAmountMinor}
              minIncrementMinor={auction.minIncrementMinor}
              reserveMet={reserveMet}
              endsAt={auction.endsAt}
              status={auction.status}
              isSeller={isSeller}
              currentUserId={user?.userId || null}
              initialBids={bids}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
