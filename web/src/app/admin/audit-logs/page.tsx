import type { Metadata } from "next";
import { Card, EmptyState } from "@/components/ui/card";
import { createDb } from "@/lib/db/server";
import { requirePermission } from "@/server/auth/session";
import { listAuditLog } from "@/server/repositories/accounts";

export const metadata: Metadata = { title: "Audit log" };

const timeFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function AuditLogPage() {
  await requirePermission("audit.read", "/admin/audit-logs");
  const db = await createDb();
  const entries = await listAuditLog(db);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-ink">Audit log</h1>
        <p className="text-sm text-muted">
          A permanent record of administrative actions. Entries cannot be edited or deleted.
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState title="No administrative actions yet">
          Suspending a member or changing a role will appear here.
        </EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-page text-[11px] font-bold tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">
                  When
                </th>
                <th scope="col" className="px-4 py-3">
                  Who
                </th>
                <th scope="col" className="px-4 py-3">
                  Action
                </th>
                <th scope="col" className="px-4 py-3">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-line align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-muted">
                    {timeFormat.format(new Date(entry.createdAt))}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{entry.actorName}</td>
                  <td className="px-4 py-3 text-ink">{entry.action}</td>
                  <td className="px-4 py-3 text-xs break-all text-muted">
                    {entry.entityType} {entry.entityId ?? ""} {JSON.stringify(entry.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
