import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ServiceCard } from "@/components/marketplace/cards";
import { Button, ButtonLink, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { createDb } from "@/lib/db/server";
import { listServices } from "@/server/repositories/services";

export const metadata = {
  title: "Services",
  description: "Find a provider for repairs, cleaning, transport, events and more, or offer your own service.",
};

/** Services marketplace (docs/UI_UX_SPEC.md section 27). */

const PAGE_SIZE = 18;
type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined, max = 80): string {
  return ((Array.isArray(value) ? value[0] : value) ?? "").slice(0, max).trim();
}

export default async function ServicesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = first(params.q);
  const city = first(params.city, 50);
  const page = Math.max(1, Math.min(500, Number.parseInt(first(params.page, 4), 10) || 1));

  const { services, total } = await listServices(await createDb(), {
    q: q || undefined,
    city: city || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(q || city);

  function href(target: number): string {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (city) next.set("city", city);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/services?${query}` : "/services";
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-5 lg:px-6">
      <section className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-6 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="max-w-2xl">
          <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[40px]">Find a service</h1>
          <p className="mt-2 text-[15px] text-ink-soft md:text-base">
            Hire a provider for repairs, cleaning, transport, events and more.
          </p>
        </div>
        <ButtonLink href="/services/new" size="lg" variant="secondary" className="shrink-0">
          <Plus className="size-5" aria-hidden="true" />
          Offer a service
        </ButtonLink>
      </section>

      <form
        action="/services"
        method="get"
        role="search"
        className="grid gap-3 rounded-card border border-line bg-surface p-4 md:grid-cols-[1fr_220px_auto]"
      >
        <label htmlFor="services-q" className="sr-only">
          Search services
        </label>
        <Input id="services-q" name="q" type="search" defaultValue={q} maxLength={80} placeholder="What service do you need?" />
        <label htmlFor="services-city" className="sr-only">
          City
        </label>
        <Input id="services-city" name="city" defaultValue={city} maxLength={50} placeholder="City" />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <section aria-label="Services" className="flex flex-col gap-4">
        <p className="text-sm text-ink-soft" role="status">
          {total === 1 ? "1 service" : `${total} services`}
        </p>

        {services.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={filtered ? "No services match your search" : "No services yet"}
            action={<ButtonLink href="/requests/new">Post a request</ButtonLink>}
          >
            Describe the job in a request and let providers send you offers.
          </EmptyState>
        )}

        {pages > 1 ? (
          <nav aria-label="Pages" className="mt-4 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Link href={href(page - 1)} className={buttonClass("secondary")}>
                <ChevronLeft className="size-4" aria-hidden="true" />
                Previous
              </Link>
            ) : null}
            <span className="text-sm text-ink-soft">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link href={href(page + 1)} className={buttonClass("secondary")}>
                Next
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </main>
  );
}
