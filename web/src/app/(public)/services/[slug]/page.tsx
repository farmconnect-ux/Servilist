import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, Wrench } from "lucide-react";
import { Rating } from "@/components/marketplace/cards";
import { ServiceBookingClient } from "@/components/marketplace/ServiceBookingClient";
import { Card, VerifiedBadge } from "@/components/ui/card";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";
import { getServiceBySlug } from "@/server/repositories/services";

/** Service page (docs/UI_UX_SPEC.md sections 27 and 77). */

const DELIVERY: Record<string, string> = {
  remote: "Done remotely",
  on_site_local: "At your location",
  hybrid: "Remote or at your location",
};

interface Package {
  name: string;
  priceMinor: number;
  timeline?: string;
  deliverables?: string | null;
}

/** Packages are stored as free-form JSON by the provider; keep only well-formed ones. */
function readPackages(value: unknown): Package[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const priceMinor = Number(row.priceMinor);
    if (typeof row.name !== "string" || !Number.isFinite(priceMinor) || priceMinor <= 0) return [];
    return [
      {
        name: row.name,
        priceMinor,
        timeline: typeof row.timeline === "string" ? row.timeline : undefined,
        deliverables: typeof row.deliverables === "string" ? row.deliverables : null,
      },
    ];
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(await createDb(), slug);
  if (!service) return { title: "Service not found" };
  return {
    title: service.title,
    description: service.description.slice(0, 160),
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await createDb();
  const [service, viewer] = await Promise.all([getServiceBySlug(db, slug), getSessionUser()]);
  if (!service) notFound();

  const place = [service.city, service.country].filter(Boolean).join(", ");
  const quoteOnly = service.pricingModel === "custom_quote" || service.basePriceMinor <= 0;
  const role = !viewer
    ? "guest"
    : viewer.userId === service.providerId
      ? "owner"
      : canParticipate(viewer)
        ? "member"
        : "restricted";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-5 md:py-8 lg:px-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <li>
            <Link href="/" className="hover:text-primary-700">
              Home
            </Link>
          </li>
          <ChevronRight className="size-4" aria-hidden="true" />
          <li>
            <Link href="/services" className="hover:text-primary-700">
              Services
            </Link>
          </li>
          <ChevronRight className="size-4" aria-hidden="true" />
          <li className="line-clamp-1 text-ink" aria-current="page">
            {service.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[40px]">{service.title}</h1>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
              {place ? (
                <li className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-muted" aria-hidden="true" />
                  {place}
                </li>
              ) : null}
              <li className="flex items-center gap-1.5">
                <Wrench className="size-4 text-muted" aria-hidden="true" />
                {DELIVERY[service.deliveryType] ?? service.deliveryType}
              </li>
            </ul>
          </div>

          <section aria-labelledby="about-service" className="flex flex-col gap-3">
            <h2 id="about-service" className="text-xl font-semibold text-ink md:text-2xl">
              About this service
            </h2>
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink-soft md:text-base">
              {service.description}
            </p>
          </section>

          <Card className="flex flex-col gap-3 p-4">
            <h2 className="text-sm font-semibold text-muted">Provider</h2>
            <div className="flex items-center gap-3">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-primary-50 text-base font-semibold text-primary-800"
                aria-hidden="true"
              >
                {(service.provider?.displayName ?? "P").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-base font-semibold text-ink">
                    {service.provider?.displayName ?? "Provider"}
                  </span>
                  {service.provider?.verified ? <VerifiedBadge /> : null}
                </p>
                {service.provider && service.provider.reviewsCount > 0 ? (
                  <Rating value={service.provider.rating} count={service.provider.reviewsCount} />
                ) : (
                  <p className="text-xs text-muted">No reviews yet</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-40 lg:self-start">
          <ServiceBookingClient
            serviceId={service.id}
            currency={service.currency}
            basePriceMinor={service.basePriceMinor}
            packages={readPackages(service.packages)}
            quoteOnly={quoteOnly}
            viewer={role}
            loginHref={`/login?next=${encodeURIComponent(`/services/${service.slug}`)}`}
          />
        </aside>
      </div>
    </main>
  );
}
