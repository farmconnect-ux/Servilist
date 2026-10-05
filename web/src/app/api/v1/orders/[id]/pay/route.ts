import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { initializeOrderPaymentAction } from "@/server/services/orders";

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

  try {
    const { id } = await params;
    // There is no default: the buyer chooses Paystack or Flutterwave
    const body = await request.json().catch(() => null);
    const provider: unknown = body?.provider;

    const result = await initializeOrderPaymentAction(user, id, provider);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: { code: result.code, message: result.error } },
        { status: result.code === "FORBIDDEN" ? 403 : 400 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to initiate payment" } },
      { status: 500 },
    );
  }
}
