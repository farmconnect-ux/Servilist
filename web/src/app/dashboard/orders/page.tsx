import Link from "next/link";
import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { listOrdersForUser } from "@/server/repositories/orders";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Orders",
};

interface OrdersPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function DashboardOrdersPage({ searchParams }: OrdersPageProps) {
  const { tab } = await searchParams;
  const currentTab = tab === "sales" ? "seller" : "buyer";

  const user = await requireUser("/dashboard/orders");
  const db = await createDb();
  const orders = await listOrdersForUser(db, user.userId, currentTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[32px]">Orders</h1>
          <p className="text-xs text-muted">
            Pay for purchases, track handover and confirm completion with the handover code.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b text-sm font-semibold">
        <Link
          href="/dashboard/orders?tab=purchases"
          className={`border-b-2 px-4 py-2 transition ${
            currentTab === "buyer"
              ? "border-brand text-brand"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Purchases
        </Link>
        <Link
          href="/dashboard/orders?tab=sales"
          className={`border-b-2 px-4 py-2 transition ${
            currentTab === "seller"
              ? "border-brand text-brand"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Sales
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-semibold text-ink">
            No {currentTab === "buyer" ? "purchases" : "sales"} yet
          </p>
          <p className="mt-1 text-xs text-muted">
            {currentTab === "buyer"
              ? "When you buy something, the order appears here."
              : "When a buyer orders one of your listings, it appears here."}
          </p>
          <Link href={currentTab === "buyer" ? "/search" : "/sell"} className="mt-4 inline-block">
            <Button className="min-h-11 px-3 text-xs">
              {currentTab === "buyer" ? "Start shopping" : "Sell something"}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const partner = currentTab === "buyer" ? o.seller : o.buyer;

            return (
              <Card key={o.id} className="p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted">
                        {o.orderNumber}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          o.status === "completed"
                            ? "bg-primary-100 text-primary-800"
                            : o.status === "in_escrow"
                            ? "bg-info-soft text-info"
                            : o.status === "disputed"
                            ? "bg-danger-soft text-danger"
                            : "bg-accent-100 text-accent-600"
                        }`}
                      >
                        {o.status === "in_escrow" ? "PAID, AWAITING HANDOVER" : o.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-bold text-ink">
                      <Link href={`/dashboard/orders/${o.id}`} className="hover:text-brand">
                        {o.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-muted">
                      {currentTab === "buyer" ? "Seller: " : "Buyer: "}
                      <span className="font-medium text-ink">{partner?.displayName || "User"}</span> ·{" "}
                      {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-ink">
                        {formatMoney(o.totalMinor, o.currency)}
                      </p>
                      <p className="text-[10px] text-muted capitalize">
                        {o.fulfillmentType}
                      </p>
                    </div>

                    <Link href={`/dashboard/orders/${o.id}`}>
                      <Button variant="outline" className="min-h-11 px-3 text-xs">
                        View order
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
