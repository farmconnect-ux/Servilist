import { NextResponse, type NextRequest } from "next/server";
import { isUuid } from "@/lib/ids";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { getQuotesForRequest } from "@/server/repositories/requests";
import { submitQuoteAction } from "@/server/services/requests";

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
    const quotes = await getQuotesForRequest(db, id);

    return NextResponse.json({ success: true, data: quotes });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load quotes" } },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required to submit quotes" } },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const result = await submitQuoteAction(user, { ...body, requestId: id });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: { code: result.code, message: result.error } },
        { status: result.code === "FORBIDDEN" ? 403 : 400 },
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: err.message || "Invalid JSON payload" } },
      { status: 400 },
    );
  }
}
