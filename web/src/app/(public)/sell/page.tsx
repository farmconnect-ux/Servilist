import { SellWizard } from "@/components/marketplace/SellWizard";
import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { listCategories } from "@/server/repositories/categories";

export const metadata = {
  title: "Sell",
  description: "List an item for sale on Servilist in a few steps.",
};

export default async function SellPage() {
  await requireUser("/sell");
  const categories = await listCategories(await createDb());

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-5 lg:px-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[40px]">Sell something</h1>
        <p className="mt-1 text-sm text-ink-soft md:text-base">
          Seven short steps. You can go back and change anything before you publish.
        </p>
      </div>
      <SellWizard
        categories={categories
          .filter((category) => !category.parentId)
          .map((category) => ({ id: category.id, name: category.name, slug: category.slug }))}
      />
    </main>
  );
}
