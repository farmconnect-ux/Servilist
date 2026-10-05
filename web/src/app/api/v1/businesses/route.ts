import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { createBusinessAction, getMyBusinessAction } from "@/server/services/businesses";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Login required" } },
        { status: 401 },
      );
    }

    const business = await getMyBusinessAction(user.userId);
    return NextResponse.json({ success: true, data: business });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Login required" } },
        { status: 401 },
      );
    }

    const body = await req.json();
    const business = await createBusinessAction(user.userId, body);

    return NextResponse.json({ success: true, data: business }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CREATE_BUSINESS_FAILED", message: error.message } },
      { status: 400 },
    );
  }
}
