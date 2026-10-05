import { RequestWizard } from "@/components/marketplace/RequestWizard";
import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { listCategories } from "@/server/repositories/categories";

export const metadata = {
  title: "Post a request",
  description: "Tell sellers what you need and let them send you offers.",
};

export default async function NewRequestPage() {
  await requireUser("/requests/new");
  const categories = await listCategories(await createDb());

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-5 lg:px-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[40px]">Post a request</h1>
        <p className="mt-1 text-sm text-ink-soft md:text-base">
          Can&apos;t find what you need? Tell sellers what you&apos;re looking for and they&apos;ll send
          you offers.
        </p>
      </div>
      <RequestWizard
        categories={categories
          .filter((category) => !category.parentId)
          .map((category) => ({ id: category.id, name: category.name, slug: category.slug }))}
      />
    </main>
  );
}
