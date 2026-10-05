import { ServiceForm } from "@/components/marketplace/ServiceForm";
import { createDb } from "@/lib/db/server";
import { requireUser } from "@/server/auth/session";
import { listCategories } from "@/server/repositories/categories";

export const metadata = {
  title: "Offer a service",
  description: "List a service you provide so clients can find and book you.",
};

export default async function NewServicePage() {
  await requireUser("/services/new");
  const categories = await listCategories(await createDb());

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-5 lg:px-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[40px]">Offer a service</h1>
        <p className="mt-1 text-sm text-ink-soft md:text-base">
          Describe what you do and how you price it. Clients can then book you or send a request.
        </p>
      </div>
      <ServiceForm
        categories={categories
          .filter((category) => !category.parentId)
          .map((category) => ({ slug: category.slug, name: category.name }))}
      />
    </main>
  );
}
