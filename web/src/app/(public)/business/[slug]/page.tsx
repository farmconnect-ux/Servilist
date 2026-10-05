import { notFound } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { getBusinessStorefrontAction } from "@/server/services/businesses";

export const dynamic = "force-dynamic";

export default async function BusinessStorefrontPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const storefront = await getBusinessStorefrontAction(slug);

  if (!storefront) {
    notFound();
  }

  const { business, listings } = storefront;

  const tierLabels: Record<string, { label: string; color: string }> = {
    unverified: { label: "Standard Merchant", color: "bg-surface-muted text-ink-soft" },
    tier_1_identity: { label: "Identity Verified", color: "bg-info-soft text-info" },
    tier_2_business_cac: { label: "CAC Verified Business", color: "bg-primary-100 text-primary-800" },
    tier_3_enterprise: { label: "Enterprise Verified", color: "bg-info-soft text-info" },
  };

  const tier = tierLabels[business.verifiedTier] || tierLabels.unverified;

  return (
    <div className="min-h-screen bg-surface-muted pb-16">
      {/* Banner */}
      <div className="relative h-48 w-full bg-ink md:h-64 overflow-hidden">
        {business.bannerUrl ? (
          <img
            src={business.bannerUrl}
            alt={business.businessName}
            className="h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-ink via-ink to-accent-600 opacity-90" />
        )}
      </div>

      {/* Profile Header Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 rounded-2xl border border-line bg-surface p-6 shadow-sm md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Logo */}
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-surface bg-ink text-3xl font-bold text-white shadow-md overflow-hidden">
                {business.logoUrl ? (
                  <img
                    src={business.logoUrl}
                    alt={business.businessName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  business.businessName.charAt(0)
                )}
              </div>

              {/* Details */}
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-ink">
                    {business.businessName}
                  </h1>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${tier.color}`}
                  >
                    ✓ {tier.label}
                  </span>
                </div>

                {business.tagline && (
                  <p className="mt-1 text-sm text-ink-soft font-medium">
                    {business.tagline}
                  </p>
                )}

                {business.registrationNumber && (
                  <p className="mt-1 text-xs text-muted font-mono">
                    CAC Reg: {business.registrationNumber}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted">
                  {business.supportEmail && (
                    <a
                      href={`mailto:${business.supportEmail}`}
                      className="hover:text-ink flex items-center gap-1"
                    >
                      {business.supportEmail}
                    </a>
                  )}
                  {business.supportPhone && (
                    <a
                      href={`tel:${business.supportPhone}`}
                      className="hover:text-ink flex items-center gap-1"
                    >
                      {business.supportPhone}
                    </a>
                  )}
                  {business.websiteUrl && (
                    <a
                      href={business.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      Visit Website                     </a>
                  )}
                </div>
              </div>
            </div>

            {/* Seller Reputation summary */}
            {business.owner && (
              <div className="rounded-xl bg-surface-muted p-4 text-center sm:text-right shrink-0">
                <div className="text-xs text-muted font-medium">Seller Rating</div>
                <div className="text-xl font-bold text-ink">
                  ★ {business.owner.rating ? business.owner.rating.toFixed(1) : "5.0"}
                </div>
                <div className="text-[11px] text-muted">
                  {business.owner.reviewsCount} verified reviews
                </div>
              </div>
            )}
          </div>

          {/* Description & Policies */}
          {(business.description || business.returnPolicy) && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-line pt-6 text-xs text-ink-soft">
              {business.description && (
                <div>
                  <h3 className="font-semibold text-ink mb-1">About Us</h3>
                  <p className="leading-relaxed">{business.description}</p>
                </div>
              )}
              {business.returnPolicy && (
                <div>
                  <h3 className="font-semibold text-ink mb-1">Return & Refund Policy</h3>
                  <p className="leading-relaxed">{business.returnPolicy}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Storefront Catalog Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <h2 className="text-xl font-bold text-ink">
              Storefront Catalog ({listings.length})
            </h2>
            <span className="text-xs text-muted font-medium">
              Verified Merchant Products
            </span>
          </div>

          {listings.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-line-strong p-12 text-center">
              <p className="text-sm text-muted">
                No active listings published in this storefront yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:shadow-md"
                >
                  <div className="aspect-square w-full bg-surface-muted overflow-hidden">
                    <img
                      src={
                        item.image_url ||
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <span className="text-[10px] font-semibold text-disabled uppercase tracking-wide">
                      {item.category}
                    </span>
                    <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-ink group-hover:text-accent-600">
                      {item.title}
                    </h3>
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                      <span className="text-base font-bold text-ink">
                        {formatMoney(item.amount_minor, item.currency)}
                      </span>
                      <span className="text-[10px] font-medium text-muted capitalize">
                        {item.condition?.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
