import { NextResponse, type NextRequest } from "next/server";
import { unifiedSearchAction } from "@/server/services/matching";

/** One search across listings, services, requests and auctions. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const result = await unifiedSearchAction({
    q: params.get("q") ?? "",
    type: params.get("type") ?? undefined,
    limit: params.get("limit") ?? undefined,
  });
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: result.code, message: result.error } },
      { status: result.code === "NOT_FOUND" ? 404 : result.code === "SERVER_ERROR" ? 500 : 400 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}
