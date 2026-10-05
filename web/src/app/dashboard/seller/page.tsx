import Link from "next/link";
import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { listListingsBySeller } from "@/server/repositories/listings";
import { listOrdersForUser } from "@/server/repositories/orders";
import { getProfileById } from "@/server/repositories/sellerProfiles";
import { findMatchingRequestsForSeller, MATCH_REASON_LABELS } from "@/server/repositories/matching";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { SellerDashboardClient } from "@/components/marketplace/SellerDashboardClient";

export const metadata = {
  title: "Seller Hub & Merchant Dashboard · Servilist",
};

export default async function SellerDashboardPage() {
  const user = await requireUser("/dashboard/seller");
  const db = await createDb();

  const [profile, listings, orders, matchingRequests] = await Promise.all([
    getProfileById(db, user.userId),
    listListingsBySeller(db, user.userId),
    listOrdersForUser(db, user.userId, "seller"),
    findMatchingRequestsForSeller(db, 4),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Seller & Merchant Hub</h1>
        <p className="text-xs text-muted">
          Pan-African storefront analytics, catalog management, order fulfillment, and verified KYC credentials.
        </p>
      </div>

      {/* Recommended Buyer Demands Matching Inventory */}
      {matchingRequests.length > 0 && (
        <Card className="p-6 border-accent-200 bg-accent-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-accent-600 uppercase tracking-wide">
                Matching Demand Signals
              </span>
              <h3 className="text-sm font-bold text-ink mt-0.5">
                Open Buyer Requests Matching Your Inventory
              </h3>
              <p className="text-xs text-muted">
                Buyers in your product categories are actively looking to purchase. Quote directly to win orders.
              </p>
            </div>
            <Link href="/requests" className="text-xs font-semibold text-accent-600 hover:underline shrink-0">
              Browse All Requests →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {matchingRequests.map((req) => (
              <div
                key={req.requestId}
                className="rounded-xl border border-line bg-surface p-3 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">
                      {req.reasons.map((reason) => MATCH_REASON_LABELS[reason]).join(", ")}
                    </span>
                    <span className="text-disabled capitalize">{req.city}</span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-ink line-clamp-2">{req.title}</p>
                  <div className="mt-2 text-[11px] text-muted">
                    Budget:{" "}
                    <span className="font-bold text-ink">
                      {req.budgetMinor ? formatMoney(req.budgetMinor, req.currency) : "Negotiable"}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/requests/${req.requestId}`}
                  className="mt-3 block text-center rounded-lg bg-ink py-1.5 text-xs font-semibold text-white hover:bg-ink transition"
                >
                  Submit Quote →
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      <SellerDashboardClient
        sellerId={user.userId}
        sellerProfile={{
          displayName: profile?.displayName || user.displayName || "Merchant",
          verified: Boolean(profile?.verified),
          rating: profile?.ratingAverage || 5.0,
          reviewsCount: profile?.ratingCount || 0,
        }}
        listings={listings.map((l: any) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          amountMinor: l.amountMinor,
          currency: l.currency,
          status: l.status,
          createdAt: l.createdAt,
        }))}
        orders={orders.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          totalMinor: o.totalMinor,
          currency: o.currency,
          status: o.status,
          createdAt: o.createdAt,
          buyer: o.buyer ? { displayName: o.buyer.displayName } : undefined,
        }))}
      />
    </div>
  );
}
