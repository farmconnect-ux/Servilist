import Link from "next/link";
import { notFound } from "next/navigation";
import { createDb } from "@/lib/db/server";
import { getServiceBySlug } from "@/server/repositories/services";
import { Card } from "@/components/ui/card";
import { ServiceBookingClient } from "@/components/marketplace/ServiceBookingClient";

interface ServiceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const db = await createDb();
  const service = await getServiceBySlug(db, slug);

  if (!service) {
    return { title: "Service Not Found · Servilist" };
  }

  return {
    title: `${service.title} · Hire on Servilist`,
    description: service.description.slice(0, 160),
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const db = await createDb();
  const service = await getServiceBySlug(db, slug);

  if (!service) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/" className="hover:text-brand">Home</Link> &gt;{" "}
        <Link href="/services" className="hover:text-brand">Services</Link> &gt;{" "}
        <span className="text-ink">{service.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Details (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand uppercase">
                {service.categorySlug}
              </span>
              <span className="rounded-full bg-info-soft px-2.5 py-0.5 text-xs font-semibold text-info capitalize">
                {service.deliveryType.replace("_", " ")}
              </span>
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 capitalize">
                {service.pricingModel.replace("_", " ")}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
              {service.title}
            </h1>
            <p className="mt-1 text-xs text-muted">
              Offered in {service.city ? `${service.city}, ` : ""}{service.country} · Listed{" "}
              {new Date(service.createdAt).toLocaleDateString()}
            </p>
          </div>

          <Card className="p-6">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">
              Service Description & Scope of Work
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
              {service.description}
            </p>
          </Card>

          {/* Provider Card */}
          <Card className="p-6">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">
              About the Service Provider
            </h2>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-xl font-bold text-brand">
                {service.provider?.displayName.charAt(0) || "P"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-ink text-base">
                    {service.provider?.displayName}
                  </h3>
                  {service.provider?.verified && (
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-800">
                      VERIFIED PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">
                  ★ {service.provider?.rating.toFixed(1)} ({service.provider?.reviewsCount} client reviews)
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Booking Column (1 col) */}
        <div className="space-y-6">
          <ServiceBookingClient
            serviceId={service.id}
            currency={service.currency}
            basePriceMinor={service.basePriceMinor}
            packages={service.packages}
            providerId={service.providerId}
          />
        </div>
      </div>
    </div>
  );
}
