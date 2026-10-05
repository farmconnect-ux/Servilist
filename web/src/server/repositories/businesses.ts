import "server-only";
import type { Db } from "@/lib/db/server";
import type { BusinessProfileInput } from "../validators/business";

/**
 * Business pages. Members can read them; the only way to write one is the
 * database function save_business_profile(), which acts for the signed-in
 * member (supabase/migrations/00019). A business cannot mark itself verified:
 * the badge comes from the owner's profile, which only staff can change.
 */

export interface BusinessProfileRecord {
  id: string;
  ownerId: string;
  businessName: string;
  slug: string;
  registrationNumber: string | null;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  websiteUrl: string | null;
  returnPolicy: string | null;
  openingHours: string | null;
  isActive: boolean;
  createdAt: string;
  owner: {
    username: string | null;
    displayName: string;
    rating: number;
    reviewsCount: number;
    verified: boolean;
  } | null;
}

type Row = Record<string, unknown>;

const COLUMNS = `id, owner_id, business_name, slug, registration_number, tagline, description, logo_url,
  banner_url, support_email, support_phone, website_url, return_policy, opening_hours, is_active, created_at,
  owner:profiles!owner_id(username, display_name, rating, reviews_count, is_verified)`;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function safeUrl(value: unknown): string | null {
  const url = typeof value === "string" ? value.trim() : "";
  return /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : null;
}

function mapBusinessRow(row: Row): BusinessProfileRecord {
  const owner = (Array.isArray(row.owner) ? row.owner[0] : row.owner) as Row | null | undefined;
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    businessName: String(row.business_name),
    slug: String(row.slug),
    registrationNumber: text(row.registration_number),
    tagline: text(row.tagline),
    description: text(row.description),
    logoUrl: safeUrl(row.logo_url),
    bannerUrl: safeUrl(row.banner_url),
    supportEmail: text(row.support_email),
    supportPhone: text(row.support_phone),
    websiteUrl: safeUrl(row.website_url),
    returnPolicy: text(row.return_policy),
    openingHours: text(row.opening_hours),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    owner: owner
      ? {
          username: text(owner.username),
          displayName: String(owner.display_name ?? "Seller"),
          rating: Number(owner.rating ?? 0),
          reviewsCount: Number(owner.reviews_count ?? 0),
          verified: Boolean(owner.is_verified),
        }
      : null,
  };
}

/** Row-level security returns a suspended page only to its owner and to staff. */
export async function getBusinessBySlug(db: Db, slug: string): Promise<BusinessProfileRecord | null> {
  const { data, error } = await db.from("business_profiles").select(COLUMNS).eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return mapBusinessRow(data as Row);
}

export async function getBusinessByOwnerId(db: Db, ownerId: string): Promise<BusinessProfileRecord | null> {
  const { data, error } = await db
    .from("business_profiles")
    .select(COLUMNS)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error || !data) return null;
  return mapBusinessRow(data as Row);
}

/** Create the signed-in member's business page, or update the one they have. */
export async function saveBusinessProfile(db: Db, input: BusinessProfileInput): Promise<{ slug: string }> {
  const { data, error } = await db.rpc("save_business_profile", {
    p_business_name: input.businessName,
    p_tagline: input.tagline ?? null,
    p_description: input.description ?? null,
    p_logo_url: input.logoUrl ?? null,
    p_banner_url: input.bannerUrl ?? null,
    p_support_email: input.supportEmail ?? null,
    p_support_phone: input.supportPhone ?? null,
    p_website_url: input.websiteUrl ?? null,
    p_return_policy: input.returnPolicy ?? null,
    p_opening_hours: input.openingHours ?? null,
    p_registration_number: input.registrationNumber ?? null,
  });
  if (error) throw new Error(error.message);
  return { slug: String((data as Row | null)?.slug ?? "") };
}
