import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";
import { SendMessageSchema } from "@/server/validators/message";
import { listUserConversations, sendMessage } from "@/server/repositories/messaging";

export async function GET(_request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  try {
    const db = await createDb();
    const convos = await listUserConversations(db, user.userId);
    return NextResponse.json({ success: true, data: convos });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load conversations" } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  if (!canParticipate(user)) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Your account is not permitted to send messages" } },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message } },
        { status: 400 },
      );
    }

    if (parsed.data.recipientId === user.userId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_ACTION", message: "Cannot send a message to yourself" } },
        { status: 400 },
      );
    }

    const db = await createDb();
    const msg = await sendMessage(db, {
      senderId: user.userId,
      recipientId: parsed.data.recipientId,
      listingId: parsed.data.listingId,
      requestId: parsed.data.requestId,
      body: parsed.data.body,
    });

    return NextResponse.json({ success: true, data: msg }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: err.message || "Failed to send message" } },
      { status: 400 },
    );
  }
}
