import Link from "next/link";
import { Metric, Card, Badge, EmptyState } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { getMemberActivity } from "@/server/repositories/accounts";
import { listOrdersForUser } from "@/server/repositories/orders";
import { listBuyerRequests } from "@/server/repositories/requests";
import { formatMoney } from "@/lib/money";

export const metadata = {
  title: "Buyer Dashboard · Servilist",
  description: "Track your orders, shipments, delivery OTPs, purchase receipts, and buyer requests.",
};

export default async function BuyerDashboardPage() {
  const user = await requireUser("/dashboard");
  const db = await createDb();

  const [activity, buyerOrders, requestsRes] = await Promise.all([
    getMemberActivity(db, user.userId),
    listOrdersForUser(db, user.userId, "buyer"),
    listBuyerRequests(db, { buyerId: user.userId, limit: 5 }),
  ]);

  const activeOrders = buyerOrders.filter((o) =>
    ["pending_payment", "in_escrow", "dispatched", "delivered"].includes(o.status)
  );
  const completedOrders = buyerOrders.filter((o) =>
    ["completed", "refunded", "cancelled"].includes(o.status)
  );

  const totalEscrowProtected = activeOrders
    .filter((o) => ["in_escrow", "dispatched"].includes(o.status))
    .reduce((sum, o) => sum + o.totalMinor, 0);

  return (
    <div className="space-y-8">
      {/* Header with Role Separation Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
            🛒 Buyer Workspace
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight sm:text-3xl mt-1">
            Welcome back, {user.displayName}
          </h1>
          <p className="text-xs text-zinc-500">
            Track your order deliveries, escrow protections, seller messages, and reverse marketplace demands.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ButtonLink href="/dashboard/seller" variant="outline" size="sm">
            💰 Switch to Seller Hub
          </ButtonLink>
          <ButtonLink href="/requests/new" variant="primary" size="sm">
            📢 Post New Request
          </ButtonLink>
        </div>
      </div>

      {/* 1. Buyer Metric Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Active Purchases"
          value={String(activeOrders.length)}
          note="Orders in transit or escrow"
          tone="positive"
        />
        <Metric
          label="Escrow Protected"
          value={formatMoney(totalEscrowProtected, "NGN")}
          note="Safe until OTP confirmation"
          tone="positive"
        />
        <Metric
          label="My Open Requests"
          value={String(requestsRes.total || activity.requests)}
          note="Awaiting merchant quotes"
        />
        <Metric
          label="Unread Messages"
          value={String(activity.conversations)}
          note="Direct seller chats"
        />
      </div>

      {/* 2. Order Tracking & Active Shipments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Active Order Tracking & Escrow</h2>
            <p className="text-xs text-zinc-500">
              Only release your 6-digit delivery OTP after verifying items upon handover
            </p>
          </div>
          <Link href="/dashboard/orders" className="text-xs font-semibold text-emerald-700 hover:underline">
            View All Orders →
          </Link>
        </div>

        {activeOrders.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {activeOrders.map((order) => (
              <Card key={order.id} className="p-5 flex flex-col justify-between border-l-4 border-l-emerald-600 bg-white">
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                    <span className="font-mono font-bold text-zinc-900">{order.orderNumber}</span>
                    <Badge
                      tone={
                        order.status === "in_escrow"
                          ? "success"
                          : order.status === "dispatched"
                          ? "info"
                          : "warning"
                      }
                      pill
                    >
                      {order.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900">{order.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Seller: <span className="font-medium text-zinc-700">{order.seller?.displayName || "Merchant"}</span>
                  </p>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Total Paid:</span>
                    <span className="font-black text-emerald-700">
                      {formatMoney(order.totalMinor, order.currency)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">
                    {order.fulfillmentType === "delivery" ? "🚚 Courier Dispatch" : "🤝 In-Person Pickup"}
                  </span>
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition"
                  >
                    View OTP & Tracking →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No active shipments in transit"
            action={
              <ButtonLink href="/#listings" variant="primary" size="sm">
                Explore Marketplace Products
              </ButtonLink>
            }
          >
            You have no pending deliveries. Browse listings or post a custom buyer request.
          </EmptyState>
        )}
      </section>

      {/* 3. My Open Demands & Quotes Received */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">My Buyer Demands (Reverse Marketplace)</h2>
            <p className="text-xs text-zinc-500">
              Requests you have posted for products or services. Review incoming seller quotes.
            </p>
          </div>
          <Link href="/dashboard/requests" className="text-xs font-semibold text-emerald-700 hover:underline">
            Manage All Requests →
          </Link>
        </div>

        {requestsRes.requests && requestsRes.requests.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {requestsRes.requests.map((req) => (
              <Card key={req.id} className="p-4 bg-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {req.requestType.toUpperCase()}
                    </span>
                    <span className="text-zinc-400 capitalize">{req.city}</span>
                  </div>
                  <h3 className="text-xs font-bold text-zinc-900 line-clamp-2 mt-1">{req.title}</h3>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Target Budget</span>
                    <span className="font-bold text-zinc-900">
                      {req.budgetMinor > 0
                        ? formatMoney(req.budgetMinor, req.currency)
                        : "Negotiable"}
                    </span>
                  </div>
                  <Link
                    href={`/requests/${req.id}`}
                    className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:border-emerald-600 hover:text-emerald-700"
                  >
                    View Quotes
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center bg-zinc-50 border-dashed border-2 border-zinc-200">
            <p className="text-sm font-bold text-zinc-800">Can&apos;t find what you are looking for?</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              Post a request with your budget and specifications. Verified merchants will submit direct quotes to you.
            </p>
            <div className="mt-3">
              <ButtonLink href="/requests/new" variant="primary" size="sm">
                + Post What You Need
              </ButtonLink>
            </div>
          </Card>
        )}
      </section>

      {/* 4. Purchase History & Receipts Summary */}
      {completedOrders.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Purchase History & Receipts</h2>
              <p className="text-xs text-zinc-500">Past completed transactions and downloadable receipts</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 uppercase font-bold tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Item / Service</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {completedOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono font-semibold">{order.orderNumber}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900 truncate max-w-[200px]">{order.title}</td>
                    <td className="px-4 py-3 text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-bold">{formatMoney(order.totalMinor, order.currency)}</td>
                    <td className="px-4 py-3">
                      <Badge tone="success" pill>COMPLETED</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/orders/${order.id}`} className="font-semibold text-emerald-700 hover:underline">
                        Receipt →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
