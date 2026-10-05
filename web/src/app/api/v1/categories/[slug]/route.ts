import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { getCategoryBySlug } from "@/server/repositories/categories";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const db = await createDb();
    const category = await getCategoryBySlug(db, slug);
    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Category not found" } },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: category });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message } },
      { status: 500 },
    );
  }
}
