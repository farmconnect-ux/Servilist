import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { bookServiceAction } from "@/server/services/services";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required to hire services" } },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const result = await bookServiceAction(user, { ...body, serviceId: id });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: { code: result.code, message: result.error } },
        { status: result.code === "FORBIDDEN" ? 403 : 400 },
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: err.message || "Invalid payload" } },
      { status: 400 },
    );
  }
}
