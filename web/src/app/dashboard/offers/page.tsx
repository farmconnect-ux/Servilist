import Link from "next/link";
import { OfferActions } from "@/components/marketplace/ListingActions";
import { Badge, Card, EmptyState, type BadgeTone } from "@/components/ui/card";
import { createDb } from "@/lib/db/server";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth/session";
import { listOffersForUser, type OfferRecord } from "@/server/repositories/offers";

export const metadata = { title: "Offers" };

const STATUS: Record<OfferRecord["status"], { label: string; tone: BadgeTone }> = {
  pending: { label: "Waiting for a response", tone: "warning" },
  accepted: { label: "Accepted", tone: "success" },
  rejected: { label: "Declined", tone: "danger" },
  countered: { label: "Countered", tone: "neutral" },
  cancelled: { label: "Withdrawn", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
};

export default async function DashboardOffersPage() {
  const user = await requireUser("/dashboard/offers");
  const db = await createDb();
  const offers = await listOffersForUser(db, user.userId);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-ink">Offers</h1>
        <p className="text-sm text-muted">
          Prices you have proposed on listings, and prices buyers have proposed on yours.
        </p>
      </div>

      {offers.length === 0 ? (
        <EmptyState title="No offers yet">
          When a listing is marked negotiable, buyers can propose a price from its page.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {offers.map((offer) => {
            const iAmBuyer = offer.buyerId === user.userId;
            const mine = offer.proposerId === user.userId;
            const other = iAmBuyer ? offer.seller : offer.buyer;
            const status = STATUS[offer.status];
            return (
              <li key={offer.id}>
                <Card className="flex flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-muted">
                        {iAmBuyer ? "You are buying from" : "You are selling to"}{" "}
                        {other?.displayName ?? "a member"}
                      </p>
                      <p className="font-bold text-ink">
                        {offer.listing?.slug ? (
                          <Link href={`/products/${offer.listing.slug}`} className="hover:text-brand">
                            {offer.listing.title}
                          </Link>
                        ) : (
                          (offer.listing?.title ?? "Listing no longer available")
                        )}
                      </p>
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="text-xl font-extrabold text-brand">
                      {formatMoney(offer.amountMinor, offer.currency)}
                    </span>
                    {offer.listing ? (
                      <span className="text-xs text-muted">
                        Listed at {formatMoney(offer.listing.priceMinor, offer.currency)}
                      </span>
                    ) : null}
                    <span className="text-xs text-muted">
                      {mine ? "Proposed by you" : `Proposed by ${other?.displayName ?? "the other party"}`}
                      {offer.parentOfferId ? " as a counter-offer" : ""}
                    </span>
                  </div>

                  {offer.message ? <p className="text-sm text-ink">{offer.message}</p> : null}

                  {offer.status === "pending" ? (
                    <OfferActions offerId={offer.id} currency={offer.currency} mine={mine} />
                  ) : null}
                  {offer.status === "accepted" ? (
                    <p className="text-sm text-muted">
                      Price agreed. Use Messages to arrange the handover; checkout for agreed offers
                      opens with orders and payments.
                    </p>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
