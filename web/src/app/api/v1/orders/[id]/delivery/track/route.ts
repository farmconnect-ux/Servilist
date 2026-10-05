import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { updateDeliveryTrackingAction } from "@/server/services/deliveries";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Login required" } },
        { status: 401 },
      );
    }

    const { id } = await props.params;
    const body = await req.json();

    const delivery = await updateDeliveryTrackingAction(user.userId, id, body);
    return NextResponse.json({ success: true, data: delivery });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "TRACKING_UPDATE_FAILED", message: error.message } },
      { status: 400 },
    );
  }
}
