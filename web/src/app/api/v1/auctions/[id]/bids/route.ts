import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { placeBidAction, getAuctionDetailsAction } from "@/server/services/auctions";

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
    return NextResponse.json({ success: true, data: details.bids });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "BIDS_FETCH_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Login required to bid" } },
        { status: 401 },
      );
    }

    const { id } = await props.params;
    const body = await req.json();

    const result = await placeBidAction(id, user.userId, body);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "BID_FAILED", message: error.message } },
      { status: 400 },
    );
  }
}
