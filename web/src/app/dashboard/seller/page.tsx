import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { listListingsBySeller } from "@/server/repositories/listings";
import { listOrdersForUser } from "@/server/repositories/orders";
import { getProfileById } from "@/server/repositories/sellerProfiles";
import { SellerDashboardClient } from "@/components/marketplace/SellerDashboardClient";

export const metadata = {
  title: "Seller Hub & Merchant Dashboard · Servilist",
};

export default async function SellerDashboardPage() {
  const user = await requireUser("/dashboard/seller");
  const db = await createDb();

  const [profile, listings, orders] = await Promise.all([
    getProfileById(db, user.userId),
    listListingsBySeller(db, user.userId),
    listOrdersForUser(db, user.userId, "seller"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-ink">Seller & Merchant Hub</h1>
        <p className="text-xs text-muted">
          Pan-African storefront analytics, catalog management, order fulfillment, and verified KYC credentials.
        </p>
      </div>

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
