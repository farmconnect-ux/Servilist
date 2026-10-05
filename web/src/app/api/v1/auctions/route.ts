import { NextResponse, type NextRequest } from "next/server";
import { listAuctionsAction } from "@/server/services/auctions";

/**
 * Running auctions. An auction is created like any other listing, through
 * POST /api/v1/listings with the auction type.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const result = await listAuctionsAction({
    q: params.get("q") ?? undefined,
    city: params.get("city") ?? undefined,
    page: params.get("page") ?? undefined,
    limit: params.get("limit") ?? undefined,
  });
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: result.code, message: result.error } },
      { status: result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400 },
    );
  }
  return NextResponse.json({ success: true, data: result.data.auctions, meta: { total: result.data.total } });
}
