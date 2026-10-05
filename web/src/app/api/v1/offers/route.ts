import { NextResponse, type NextRequest } from "next/server";
import { isUuid } from "@/lib/ids";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { listOffersForUser } from "@/server/repositories/offers";
import { createOfferAction } from "@/server/services/offers";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const listingId = searchParams.get("listingId");
    const roleParam = searchParams.get("role");
    const role = roleParam === "buyer" || roleParam === "seller" ? roleParam : "all";

    const db = await createDb();
    const offers = await listOffersForUser(db, user.userId, {
      role,
      listingId: listingId && isUuid(listingId) ? listingId : undefined,
    });
    return NextResponse.json({ success: true, data: offers });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load offers" } },
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
    const result = await createOfferAction(user, body);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: { code: result.code, message: result.error } },
        { status: result.code === "FORBIDDEN" ? 403 : 400 },
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
