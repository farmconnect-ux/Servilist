import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { getServiceBySlug } from "@/server/repositories/services";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // The public address of a service is its slug; the folder is named [id] to match /book
    const { id: slug } = await params;
    const db = await createDb();
    const service = await getServiceBySlug(db, slug);

    if (!service) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Service not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: service });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load service" } },
      { status: 500 },
    );
  }
}
