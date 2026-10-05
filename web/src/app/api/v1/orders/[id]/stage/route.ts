import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { setOrderStageAction } from "@/server/services/orders";

/** The seller marks a paid order as dispatched or delivered. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const result = await setOrderStageAction(user, id, body?.stage);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: result.code, message: result.error } },
      { status: result.code === "FORBIDDEN" ? 403 : 400 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}
