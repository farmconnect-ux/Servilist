import Link from "next/link";
import { notFound } from "next/navigation";
import { createDb } from "@/lib/db/server";
import { isUuid } from "@/lib/ids";
import { isReleased } from "@/lib/release";
import { findMatchingListingsForRequest } from "@/server/repositories/matching";
import { getSessionUser } from "@/server/auth/session";
import { getBuyerRequestById, getQuotesForRequest } from "@/server/repositories/requests";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { RequestDetailClient } from "@/components/marketplace/RequestDetailClient";
import { Rating } from "@/components/marketplace/cards";
import { VerifiedBadge } from "@/components/ui/card";

interface RequestPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RequestPageProps) {
  const { id } = await params;
  const db = await createDb();
  const request = isUuid(id) ? await getBuyerRequestById(db, id) : null;

  if (!request) {
    return { title: "Request Not Found · Servilist" };
  }

  return {
    title: `${request.title} · Buyer Request · Servilist`,
    description: request.description.slice(0, 160),
  };
}

export default async function RequestDetailPage({ params }: RequestPageProps) {
  const { id } = await params;
  const db = await createDb();
  if (!isUuid(id)) notFound();
  const [request, quotes, sessionUser] = await Promise.all([
    getBuyerRequestById(db, id),
    getQuotesForRequest(db, id),
    getSessionUser(),
  ]);

  if (!request) {
    notFound();
  }

  // Matching is written but not yet verified, so it stays switched off with its endpoint
  const matches = isReleased(`/api/v1/requests/${id}/matches`)
    ? await findMatchingListingsForRequest(db, id, 3)
    : [];

  const isOwner = sessionUser?.userId === request.buyerId;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-5 lg:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/" className="hover:text-brand">Home</Link> &gt;{" "}
        <Link href="/requests" className="hover:text-brand">Buyer Requests</Link> &gt;{" "}
        <span className="text-ink">{request.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Details (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-control border border-primary-200 bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-800">
                Looking for
              </span>
              <span className="rounded-control border border-line bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-soft capitalize">
                {request.category}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  request.status === "open"
                    ? "bg-primary-50 text-primary-700"
                    : request.status === "matched"
                    ? "bg-info-soft text-info"
                    : "bg-surface-muted text-ink-soft"
                }`}
              >
                {request.status === "open" ? "Open" : request.status === "matched" ? "Offer accepted" : "Closed"}
              </span>
            </div>

            <h1 className="mt-3 text-[28px] leading-tight font-bold text-ink md:text-[40px]">
              {request.title}
            </h1>
            <p className="mt-1 text-xs text-muted">
              Posted {new Date(request.createdAt).toLocaleDateString()} · {request.city},{" "}
              {request.country}
            </p>
          </div>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
              What the buyer needs
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
              {request.description}
            </p>

            {request.conditionRequired && (
              <div className="mt-6 border-t pt-4">
                <span className="text-xs font-semibold text-muted">Condition Required:</span>
                <p className="text-sm font-medium text-ink">{request.conditionRequired}</p>
              </div>
            )}
          </Card>

          {/* Interactive Quotes and Proposal Submission */}
          <RequestDetailClient
            requestId={request.id}
            currency={request.currency}
            initialQuotes={quotes}
            isOwner={isOwner}
            requestStatus={request.status}
            signedIn={Boolean(sessionUser)}
          />

          {/* Listings that match this request (opens with Sprint 9 matching) */}
          {matches.length > 0 && (
            <Card className="p-6 border-accent-200 bg-accent-50/20">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-accent-600 uppercase tracking-wide">
                    Intelligent Matching Engine
                  </span>
                  <h3 className="text-sm font-bold text-ink mt-0.5">
                    Existing Seller Listings That Match Your Request
                  </h3>
                </div>
                <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-bold text-accent-600">
                  {matches.length} Matched
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {matches.map((item) => (
                  <Link
                    key={item.listingId}
                    href={`/products/${item.listingId}`}
                    className="rounded-xl border border-line bg-surface p-3 shadow-sm hover:shadow transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">
                          {item.matchScore}% Match
                        </span>
                        <span className="text-disabled capitalize">{item.city}</span>
                      </div>
                      <p className="mt-2 text-xs font-bold text-ink line-clamp-2">
                        {item.title}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-2">
                      <span className="text-xs font-bold text-ink">
                        {formatMoney(item.amountMinor, item.currency)}
                      </span>
                      <span className="text-[10px] font-semibold text-accent-600 hover:underline">
                        View Item →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar (1 col) */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-sm text-muted">Budget</h2>
            <p className="mt-1 text-[32px] leading-none font-bold text-ink">
              {formatMoney(request.budgetMinor, request.currency)}
            </p>
            <div className="mt-4 space-y-2 border-t pt-4 text-xs text-muted">
              <div className="flex justify-between">
                <span>Needed by</span>
                <span className="font-semibold text-ink">{request.urgency}</span>
              </div>
              <div className="flex justify-between">
                <span>Handover</span>
                <span className="font-semibold text-ink capitalize">{request.fulfillment}</span>
              </div>
              {request.deadline && (
                <div className="flex justify-between">
                  <span>Offers close</span>
                  <span className="font-semibold text-ink">
                    {new Date(request.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm text-muted">Buyer</h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">
                {request.buyer.displayName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-ink">{request.buyer.displayName}</p>
                {request.buyer.reviewsCount > 0 ? (
                  <Rating value={request.buyer.rating} count={request.buyer.reviewsCount} />
                ) : (
                  <p className="text-xs text-muted">No reviews yet</p>
                )}
              </div>
            </div>
            {request.buyer.verified && (
              <div className="mt-3">
                <VerifiedBadge text="Verified buyer" />
              </div>
            )}
          </Card>

          <Card className="border-primary-200 bg-primary-50/50 p-6 text-xs text-primary-900">
            <h2 className="font-semibold">What happens when an offer is accepted</h2>
            <p className="mt-2 leading-relaxed">
              The buyer and seller get a handover order with a code. Agree how you will pay, meet
              safely, and the buyer gives the code only after checking the item or service.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
