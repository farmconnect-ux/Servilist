import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { listVerifications } from "@/server/repositories/moderation";
import { submitVendorVerificationAction } from "@/server/services/moderation";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || (!user.permissions.includes("verifications.manage") && !user.roles.includes("admin"))) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }

  try {
    const status = request.nextUrl.searchParams.get("status") || undefined;
    const db = await createDb();
    const verifs = await listVerifications(db, status);

    return NextResponse.json({ success: true, data: verifs });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load verifications" } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const result = await submitVendorVerificationAction(user, body);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: { code: result.code, message: result.error } },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: err.message || "Invalid payload" } },
      { status: 400 },
    );
  }
}
