import Link from "next/link";
import { createDb } from "@/lib/db/server";
import { listCategories } from "@/server/repositories/categories";
import { SellWizard } from "@/components/marketplace/SellWizard";

export const metadata = {
  title: "Sell an Item or Offer a Service · Servilist Africa",
  description: "Create a verified listing or auction across Pan-African commerce hubs.",
};

export default async function SellPage() {
  const db = await createDb();
  const categories = await listCategories(db);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted">
          <Link href="/" className="hover:text-brand">Home</Link> &gt; <span>Sell</span>
        </nav>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">List an Item or Service</h1>
        <p className="mt-1 text-sm text-muted">
          Reach active buyers across Lagos, Nairobi, Accra, Johannesburg and major commercial hubs.
        </p>
      </div>

      <SellWizard
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon: c.icon,
        }))}
      />
    </div>
  );
}
