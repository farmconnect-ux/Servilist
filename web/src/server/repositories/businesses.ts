import "server-only";
import type { Db } from "@/lib/db/server";
import type {
  CreateBusinessProfileInput,
  UpdateBusinessProfileInput,
} from "../validators/business";

export interface BusinessProfileRecord {
  id: string;
  ownerId: string;
  businessName: string;
  slug: string;
  registrationNumber?: string | null;
  tagline?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  websiteUrl?: string | null;
  verifiedTier: "unverified" | "tier_1_identity" | "tier_2_business_cac" | "tier_3_enterprise";
  returnPolicy?: string | null;
  operatingHours?: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  owner?: {
    username: string;
    displayName: string;
    rating: number;
    reviewsCount: number;
    verified: boolean;
  };
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base || "biz"}-${randomSuffix}`;
}

function mapBusinessRow(row: any): BusinessProfileRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    businessName: row.business_name,
    slug: row.slug,
    registrationNumber: row.registration_number,
    tagline: row.tagline,
    description: row.description,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    supportEmail: row.support_email,
    supportPhone: row.support_phone,
    websiteUrl: row.website_url,
    verifiedTier: row.verified_tier || "unverified",
    returnPolicy: row.return_policy,
    operatingHours: row.operating_hours || {},
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    owner: row.owner
      ? {
          username: row.owner.username,
          displayName: row.owner.display_name,
          rating: Number(row.owner.rating || 0),
          reviewsCount: Number(row.owner.reviews_count || 0),
          verified: Boolean(row.owner.is_verified),
        }
      : undefined,
  };
}

export async function createBusinessProfile(
  db: Db,
  ownerId: string,
  input: CreateBusinessProfileInput,
): Promise<BusinessProfileRecord> {
  const slug = generateSlug(input.businessName);

  const { data, error } = await db
    .from("business_profiles")
    .insert({
      owner_id: ownerId,
      business_name: input.businessName,
      slug,
      registration_number: input.registrationNumber || null,
      tagline: input.tagline || null,
      description: input.description || null,
      logo_url: input.logoUrl || null,
      banner_url: input.bannerUrl || null,
      support_email: input.supportEmail || null,
      support_phone: input.supportPhone || null,
      website_url: input.websiteUrl || null,
      return_policy: input.returnPolicy || null,
      operating_hours: input.operatingHours || {},
      verified_tier: input.registrationNumber ? "tier_2_business_cac" : "tier_1_identity",
    })
    .select(
      `
      *,
      owner:profiles!owner_id(username, display_name, rating, reviews_count, is_verified)
    `,
    )
    .single();

  if (error) {
    throw new Error(`Failed to create business profile: ${error.message}`);
  }

  return mapBusinessRow(data);
}

export async function getBusinessBySlug(
  db: Db,
  slug: string,
): Promise<BusinessProfileRecord | null> {
  const { data, error } = await db
    .from("business_profiles")
    .select(
      `
      *,
      owner:profiles!owner_id(username, display_name, rating, reviews_count, is_verified)
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return mapBusinessRow(data);
}

export async function getBusinessByOwnerId(
  db: Db,
  ownerId: string,
): Promise<BusinessProfileRecord | null> {
  const { data, error } = await db
    .from("business_profiles")
    .select(
      `
      *,
      owner:profiles!owner_id(username, display_name, rating, reviews_count, is_verified)
    `,
    )
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error || !data) return null;
  return mapBusinessRow(data);
}

export async function updateBusinessProfile(
  db: Db,
  ownerId: string,
  input: UpdateBusinessProfileInput,
): Promise<BusinessProfileRecord> {
  const updateData: any = { updated_at: new Date().toISOString() };
  if (input.businessName !== undefined) updateData.business_name = input.businessName;
  if (input.registrationNumber !== undefined) updateData.registration_number = input.registrationNumber;
  if (input.tagline !== undefined) updateData.tagline = input.tagline;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.logoUrl !== undefined) updateData.logo_url = input.logoUrl;
  if (input.bannerUrl !== undefined) updateData.banner_url = input.bannerUrl;
  if (input.supportEmail !== undefined) updateData.support_email = input.supportEmail;
  if (input.supportPhone !== undefined) updateData.support_phone = input.supportPhone;
  if (input.websiteUrl !== undefined) updateData.website_url = input.websiteUrl;
  if (input.returnPolicy !== undefined) updateData.return_policy = input.returnPolicy;
  if (input.operatingHours !== undefined) updateData.operating_hours = input.operatingHours;

  const { data, error } = await db
    .from("business_profiles")
    .update(updateData)
    .eq("owner_id", ownerId)
    .select(
      `
      *,
      owner:profiles!owner_id(username, display_name, rating, reviews_count, is_verified)
    `,
    )
    .single();

  if (error) {
    throw new Error(`Failed to update business profile: ${error.message}`);
  }

  return mapBusinessRow(data);
}
