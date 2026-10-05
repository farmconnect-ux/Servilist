import { NextRequest, NextResponse } from "next/server";
import { unifiedSearchAction } from "@/server/services/matching";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    if (!q.trim()) {
      return NextResponse.json({
        success: true,
        data: { listings: [], requests: [], services: [], auctions: [] },
      });
    }

    const entityType = (searchParams.get("type") || "all") as any;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

    const result = await unifiedSearchAction({
      q,
      entityType,
      limit,
      page: 1,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SEARCH_FAILED", message: error.message } },
      { status: 400 },
    );
  }
}
