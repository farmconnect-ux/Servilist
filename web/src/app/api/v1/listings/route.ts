import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { ListingSearchSchema } from "@/server/validators/listing";
import { searchListings } from "@/server/repositories/listings";
import { createListingAction } from "@/server/services/listings";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      q: searchParams.get("q") || undefined,
      category: searchParams.get("category") || undefined,
      city: searchParams.get("city") || undefined,
      condition: searchParams.get("condition") || undefined,
      format: searchParams.get("format") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      sort: searchParams.get("sort") || "newest",
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    };

    const parsed = ListingSearchSchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid search parameters", details: parsed.error.issues },
        },
        { status: 400 },
      );
    }

    const db = await createDb();
    const { listings, total } = await searchListings(db, parsed.data);

    return NextResponse.json({
      success: true,
      data: listings,
      meta: {
        total,
        page: parsed.data.page,
        limit: parsed.data.limit,
        totalPages: Math.ceil(total / parsed.data.limit) || 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to search listings" } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required to create listings" } },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const result = await createListingAction(user, body);

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
