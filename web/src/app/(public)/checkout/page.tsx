import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { getListingById } from "@/server/repositories/listings";
import { getBuyerFeeBps } from "@/server/repositories/orders";
import { availableProviders } from "@/server/payments/provider";
import { isUuid } from "@/lib/ids";
import { CheckoutClient } from "@/components/marketplace/CheckoutClient";

export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

interface CheckoutPageProps {
  searchParams: Promise<{
    listingId?: string;
    quoteId?: string;
    offerId?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { listingId, quoteId, offerId } = await searchParams;
  const user = await getSessionUser();

  if (!user) {
    const callback = `/checkout?${new URLSearchParams(
      Object.entries({ listingId, quoteId, offerId }).filter(([_, v]) => Boolean(v)) as any,
    ).toString()}`;
    redirect(`/login?next=${encodeURIComponent(callback)}`);
  }

  const db = await createDb();
  let itemDetails: {
    title: string;
    priceMinor: number;
    currency: string;
    listingId?: string;
    quoteId?: string;
    offerId?: string;
    sellerName?: string;
  } | null = null;

  // Accepted quotes on buyer requests are settled by handover code on the request, not here
  if (quoteId) redirect("/dashboard/requests");
  if ((listingId && !isUuid(listingId)) || (offerId && !isUuid(offerId))) notFound();

  if (listingId) {
    const listing = await getListingById(db, listingId);
    if (!listing || listing.status !== "active") notFound();
    if (listing.sellerId === user.userId) redirect(`/products/${listing.slug}`);
    itemDetails = {
      title: listing.title,
      priceMinor: listing.amountMinor,
      currency: listing.currency,
      listingId: listing.id,
      sellerName: listing.seller.displayName,
    };
  } else if (offerId) {
    const { data: offer } = await db
      .from("offers")
      .select("*, seller:profiles!seller_id(display_name), listing:listings!listing_id(title)")
      .eq("id", offerId)
      .maybeSingle();

    // Only the buyer of an accepted offer can check it out
    if (!offer || offer.buyer_id !== user.userId || offer.status !== "accepted") notFound();
    const seller = Array.isArray(offer.seller) ? offer.seller[0] : offer.seller;
    const listing = Array.isArray(offer.listing) ? offer.listing[0] : offer.listing;
    itemDetails = {
      title: listing?.title || "Accepted Offer Negotiation",
      priceMinor: Number(offer.amount_minor),
      currency: offer.currency,
      offerId: offer.id,
      sellerName: seller?.display_name,
    };
  } else {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-5 lg:px-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[40px]">Checkout</h1>
        <p className="mt-1 text-sm text-ink-soft md:text-base">
          You pay through a licensed payment provider. The seller is paid after you inspect the item and give them your handover code.
        </p>
      </div>

      <CheckoutClient
        item={itemDetails}
        feeBps={await getBuyerFeeBps(db)}
        providers={availableProviders(itemDetails.currency)}
      />
    </div>
  );
}
