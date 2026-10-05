import { Metric, Card } from "@/components/ui/card";
import { createDb } from "@/lib/db/server";
import { requirePermission } from "@/server/auth/session";
import { getPlatformOverviewStats } from "@/server/repositories/moderation";
import { formatMoney } from "@/lib/money";

export default async function AdminOverviewPage() {
  await requirePermission("admin.access", "/admin");
  const db = await createDb();
  const stats = await getPlatformOverviewStats(db);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Platform Overview & Analytics</h1>
        <p className="text-sm text-muted">
          Real-time Gross Merchandise Value (GMV), active escrow volume, user growth, and moderation queues.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Total Settled GMV"
          value={formatMoney(stats.totalGmvMinor, "NGN")}
        />
        <Metric
          label="Active Orders in Escrow"
          value={String(stats.activeOrders)}
        />
        <Metric
          label="Registered Members"
          value={String(stats.totalUsers)}
        />
        <Metric
          label="Active Listings"
          value={String(stats.totalListings)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-bold text-ink">Content Moderation Queue</h3>
          <p className="mt-1 text-xs text-muted">
            Reports filed by buyers or sellers for listings, profiles, or messages.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-black text-ink">{stats.pendingReports}</span>
            <span className="text-xs font-semibold text-amber-600">Pending Review</span>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-ink">Vendor KYC Verification Queue</h3>
          <p className="mt-1 text-xs text-muted">
            Business registration and tax documentation pending staff verification.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-black text-ink">{stats.pendingVerifications}</span>
            <span className="text-xs font-semibold text-brand">Awaiting Approval</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
