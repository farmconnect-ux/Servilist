import { Metric } from "@/components/ui/card";
import { Alert } from "@/components/ui/form";
import { createDb } from "@/lib/db/server";
import { requirePermission } from "@/server/auth/session";
import { getPlatformOverview } from "@/server/repositories/accounts";

export default async function AdminOverviewPage() {
  await requirePermission("admin.access", "/admin");
  const db = await createDb();
  const overview = await getPlatformOverview(db);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-ink">Platform overview</h1>
        <p className="text-sm text-muted">Live figures from the database.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Registered members" value={String(overview.members)} />
        <Metric label="Suspended or banned" value={String(overview.suspended)} />
        <Metric label="Active listings" value={String(overview.activeListings)} />
        <Metric label="Open requests" value={String(overview.openRequests)} />
      </div>

      <Alert>
        Orders, payments, payouts, disputes and reports appear here as their sprints are delivered.
        Nothing on this page is sample data.
      </Alert>
    </>
  );
}
