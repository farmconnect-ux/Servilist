import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { listBookingsForUser } from "@/server/repositories/services";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  try {
    const role = (request.nextUrl.searchParams.get("role") || "all") as "client" | "provider" | "all";
    const db = await createDb();
    const bookings = await listBookingsForUser(db, user.userId, role);

    return NextResponse.json({ success: true, data: bookings });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load bookings" } },
      { status: 500 },
    );
  }
}
