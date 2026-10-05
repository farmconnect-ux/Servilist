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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
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
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                {request.category.toUpperCase()}
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {request.requestType.replace("_", " ").toUpperCase()}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  request.status === "open"
                    ? "bg-emerald-50 text-emerald-700"
                    : request.status === "matched"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {request.status.toUpperCase()}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">
              {request.title}
            </h1>
            <p className="mt-1 text-xs text-muted">
              Posted {new Date(request.createdAt).toLocaleDateString()} · {request.city},{" "}
              {request.country}
            </p>
          </div>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
              Request Details & Specifications
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
          />

          {/* Listings that match this request (opens with Sprint 9 matching) */}
          {matches.length > 0 && (
            <Card className="p-6 border-amber-200 bg-amber-50/20">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Intelligent Matching Engine
                  </span>
                  <h3 className="text-sm font-bold text-stone-900 mt-0.5">
                    Existing Seller Listings That Match Your Request
                  </h3>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                  {matches.length} Matched
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {matches.map((item) => (
                  <Link
                    key={item.listingId}
                    href={`/products/${item.listingId}`}
                    className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm hover:shadow transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {item.matchScore}% Match
                        </span>
                        <span className="text-stone-400 capitalize">{item.city}</span>
                      </div>
                      <p className="mt-2 text-xs font-bold text-stone-900 line-clamp-2">
                        {item.title}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-2">
                      <span className="text-xs font-bold text-stone-900">
                        {formatMoney(item.amountMinor, item.currency)}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700 hover:underline">
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
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Buyer Budget</h3>
            <p className="mt-2 text-3xl font-extrabold text-brand">
              {formatMoney(request.budgetMinor, request.currency)}
            </p>
            <div className="mt-4 space-y-2 border-t pt-4 text-xs text-muted">
              <div className="flex justify-between">
                <span>Urgency</span>
                <span className="font-semibold text-ink">{request.urgency}</span>
              </div>
              <div className="flex justify-between">
                <span>Fulfillment</span>
                <span className="font-semibold text-ink capitalize">{request.fulfillment}</span>
              </div>
              {request.deadline && (
                <div className="flex justify-between">
                  <span>Quotes Close</span>
                  <span className="font-semibold text-ink">
                    {new Date(request.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Requested By</h3>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">
                {request.buyer.displayName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-ink">{request.buyer.displayName}</p>
                <p className="text-xs text-muted">
                  ★ {request.buyer.rating.toFixed(1)} ({request.buyer.reviewsCount} reviews)
                </p>
              </div>
            </div>
            {request.buyer.verified && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <span>✓ Identity & Phone Verified</span>
              </div>
            )}
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/50 p-6 text-xs text-emerald-900">
            <h4 className="font-bold">🛡️ Protected by Servilist Escrow</h4>
            <p className="mt-2 leading-relaxed">
              When a quote is accepted, buyer funds are secured in licensed third-party escrow. The vendor is paid upon buyer confirmation and verification OTP release.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
