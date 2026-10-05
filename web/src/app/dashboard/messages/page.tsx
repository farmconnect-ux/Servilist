import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { listUserConversations } from "@/server/repositories/messaging";
import { MessagesClient } from "@/components/marketplace/MessagesClient";

export const metadata = {
  title: "Messages & Inquiries · Servilist Dashboard",
};

export default async function DashboardMessagesPage() {
  const user = await requireUser("/dashboard/messages");
  const db = await createDb();
  const convos = await listUserConversations(db, user.userId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Messages & Inquiries</h2>
        <p className="text-xs text-muted">
          Direct communication regarding listings, buyer requests, offers, and orders.
        </p>
      </div>

      <MessagesClient currentUserId={user.userId} conversations={convos} />
    </div>
  );
}
