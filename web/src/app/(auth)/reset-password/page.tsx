import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/features/auth/forms";
import { getSessionUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  // Reached from the emailed link, which signs the member in first
  if (!(await getSessionUser())) redirect("/login?error=link");

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-ink">Choose a new password</h1>
      <ResetPasswordForm />
    </div>
  );
}
