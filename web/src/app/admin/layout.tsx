import type { Metadata } from "next";
import { Shell, SiteHeader, type NavItem } from "@/components/layout/site";
import { requirePermission } from "@/server/auth/session";
import { isReleased } from "@/lib/release";
import { can, type Permission } from "@/server/policies/access";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

// Each section names the permission that opens it; sections arrive sprint by sprint.
const SECTIONS: (NavItem & { permission: Permission })[] = [
  { href: "/admin", label: "Overview", permission: "admin.access" },
  { href: "/admin/users", label: "Members", permission: "users.read" },
  { href: "/admin/vendors", label: "Vendor Verification", permission: "verifications.manage" },
  { href: "/admin/reports", label: "Reports and disputes", permission: "reports.manage" },
  { href: "/admin/audit-logs", label: "Audit log", permission: "audit.read" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Checked on the server for every admin page; hiding links is not the protection
  const user = await requirePermission("admin.access", "/admin");
  const items = SECTIONS.filter(
    (section) => isReleased(section.href) && can(user, section.permission),
  );

  return (
    <>
      <SiteHeader />
      <Shell title="Administration" navLabel="Admin" items={items}>
        {children}
      </Shell>
    </>
  );
}
