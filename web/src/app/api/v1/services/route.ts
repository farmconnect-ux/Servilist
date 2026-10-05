import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { listServices } from "@/server/repositories/services";
import { createServiceAction } from "@/server/services/services";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get("category") || undefined;
    const city = searchParams.get("city") || undefined;
    const q = searchParams.get("q") || undefined;
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);

    const db = await createDb();
    const { services, total } = await listServices(db, { categorySlug, city, q, page, limit });

    return NextResponse.json({
      success: true,
      data: services,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load services" } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required to create services" } },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const result = await createServiceAction(user, body);

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
