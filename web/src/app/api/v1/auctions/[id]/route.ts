import { NextRequest, NextResponse } from "next/server";
import { getAuctionDetailsAction } from "@/server/services/auctions";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await props.params;
    const details = await getAuctionDetailsAction(id);
    if (!details) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Auction not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: details.auction,
      bids: details.bids,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "AUCTION_FETCH_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}
