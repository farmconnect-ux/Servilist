import { BusinessForm } from "@/components/marketplace/BusinessForm";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/form";
import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";
import { getBusinessByOwnerId } from "@/server/repositories/businesses";

export const metadata = { title: "Business page" };

/** Create or edit the member's public business page. */
export default async function DashboardBusinessPage() {
  const user = await requireUser("/dashboard/business");
  const business = await getBusinessByOwnerId(await createDb(), user.userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold text-ink">Business page</h1>
        <p className="mt-1 text-sm text-ink-soft">
          A public page for your shop or company: who you are, how to reach you, your return policy
          and your listings.
        </p>
      </div>

      {business && !business.isActive ? (
        <Alert tone="danger">
          Your business page has been suspended and is hidden from buyers. Contact support to have it
          reviewed.
        </Alert>
      ) : null}

      {canParticipate(user) && (!business || business.isActive) ? (
        <Card className="p-4 sm:p-6">
          <BusinessForm
            slug={business?.slug ?? null}
            initial={{
              businessName: business?.businessName ?? "",
              tagline: business?.tagline ?? "",
              description: business?.description ?? "",
              logoUrl: business?.logoUrl ?? "",
              bannerUrl: business?.bannerUrl ?? "",
              supportEmail: business?.supportEmail ?? "",
              supportPhone: business?.supportPhone ?? "",
              websiteUrl: business?.websiteUrl ?? "",
              returnPolicy: business?.returnPolicy ?? "",
              openingHours: business?.openingHours ?? "",
              registrationNumber: business?.registrationNumber ?? "",
            }}
          />
        </Card>
      ) : null}
    </div>
  );
}
