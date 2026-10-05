import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";

/** The signed-in member, their roles and permissions (master spec section 39). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthenticated", message: "Sign in to continue." } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    {
      data: {
        id: user.userId,
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        status: user.status,
        roles: user.roles,
        permissions: user.permissions,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
