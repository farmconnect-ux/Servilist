import { Metric } from "@/components/ui/card";
import { Alert } from "@/components/ui/form";
import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { getMemberActivity } from "@/server/repositories/accounts";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const db = await createDb();
  const activity = await getMemberActivity(db, user.userId);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-ink">Welcome back, {user.displayName}</h1>
        <p className="text-sm text-muted">Everything you buy, sell and request, in one place.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="My active listings" value={String(activity.listings)} />
        <Metric label="My open requests" value={String(activity.requests)} />
        <Metric label="My orders" value={String(activity.orders)} note="Buying and selling" />
        <Metric label="Messages" value={String(activity.conversations)} note="Sent and received" />
      </div>

      <Alert>
        You can list items, post requests, send quotes, make offers, message other members and
        place orders here. Online payment switches on once a payment provider is connected.
      </Alert>
    </>
  );
}
