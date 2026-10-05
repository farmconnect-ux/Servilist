import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { isUuid } from "@/lib/ids";
import { getSessionUser } from "@/server/auth/session";
import { listReviewsForProfile } from "@/server/repositories/moderation";
import { createReviewAction } from "@/server/services/moderation";

export async function GET(request: NextRequest) {
  try {
    const profileId = request.nextUrl.searchParams.get("profileId");
    if (!profileId || !isUuid(profileId)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "profileId is required" } },
        { status: 400 },
      );
    }

    const db = await createDb();
    const reviews = await listReviewsForProfile(db, profileId);

    return NextResponse.json({ success: true, data: reviews });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load reviews" } },
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
    const result = await createReviewAction(user, body);

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
