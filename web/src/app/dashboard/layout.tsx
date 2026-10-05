import type { Metadata } from "next";
import { Shell, SiteFooter, SiteHeader } from "@/components/layout/site";
import { Alert } from "@/components/ui/form";
import { requireUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";

export const metadata: Metadata = { title: "Dashboard" };

// Sections are added here as each sprint delivers them, so no link leads nowhere.
const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/orders", label: "Orders & Escrow" },
  { href: "/dashboard/requests", label: "Requests & Quotes" },
  { href: "/dashboard/seller", label: "Seller Hub" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/settings", label: "Profile and settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");

  return (
    <>
      <SiteHeader />
      <Shell title="Your account" navLabel="Dashboard" items={NAV}>
        {canParticipate(user) ? null : (
          <Alert tone="danger">
            Your account is restricted. You can still view your activity, but you cannot post or
            trade.
          </Alert>
        )}
        {children}
      </Shell>
      <SiteFooter />
    </>
  );
}
