import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { getSellerByUsername } from "@/server/repositories/sellerProfiles";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  try {
    const db = await createDb();
    const seller = await getSellerByUsername(db, username);

    if (!seller) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: seller });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message } },
      { status: 500 },
    );
  }
}
