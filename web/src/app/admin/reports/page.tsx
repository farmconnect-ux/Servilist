import { createDb } from "@/lib/db/server";
import { requirePermission } from "@/server/auth/session";
import { listReports } from "@/server/repositories/moderation";
import { ReportsModerationClient } from "@/components/admin/ReportsModerationClient";

export const metadata = {
  title: "Reports & Content Moderation · Servilist Admin",
};

export default async function AdminReportsPage() {
  await requirePermission("reports.manage", "/admin/reports");
  const db = await createDb();
  const reports = await listReports(db);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Reports and disputes</h1>
        <p className="text-sm text-muted">
          Reports from members, and disputes on paid orders. A dispute is closed by releasing the
          order to the seller or refunding the buyer.
        </p>
      </div>

      <ReportsModerationClient initialReports={reports} />
    </div>
  );
}
