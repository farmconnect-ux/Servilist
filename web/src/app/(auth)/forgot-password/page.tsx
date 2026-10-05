import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Reset your password</h1>
        <p className="text-sm text-muted">Enter your email and we will send you a reset link.</p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm">
        <Link href="/login" className="font-bold text-brand-strong hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
