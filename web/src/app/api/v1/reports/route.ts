import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { listReports } from "@/server/repositories/moderation";
import { createReportAction } from "@/server/services/moderation";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || (!user.permissions.includes("reports.manage") && !user.roles.includes("admin"))) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const targetType = searchParams.get("targetType") || undefined;

    const db = await createDb();
    const reports = await listReports(db, { status, targetType });

    return NextResponse.json({ success: true, data: reports });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load reports" } },
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
    const result = await createReportAction(user, body);

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
