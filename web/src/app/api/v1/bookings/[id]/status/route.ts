import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { setBookingStatusAction } from "@/server/services/services";

/** Confirm, start, complete or cancel a booking. The database decides who may do which. */
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
  const result = await setBookingStatusAction(user, id, body);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: result.code, message: result.error } },
      { status: result.code === "FORBIDDEN" ? 403 : 400 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}
