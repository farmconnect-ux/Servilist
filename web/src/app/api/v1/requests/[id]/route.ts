import { NextResponse, type NextRequest } from "next/server";
import { isUuid } from "@/lib/ids";
import { createDb } from "@/lib/db/server";
import { getBuyerRequestById } from "@/server/repositories/requests";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Request not found" } },
        { status: 404 },
      );
    }
    const db = await createDb();
    const item = await getBuyerRequestById(db, id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Buyer request not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load request" } },
      { status: 500 },
    );
  }
}
