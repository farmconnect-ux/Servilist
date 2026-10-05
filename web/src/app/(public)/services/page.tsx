import Link from "next/link";
import { createDb } from "@/lib/db/server";
import { listServices } from "@/server/repositories/services";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Professional Services & Freelancers · Servilist Africa",
  description: "Hire verified service providers, technicians, engineers, and digital specialists across Africa with escrow protection.",
};

interface ServicesPageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    page?: string;
  }>;
}

export default async function ServicesDirectoryPage({ searchParams }: ServicesPageProps) {
  const { q, city, page } = await searchParams;
  const db = await createDb();
  const { services, total } = await listServices(db, {
    q,
    city: city && city !== "all" ? city : undefined,
    page: Number(page) || 1,
    limit: 20,
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-ink via-info to-brand p-8 text-white sm:flex-row sm:items-center">
        <div className="max-w-2xl">
          <span className="rounded-full bg-surface/20 px-3 py-1 text-xs font-bold text-white">
            SERVICES MARKETPLACE
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">
            Hire Verified African Professionals
          </h1>
          <p className="mt-2 text-sm text-disabled">
            From certified solar technicians and electricians to mobile engineers and designers. Fixed packages with escrow milestone protection.
          </p>
        </div>
        <div>
          <Link href="/sell">
            <Button className="bg-surface text-ink hover:bg-surface-muted font-bold shadow-lg min-h-12 px-6">
              + Offer a Service
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <form className="flex flex-wrap items-center gap-3 rounded-xl border bg-surface p-4 shadow-sm" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search services (e.g. Electrician, Solar Installation, React Developer)..."
          className="flex-1 min-w-[200px] rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />

        <select
          name="city"
          defaultValue={city || "all"}
          className="rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="all">All Locations</option>
          <option value="Lagos">Lagos, Nigeria</option>
          <option value="Abuja">Abuja, Nigeria</option>
          <option value="Nairobi">Nairobi, Kenya</option>
          <option value="Accra">Accra, Ghana</option>
          <option value="Johannesburg">Johannesburg, South Africa</option>
        </select>

        <Button type="submit" variant="outline" className="min-h-11 px-3 text-xs">
          Filter
        </Button>
      </form>

      {/* Services Grid */}
      <div>
        <p className="mb-4 text-xs font-semibold text-muted uppercase tracking-wide">
          {total} Professional Services Available
        </p>

        {services.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-lg font-bold text-ink">No services found matching criteria</p>
            <p className="mt-1 text-sm text-muted">
              Be the first to list a professional service or try adjusting your filters.
            </p>
            <Link href="/sell" className="mt-4">
              <Button>Offer Your Services</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link key={s.id} href={`/services/${s.slug}`}>
                <Card className="h-full p-6 transition hover:shadow-md hover:border-brand/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="font-semibold text-brand uppercase">{s.categorySlug}</span>
                      <span className="capitalize">{s.deliveryType.replace("_", " ")}</span>
                    </div>

                    <h3 className="mt-2 text-lg font-bold text-ink line-clamp-2">
                      {s.title}
                    </h3>

                    <p className="mt-2 text-xs text-muted line-clamp-3">
                      {s.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                        {s.provider?.displayName.charAt(0) || "P"}
                      </div>
                      <span className="text-xs font-medium text-ink">
                        {s.provider?.displayName}
                      </span>
                      {s.provider?.verified && (
                        <span className="text-primary-600 text-xs font-bold">✓</span>
                      )}
                      <span className="text-xs text-muted">★ {s.provider?.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="mt-6 border-t pt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-muted block uppercase">Starting at</span>
                      <span className="text-lg font-bold text-ink">
                        {formatMoney(s.basePriceMinor, s.currency)}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-brand">
                      View Packages →
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
