import { CategoryIcon } from "@/components/marketplace/CategoryIcon";
import Link from "next/link";
import { createDb } from "@/lib/db/server";
import { listCategories } from "@/server/repositories/categories";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Categories · Servilist Africa",
  description: "Browse marketplace categories across electronics, solar, property, agriculture and more.",
};

export default async function CategoriesPage() {
  const db = await createDb();
  const categories = await listCategories(db);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted">
          <Link href="/" className="hover:text-brand">Home</Link> &gt; <span>Categories</span>
        </nav>
        <h1 className="text-3xl font-bold text-ink">Marketplace Categories</h1>
        <p className="mt-1 text-sm text-muted">
          Browse everything on Servilist by category.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Card key={cat.id} className="flex flex-col gap-3 p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-soft text-2xl">
                <CategoryIcon slug={cat.slug} className="size-6 text-primary-700" />
              </span>
              <div>
                <Link href={`/categories/${cat.slug}`} className="text-lg font-bold text-ink hover:text-brand">
                  {cat.name}
                </Link>
                <p className="line-clamp-1 text-xs text-muted">{cat.description}</p>
              </div>
            </div>

            {cat.subcategories && cat.subcategories.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line pt-3">
                {cat.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/categories/${sub.slug}`}
                    className="rounded-full bg-page px-2.5 py-1 text-xs font-medium text-ink hover:bg-brand-soft hover:text-brand-strong"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
