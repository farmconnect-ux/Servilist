import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { listAuctionsAction, createAuctionAction } from "@/server/services/auctions";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = {
      status: (searchParams.get("status") || "active") as any,
      category: searchParams.get("category") || undefined,
      city: searchParams.get("city") || undefined,
      sellerId: searchParams.get("sellerId") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20,
    };

    const result = await listAuctionsAction(query);
    return NextResponse.json({
      success: true,
      data: result.auctions,
      meta: { total: result.total, page: query.page, limit: query.limit },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "QUERY_FAILED", message: error.message } },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Login required" } },
        { status: 401 },
      );
    }

    const body = await req.json();
    const auction = await createAuctionAction(user.userId, body);

    return NextResponse.json({ success: true, data: auction }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CREATE_AUCTION_FAILED", message: error.message } },
      { status: 400 },
    );
  }
}
