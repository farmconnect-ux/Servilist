import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { updateDeliveryAction } from "@/server/services/deliveries";

/** The seller reports the next delivery step. Steps only move forward. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }
  const body = await request.json().catch(() => null);
  const result = await updateDeliveryAction(user, (await params).id, body);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: result.code, message: result.error } },
      { status: result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}
