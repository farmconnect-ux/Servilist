import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { getOfferById } from "@/server/repositories/offers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_REQUIRED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const db = await createDb();
    const offer = await getOfferById(db, id);

    if (!offer) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Offer not found" } },
        { status: 404 },
      );
    }

    if (offer.buyerId !== user.userId && offer.sellerId !== user.userId && !user.roles.includes("admin")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized to view this offer" } },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, data: offer });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load offer" } },
      { status: 500 },
    );
  }
}
