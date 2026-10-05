import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/features/auth/forms";
import { getSessionUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await getSessionUser()) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Create your account</h1>
        <p className="text-sm text-muted">One account lets you buy, sell and post requests.</p>
      </div>
      <SignUpForm />
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-brand-strong hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
