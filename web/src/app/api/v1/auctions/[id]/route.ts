import { NextResponse, type NextRequest } from "next/server";
import { listBidsAction } from "@/server/services/auctions";

/** The bids on one auction, highest first. The listing itself is at /api/v1/listings/{id}. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await listBidsAction((await params).id);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: result.code, message: result.error } },
      { status: result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400 },
    );
  }
  return NextResponse.json({ success: true, data: { bids: result.data } });
}
