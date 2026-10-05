import { NextRequest, NextResponse } from "next/server";
import { getSuggestedListingsForRequestAction } from "@/server/services/matching";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await props.params;
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10;

    const matches = await getSuggestedListingsForRequestAction(id, limit);
    return NextResponse.json({ success: true, data: matches });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "MATCHING_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}
