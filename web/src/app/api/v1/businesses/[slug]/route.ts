import { NextResponse, type NextRequest } from "next/server";
import { getBusinessAction } from "@/server/services/businesses";

/** A public business page. Changes go through POST /api/v1/businesses. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const result = await getBusinessAction((await params).slug);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: result.code, message: result.error } },
      { status: result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}
