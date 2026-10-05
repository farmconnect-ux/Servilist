import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { getSuggestedListingsForRequestAction } from "@/server/services/matching";

/** Listings that fit a request. Only the member who posted the request gets any. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }
  const result = await getSuggestedListingsForRequestAction((await params).id, {
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: result.code, message: result.error } },
      { status: result.code === "NOT_FOUND" ? 404 : result.code === "SERVER_ERROR" ? 500 : 400 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}
