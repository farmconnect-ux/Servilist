import Link from "next/link";
import { ArrowRight, ClipboardList, type LucideIcon, ShoppingBag, Store, Wrench } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, EmptyState, Metric, type BadgeTone } from "@/components/ui/card";
import { createDb } from "@/lib/db/server";
import { formatMoney } from "@/lib/money";
import { isReleased } from "@/lib/release";
import { requireUser } from "@/server/auth/session";
import { getMemberActivity } from "@/server/repositories/accounts";
import { listOffersForUser } from "@/server/repositories/offers";
import { listOrdersForUser, type OrderStatus } from "@/server/repositories/orders";
import { listBuyerRequests } from "@/server/repositories/requests";

export const metadata = { title: "Dashboard" };

/** Dashboard home (docs/UI_UX_SPEC.md section 42). Every figure is read from the database. */

const QUICK_ACTIONS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/search", label: "Buy", icon: ShoppingBag },
  { href: "/sell", label: "Sell", icon: Store },
  { href: "/requests/new", label: "Request", icon: ClipboardList },
  { href: "/services", label: "Find a service", icon: Wrench },
];

const ORDER_STATUS: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  pending_payment: { label: "Awaiting payment", tone: "warning" },
  in_escrow: { label: "Paid", tone: "brand" },
  dispatched: { label: "Dispatched", tone: "info" },
  delivered: { label: "Delivered", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  disputed: { label: "Under review", tone: "danger" },
  refunded: { label: "Refunded", tone: "neutral" },
};

function greeting(): string {
  // Lagos time, so the greeting matches most members' day
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Lagos" }).format(
      new Date(),
    ),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function SectionHeader({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <Link
        href={href}
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary-700 hover:underline"
      >
        {label}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const db = await createDb();
  const ordersOpen = isReleased("/dashboard/orders");
  const requestsOpen = isReleased("/dashboard/requests");
  const offersOpen = isReleased("/dashboard/offers");

  const [activity, orders, requests, offers] = await Promise.all([
    getMemberActivity(db, user.userId),
    ordersOpen ? listOrdersForUser(db, user.userId, "all") : Promise.resolve([]),
    requestsOpen
      ? listBuyerRequests(db, { buyerId: user.userId, limit: 5 })
      : Promise.resolve({ requests: [], total: 0 }),
    offersOpen ? listOffersForUser(db, user.userId) : Promise.resolve([]),
  ]);

  const openOrders = orders.filter((order) =>
    ["pending_payment", "in_escrow", "dispatched", "delivered", "disputed"].includes(order.status),
  );
  const pendingOffers = offers.filter(
    (offer) => offer.status === "pending" && offer.proposerId !== user.userId,
  );
  const quickActions = QUICK_ACTIONS.filter((action) => isReleased(action.href));

  return (
    <>
      <div>
        <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[32px]">
          {greeting()}, {user.displayName}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">Everything you buy, sell and request, in one place.</p>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickActions.map((action) => (
          <li key={action.href}>
            <Link href={action.href} className="group block">
              <Card className="flex min-h-14 items-center gap-3 p-4 transition-colors duration-200 group-hover:border-primary-600">
                <action.icon className="size-5 text-primary-700" aria-hidden="true" />
                <span className="text-sm font-semibold text-ink">{action.label}</span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Open orders" value={String(openOrders.length)} />
        <Metric label="My requests" value={String(requests.total)} />
        <Metric
          label="Offers to answer"
          value={String(pendingOffers.length)}
          note={pendingOffers.length > 0 ? "Waiting for your response" : undefined}
        />
        <Metric label="Messages" value={String(activity.conversations)} note="Sent and received" />
      </div>

      {pendingOffers.length > 0 ? (
        <Card className="flex flex-col gap-3 border-accent-200 bg-accent-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-ink">
            {pendingOffers.length === 1
              ? "1 offer is waiting for your response."
              : `${pendingOffers.length} offers are waiting for your response.`}
          </p>
          <ButtonLink href="/dashboard/offers" size="sm">
            Review offers
          </ButtonLink>
        </Card>
      ) : null}

      {ordersOpen ? (
        <section className="flex flex-col gap-3">
          <SectionHeader title="Recent orders" href="/dashboard/orders" label="All orders" />
          {orders.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {orders.slice(0, 5).map((order) => {
                const status = ORDER_STATUS[order.status];
                return (
                  <li key={order.id}>
                    <Link href={`/dashboard/orders/${order.id}`} className="group block">
                      <Card className="flex flex-col gap-2 p-4 transition-colors duration-200 group-hover:border-line-strong sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-base font-medium text-ink">{order.title}</p>
                          <p className="text-xs text-muted">
                            {order.orderNumber} · {order.buyerId === user.userId ? "Buying" : "Selling"} ·{" "}
                            {new Date(order.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge tone={status.tone}>{status.label}</Badge>
                          <span className="text-base font-bold text-ink">
                            {formatMoney(order.totalMinor, order.currency)}
                          </span>
                        </div>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No orders yet" action={<ButtonLink href="/search">Start shopping</ButtonLink>}>
              When you buy or sell something, the order appears here.
            </EmptyState>
          )}
        </section>
      ) : null}

      {requestsOpen ? (
        <section className="flex flex-col gap-3">
          <SectionHeader title="My requests" href="/dashboard/requests" label="All requests" />
          {requests.requests.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {requests.requests.map((request) => (
                <li key={request.id}>
                  <Link href={`/requests/${request.id}`} className="group block">
                    <Card className="flex flex-col gap-2 p-4 transition-colors duration-200 group-hover:border-line-strong sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-base font-medium text-ink">{request.title}</p>
                        <p className="text-xs text-muted">
                          {request.city} ·{" "}
                          {request.quotesCount === 1 ? "1 response" : `${request.quotesCount} responses`}
                        </p>
                      </div>
                      <span className="text-base font-bold text-ink">
                        {formatMoney(request.budgetMinor, request.currency)}
                      </span>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No requests yet"
              action={<ButtonLink href="/requests/new">Post a request</ButtonLink>}
            >
              Tell sellers what you&apos;re looking for and let them come to you.
            </EmptyState>
          )}
        </section>
      ) : null}
    </>
  );
}
