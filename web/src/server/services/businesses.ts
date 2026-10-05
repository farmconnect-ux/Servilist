import "server-only";
import { createDb } from "@/lib/db/server";
import {
  CreateBusinessProfileSchema,
  UpdateBusinessProfileSchema,
  type CreateBusinessProfileInput,
  type UpdateBusinessProfileInput,
} from "../validators/business";
import {
  createBusinessProfile,
  getBusinessBySlug,
  getBusinessByOwnerId,
  updateBusinessProfile,
  type BusinessProfileRecord,
} from "../repositories/businesses";
import { getListingBySlug, type FullListing } from "../repositories/listings";

export async function createBusinessAction(
  ownerId: string,
  rawInput: CreateBusinessProfileInput,
): Promise<BusinessProfileRecord> {
  const input = CreateBusinessProfileSchema.parse(rawInput);
  const db = await createDb();
  return createBusinessProfile(db, ownerId, input);
}

export async function getBusinessStorefrontAction(
  slug: string,
): Promise<{ business: BusinessProfileRecord; listings: any[] } | null> {
  const db = await createDb();
  const business = await getBusinessBySlug(db, slug);
  if (!business) return null;

  // Fetch active listings for this business
  const { data: listings } = await db
    .from("listings")
    .select("id, title, slug, price_major, amount_minor, currency, image_url, condition, category, status")
    .eq("seller_id", business.ownerId)
    .eq("status", "active")
    .limit(20);

  return {
    business,
    listings: listings || [],
  };
}

export async function getMyBusinessAction(
  ownerId: string,
): Promise<BusinessProfileRecord | null> {
  const db = await createDb();
  return getBusinessByOwnerId(db, ownerId);
}

export async function updateBusinessAction(
  ownerId: string,
  rawInput: UpdateBusinessProfileInput,
): Promise<BusinessProfileRecord> {
  const input = UpdateBusinessProfileSchema.parse(rawInput);
  const db = await createDb();
  return updateBusinessProfile(db, ownerId, input);
}
