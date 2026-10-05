import type { Metadata } from "next";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { setMemberStatusAction } from "@/features/auth/actions";
import { createDb } from "@/lib/db/server";
import { requirePermission } from "@/server/auth/session";
import { can } from "@/server/policies/access";
import { listMembers } from "@/server/repositories/accounts";

export const metadata: Metadata = { title: "Members" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

export default async function AdminUsersPage() {
  const admin = await requirePermission("users.read", "/admin/users");
  const canManage = can(admin, "users.manage");
  const db = await createDb();
  const members = await listMembers(db);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-ink">Members</h1>
        <p className="text-sm text-muted">
          Every status change is recorded in the audit log with who made it.
        </p>
      </div>

      {members.length === 0 ? (
        <EmptyState title="No members yet" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-page text-[11px] font-bold tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Member
                </th>
                <th scope="col" className="px-4 py-3">
                  Roles
                </th>
                <th scope="col" className="px-4 py-3">
                  Joined
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                {canManage ? (
                  <th scope="col" className="px-4 py-3">
                    Action
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isSelf = member.id === admin.userId;
                const next = member.status === "active" ? "suspended" : "active";
                return (
                  <tr key={member.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <p className="font-bold text-ink">{member.displayName}</p>
                      <p className="text-xs text-muted">{member.city ?? "No city set"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {member.roles.map((role) => (
                          <Badge key={role} tone={role === "USER" ? "neutral" : "brand"}>
                            {role.replace(/_/g, " ").toLowerCase()}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {dateFormat.format(new Date(member.joinedAt))}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={member.status === "active" ? "success" : "danger"}>
                        {member.status}
                      </Badge>
                    </td>
                    {canManage ? (
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="text-xs text-muted">This is you</span>
                        ) : (
                          <form action={setMemberStatusAction}>
                            <input type="hidden" name="memberId" value={member.id} />
                            <input type="hidden" name="status" value={next} />
                            <button
                              type="submit"
                              className="min-h-11 rounded-control border border-line px-3 text-xs font-bold text-ink hover:border-brand"
                            >
                              {next === "suspended" ? "Suspend" : "Restore"}
                            </button>
                          </form>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
