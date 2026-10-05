import type { Metadata } from "next";
import { Badge, Card } from "@/components/ui/card";
import { ProfileForm } from "@/features/auth/forms";
import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { getOwnProfile } from "@/server/repositories/accounts";

export const metadata: Metadata = { title: "Profile and settings" };

export default async function SettingsPage() {
  const user = await requireUser("/dashboard/settings");
  const db = await createDb();
  const profile = await getOwnProfile(db, user.userId);

  return (
    <>
      <h1 className="text-2xl font-bold text-ink">Profile and settings</h1>

      <Card className="flex flex-col gap-4 p-6">
        <h2 className="text-lg font-bold text-ink">Your profile</h2>
        <ProfileForm
          profile={{
            displayName: profile?.displayName ?? user.displayName,
            city: profile?.city ?? "",
            country: profile?.country ?? "",
            bio: profile?.bio ?? "",
          }}
        />
      </Card>

      <Card className="flex flex-col gap-3 p-6">
        <h2 className="text-lg font-bold text-ink">Your account</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-[160px_1fr]">
          <dt className="font-semibold text-muted">Email</dt>
          <dd className="break-all text-ink">{user.email ?? "Not set"}</dd>
          <dt className="font-semibold text-muted">Account status</dt>
          <dd>
            <Badge tone={user.status === "active" ? "success" : "danger"}>{user.status}</Badge>
          </dd>
          <dt className="font-semibold text-muted">Roles</dt>
          <dd className="flex flex-wrap gap-1.5">
            {user.roles.length ? (
              user.roles.map((role) => (
                <Badge key={role} tone="brand">
                  {role.replace(/_/g, " ").toLowerCase()}
                </Badge>
              ))
            ) : (
              <span className="text-muted">Member</span>
            )}
          </dd>
        </dl>
      </Card>
    </>
  );
}
