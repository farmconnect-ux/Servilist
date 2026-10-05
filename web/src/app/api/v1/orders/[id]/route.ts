import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { isUuid } from "@/lib/ids";
import { getSessionUser } from "@/server/auth/session";
import { getOrderById } from "@/server/repositories/orders";

export async function GET(
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

  try {
    const { id } = await params;
    const db = await createDb();
    // Row-level security returns an order only to its buyer, its seller or staff
    const order = isUuid(id) ? await getOrderById(db, id) : null;

    if (!order) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Order not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load order" } },
      { status: 500 },
    );
  }
}
