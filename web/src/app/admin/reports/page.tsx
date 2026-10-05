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
        <h1 className="text-2xl font-bold text-ink">Reports & Content Moderation Queue</h1>
        <p className="text-sm text-muted">
          Review flagged product listings, counterfeit claims, offensive reviews, and trade disputes
          across the marketplace.
        </p>
      </div>

      <ReportsModerationClient initialReports={reports} />
    </div>
  );
}
