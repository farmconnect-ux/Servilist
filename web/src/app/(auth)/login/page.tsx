import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/form";
import { SignInForm } from "@/features/auth/forms";
import { safeNextPath } from "@/lib/security/redirect";
import { getSessionUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const destination = safeNextPath(next);
  if (await getSessionUser()) redirect(destination);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-ink">Sign in</h1>
      {error === "link" ? (
        <Alert tone="danger">That link has expired or was already used. Please try again.</Alert>
      ) : null}
      <SignInForm next={destination} />
      <p className="text-center text-sm text-muted">
        New to Servilist?{" "}
        <Link href="/register" className="font-bold text-brand-strong hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
