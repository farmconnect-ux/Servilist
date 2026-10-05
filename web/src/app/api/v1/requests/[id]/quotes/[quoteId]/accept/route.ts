import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { acceptQuoteAction } from "@/server/services/requests";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; quoteId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  try {
    const { id, quoteId } = await params;
    const result = await acceptQuoteAction(user, id, quoteId);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: { code: result.code, message: result.error } },
        { status: result.code === "FORBIDDEN" ? 403 : 400 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to accept quote" } },
      { status: 500 },
    );
  }
}
