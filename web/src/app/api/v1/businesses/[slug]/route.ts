import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import {
  getBusinessStorefrontAction,
  updateBusinessAction,
} from "@/server/services/businesses";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await props.params;
    const storefront = await getBusinessStorefrontAction(slug);

    if (!storefront) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Business storefront not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: storefront });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Login required" } },
        { status: 401 },
      );
    }

    const body = await req.json();
    const updated = await updateBusinessAction(user.userId, body);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_FAILED", message: error.message } },
      { status: 400 },
    );
  }
}
