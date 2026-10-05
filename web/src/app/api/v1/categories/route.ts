import { NextResponse } from "next/server";
import { createDb } from "@/lib/db/server";
import { listCategories } from "@/server/repositories/categories";

export async function GET() {
  try {
    const db = await createDb();
    const categories = await listCategories(db);
    return NextResponse.json({
      success: true,
      data: categories,
      meta: { count: categories.length },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || "Failed to load categories" },
      },
      { status: 500 },
    );
  }
}
