import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { getSuggestedRequestsForSellerAction } from "@/server/services/matching";

/** Open requests in the categories the signed-in member sells in. */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }
  const result = await getSuggestedRequestsForSellerAction({
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
