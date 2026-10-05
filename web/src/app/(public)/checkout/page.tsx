import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { getListingById } from "@/server/repositories/listings";
import { CheckoutClient } from "@/components/marketplace/CheckoutClient";

export const metadata = {
  title: "Secure Escrow Checkout · Servilist Africa",
  description: "Complete your purchase with guaranteed buyer protection and escrow security.",
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

  if (listingId) {
    const listing = await getListingById(db, listingId);
    if (!listing) notFound();
    itemDetails = {
      title: listing.title,
      priceMinor: listing.amountMinor,
      currency: listing.currency,
      listingId: listing.id,
      sellerName: listing.seller.displayName,
    };
  } else if (quoteId) {
    const { data: quote } = await db
      .from("quotes")
      .select("*, provider:profiles!provider_id(display_name)")
      .eq("id", quoteId)
      .maybeSingle();

    if (!quote) notFound();
    const provider = Array.isArray(quote.provider) ? quote.provider[0] : quote.provider;
    itemDetails = {
      title: "Accepted Service / Good Quote",
      priceMinor: Number(quote.amount_minor),
      currency: quote.currency,
      quoteId: quote.id,
      sellerName: provider?.display_name,
    };
  } else if (offerId) {
    const { data: offer } = await db
      .from("offers")
      .select("*, seller:profiles!seller_id(display_name), listing:listings!listing_id(title)")
      .eq("id", offerId)
      .maybeSingle();

    if (!offer) notFound();
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted">
          <Link href="/" className="hover:text-brand">Home</Link> &gt; <span>Checkout</span>
        </nav>
        <h1 className="text-2xl font-black text-ink sm:text-3xl">Secure Escrow Checkout</h1>
        <p className="mt-1 text-sm text-muted">
          Your payment is held safely in escrow until you inspect your item and provide the handover OTP.
        </p>
      </div>

      <CheckoutClient item={itemDetails} />
    </div>
  );
}
