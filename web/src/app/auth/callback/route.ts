import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { safeNextPath } from "@/lib/security/redirect";

/** Landing point for emailed links (confirm account, reset password). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const db = await createDb();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
