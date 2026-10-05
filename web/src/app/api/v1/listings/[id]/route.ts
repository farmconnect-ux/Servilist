import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { getListingBySlug, getListingById } from "@/server/repositories/listings";
import { updateListingAction, toggleListingPauseAction } from "@/server/services/listings";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = await createDb();
    const listing = (await getListingBySlug(db, id)) || (await getListingById(db, id));

    if (!listing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Listing not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: listing });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message } },
      { status: 500 },
    );
  }
}

export async function PATCH(
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
  try {
    const body = await request.json();
    const result = await updateListingAction(user, id, body);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: { code: result.code, message: result.error } },
        { status: result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: err.message } },
      { status: 400 },
    );
  }
}
