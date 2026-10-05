import { notFound, permanentRedirect } from "next/navigation";
import { createDb } from "@/lib/db/server";
import { isUuid } from "@/lib/ids";
import { getListingById, getListingBySlug } from "@/server/repositories/listings";

/**
 * An auction is a listing, so it has one page: the product page, which shows
 * the bid panel for auctions. This address is kept so links to /auctions/{id}
 * keep working.
 */
export default async function AuctionRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createDb();
  const listing = isUuid(id) ? await getListingById(db, id) : await getListingBySlug(db, id);
  if (!listing) notFound();
  permanentRedirect(`/products/${listing.slug}`);
}
