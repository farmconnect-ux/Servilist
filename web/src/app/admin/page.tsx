import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, Metric } from "@/components/ui/card";
import { createDb } from "@/lib/db/server";
import { isReleased } from "@/lib/release";
import { requirePermission } from "@/server/auth/session";
import { can, type Permission } from "@/server/policies/access";
import { getPlatformOverview } from "@/server/repositories/accounts";

export const metadata = { title: "Admin overview" };

/**
 * Admin overview (docs/UI_UX_SPEC.md section 52). Figures are counted from the
 * database at the moment the page loads; there are no estimates or trends
 * until there is history to compute them from.
 */

const SECTIONS: { href: string; title: string; text: string; permission: Permission }[] = [
  {
    href: "/admin/users",
    title: "Members",
    text: "Roles, suspensions and restorations.",
    permission: "users.read",
  },
  {
    href: "/admin/reports",
    title: "Reports and disputes",
    text: "Flagged listings and reviews, and disputes on paid orders.",
    permission: "reports.manage",
  },
  {
    href: "/admin/vendors",
    title: "Seller verification",
    text: "Approve or reject verification requests.",
    permission: "verifications.manage",
  },
  {
    href: "/admin/audit-logs",
    title: "Audit log",
    text: "A permanent record of sensitive actions.",
    permission: "audit.read",
  },
];

async function countWhere(
  db: Awaited<ReturnType<typeof createDb>>,
  table: string,
  column: string,
  values: string[],
): Promise<number> {
  const { count } = await db.from(table).select("id", { count: "exact", head: true }).in(column, values);
  return count ?? 0;
}

export default async function AdminOverviewPage() {
  const user = await requirePermission("admin.access", "/admin");
  const db = await createDb();
  const showOrders = isReleased("/dashboard/orders") && can(user, "orders.read");
  const showReports = isReleased("/admin/reports") && can(user, "reports.manage");

  const [overview, openOrders, disputedOrders, openReports] = await Promise.all([
    getPlatformOverview(db),
    showOrders
      ? countWhere(db, "orders", "status", ["pending_payment", "in_escrow", "dispatched", "delivered"])
      : Promise.resolve(0),
    showOrders ? countWhere(db, "orders", "status", ["disputed"]) : Promise.resolve(0),
    showReports ? countWhere(db, "reports", "status", ["pending", "under_review"]) : Promise.resolve(0),
  ]);

  const sections = SECTIONS.filter(
    (section) => isReleased(section.href) && can(user, section.permission),
  );

  return (
    <>
      <div>
        <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[32px]">Overview</h1>
        <p className="mt-1 text-sm text-ink-soft">Counted from the database just now.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Members" value={String(overview.members)} />
        <Metric label="Active listings" value={String(overview.activeListings)} />
        <Metric label="Open requests" value={String(overview.openRequests)} />
        <Metric label="Suspended members" value={String(overview.suspended)} />
        {showOrders ? <Metric label="Open orders" value={String(openOrders)} /> : null}
        {showOrders ? <Metric label="Disputed orders" value={String(disputedOrders)} /> : null}
        {showReports ? <Metric label="Reports waiting" value={String(openReports)} /> : null}
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {sections.map((section) => (
          <li key={section.href}>
            <Link href={section.href} className="group block h-full">
              <Card className="flex h-full items-center justify-between gap-4 p-4 transition-colors duration-200 group-hover:border-primary-600">
                <div>
                  <h2 className="text-base font-semibold text-ink">{section.title}</h2>
                  <p className="text-sm text-ink-soft">{section.text}</p>
                </div>
                <ArrowRight className="size-5 shrink-0 text-primary-700" aria-hidden="true" />
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
