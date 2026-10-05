import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { getSuggestedRequestsForSellerAction } from "@/server/services/matching";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Login required" } },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10;

    const matches = await getSuggestedRequestsForSellerAction(user.userId, limit);
    return NextResponse.json({ success: true, data: matches });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SELLER_MATCHES_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}
