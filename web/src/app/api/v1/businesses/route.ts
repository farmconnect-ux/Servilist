import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { getMyBusinessAction, saveBusinessAction } from "@/server/services/businesses";

/** The signed-in member's own business page, or null if they have none. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }
  const result = await getMyBusinessAction(user);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: result.code, message: result.error } },
      { status: result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}

/** Create the member's business page, or update the one they have. */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }
  const body = await request.json().catch(() => null);
  const result = await saveBusinessAction(user, body);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: result.code, message: result.error } },
      { status: result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}
