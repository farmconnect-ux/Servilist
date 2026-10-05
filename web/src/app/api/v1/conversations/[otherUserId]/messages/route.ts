import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { getConversationMessages } from "@/server/repositories/messaging";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ otherUserId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  try {
    const { otherUserId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const listingId = searchParams.get("listingId") || undefined;
    const requestId = searchParams.get("requestId") || undefined;

    const db = await createDb();
    const messages = await getConversationMessages(db, {
      userId: user.userId,
      otherUserId,
      listingId,
      requestId,
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load messages" } },
      { status: 500 },
    );
  }
}
