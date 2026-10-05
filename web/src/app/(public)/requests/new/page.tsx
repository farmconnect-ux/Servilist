import Link from "next/link";
import { createDb } from "@/lib/db/server";
import { listCategories } from "@/server/repositories/categories";
import { RequestWizard } from "@/components/marketplace/RequestWizard";

export const metadata = {
  title: "Post a Buyer Request · Servilist Africa",
  description: "Can't find what you need? Post a request and receive offers from verified sellers and service providers.",
};

export default async function NewRequestPage() {
  const db = await createDb();
  const categories = await listCategories(db);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted">
          <Link href="/" className="hover:text-brand">Home</Link> &gt;{" "}
          <Link href="/requests" className="hover:text-brand">Buyer Requests</Link> &gt;{" "}
          <span>New</span>
        </nav>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Post a Buyer Request</h1>
        <p className="mt-1 text-sm text-muted">
          Tell sellers and service providers across Pan-Africa exactly what you need. Receive competitive quotes directly.
        </p>
      </div>

      <RequestWizard
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
