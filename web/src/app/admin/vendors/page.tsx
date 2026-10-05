import { createDb } from "@/lib/db/server";
import { requirePermission } from "@/server/auth/session";
import { listVerifications } from "@/server/repositories/moderation";
import { VendorVerificationClient } from "@/components/admin/VendorVerificationClient";

export const metadata = {
  title: "Vendor Verification & KYC · Servilist Admin",
};

export default async function AdminVendorsPage() {
  await requirePermission("verifications.manage", "/admin/vendors");
  const db = await createDb();
  const verifications = await listVerifications(db);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Vendor Verification & Compliance</h1>
        <p className="text-sm text-muted">
          Review business registration numbers, CAC/tax certificates, and approve official
          Pan-African merchant badges.
        </p>
      </div>

      <VendorVerificationClient initialVerifications={verifications} />
    </div>
  );
}
