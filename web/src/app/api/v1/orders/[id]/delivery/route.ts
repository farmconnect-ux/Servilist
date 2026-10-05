import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { dispatchOrderAction, getOrderDeliveryAction } from "@/server/services/deliveries";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }
  const result = await getOrderDeliveryAction((await params).id);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: result.code, message: result.error } },
      { status: result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}

/** The seller dispatches a delivery order, or corrects the delivery details. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }
  const body = await request.json().catch(() => null);
  const result = await dispatchOrderAction(user, (await params).id, body);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: result.code, message: result.error } },
      { status: result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}
