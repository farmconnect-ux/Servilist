import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { cancelOrderAction } from "@/server/services/orders";

/** The buyer cancels an order that has not been paid. */
export async function POST(
  _request: NextRequest,
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
  const result = await cancelOrderAction(user, id);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: result.code, message: result.error } },
      { status: 400 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}
