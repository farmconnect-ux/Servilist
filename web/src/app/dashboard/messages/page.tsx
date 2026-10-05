import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { listUserConversations } from "@/server/repositories/messaging";
import { MessagesClient } from "@/components/marketplace/MessagesClient";

export const metadata = {
  title: "Messages",
};

export default async function DashboardMessagesPage() {
  const user = await requireUser("/dashboard/messages");
  const db = await createDb();
  const convos = await listUserConversations(db, user.userId);

  return (
    <>
      <div>
        <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[32px]">Messages</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Conversations with buyers and sellers, each tied to a listing or a request.
        </p>
      </div>

      <MessagesClient currentUserId={user.userId} conversations={convos} />
    </>
  );
}
