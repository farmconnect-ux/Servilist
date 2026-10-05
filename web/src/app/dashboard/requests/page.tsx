import Link from "next/link";
import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "My Requests & Quotes · Servilist Dashboard",
};

export default async function DashboardRequestsPage() {
  const user = await requireUser("/dashboard/requests");
  const db = await createDb();

  // Load user's buyer requests
  const { data: userRequests, error } = await db
    .from("buyer_requests")
    .select(`
      *,
      quotes(id, status, amount_minor, currency, provider_id)
    `)
    .eq("buyer_id", user.userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load requests: ${error.message}`);
  }

  const requests = userRequests || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-ink">My Buyer Requests</h2>
          <p className="text-xs text-muted">
            Manage your requests and review vendor quotes.
          </p>
        </div>
        <Link href="/requests/new">
          <Button className="min-h-9 px-3 text-xs">+ New Request</Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-semibold text-ink">You haven’t posted any buyer requests yet.</p>
          <p className="mt-1 text-xs text-muted">
            Post what you are searching for, and verified sellers will submit proposals directly to you.
          </p>
          <Link href="/requests/new" className="mt-4 inline-block">
            <Button className="min-h-9 px-3 text-xs">Post Your First Request</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => {
            const quotes = req.quotes || [];
            const pendingQuotes = quotes.filter((q: any) => q.status === "pending").length;
            const acceptedQuote = quotes.find((q: any) => q.status === "accepted");

            return (
              <Card key={req.id} className="p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                        {req.category}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          req.status === "open"
                            ? "bg-emerald-100 text-emerald-800"
                            : req.status === "accepted"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-bold text-ink">
                      <Link href={`/requests/${req.id}`} className="hover:text-brand">
                        {req.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-muted">
                      Budget:{" "}
                      <span className="font-semibold text-ink">
                        {formatMoney(Number(req.budget_amount_minor || 0), req.currency)}
                      </span>{" "}
                      · Posted {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs">
                      <p className="font-semibold text-ink">
                        {quotes.length} Quote{quotes.length === 1 ? "" : "s"}
                      </p>
                      {pendingQuotes > 0 && (
                        <p className="text-amber-600 font-medium">
                          {pendingQuotes} awaiting review
                        </p>
                      )}
                      {acceptedQuote && (
                        <p className="text-emerald-600 font-medium">Quote accepted</p>
                      )}
                    </div>

                    <Link href={`/requests/${req.id}`}>
                      <Button variant="outline" className="min-h-9 px-3 text-xs">
                        View & Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
