import "server-only";
import type { Db } from "@/lib/db/server";
import { toMinorUnits } from "@/lib/money";
import type { CreateListingInput, UpdateListingInput, ListingSearchInput } from "../validators/listing";
import { likePattern } from "./marketplace";

const PUBLIC_SELLER = "id, username, display_name, rating, reviews_count, is_verified, avatar_url, city, country";

export interface FullListing {
  id: string;
  sellerId: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  categoryId?: string | null;
  listingType: string;
  format: string;
  condition: string;
  priceMajor: number;
  amountMinor: number;
  currency: string;
  quantity: number;
  negotiable: boolean;
  bidsCount: number;
  status: string;
  city: string;
  country: string;
  fulfillment: string;
  imageUrl: string;
  galleryImages: Array<{ id: string; url: string; isPrimary: boolean; sortOrder: number }>;
  publishedAt: string;
  createdAt: string;
  seller: {
    id: string;
    username: string;
    displayName: string;
    rating: number;
    reviewsCount: number;
    verified: boolean;
    avatarUrl: string | null;
    city: string | null;
    country: string | null;
  };
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${base || "item"}-${randomSuffix}`;
}

export async function createListing(
  db: Db,
  sellerId: string,
  input: CreateListingInput,
): Promise<{ id: string; slug: string }> {
  const slug = generateSlug(input.title);
  const amountMinor = toMinorUnits(input.priceMajor, input.currency);
  const format = input.listingType === "auction" ? "auction" : "buy_now";

  const { data, error } = await db
    .from("listings")
    .insert({
      seller_id: sellerId,
      title: input.title,
      slug,
      description: input.description,
      category: input.categorySlug,
      category_id: input.categoryId || null,
      listing_type: input.listingType,
      format,
      condition: input.condition,
      currency: input.currency,
      amount_minor: amountMinor,
      quantity: input.quantity,
      negotiable: input.negotiable,
      city: input.city,
      country: input.country,
      fulfillment: input.fulfillment,
      image_url: input.imageUrl,
      status: input.status,
      published_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error) {
    throw new Error(`Failed to create listing: ${error.message}`);
  }

  // Insert gallery images if any
  if (input.galleryImages && input.galleryImages.length > 0) {
    const imageRows = input.galleryImages.map((url, idx) => ({
      listing_id: data.id,
      url,
      sort_order: idx + 1,
      is_primary: idx === 0,
    }));
    await db.from("listing_images").insert(imageRows);
  }

  return { id: data.id, slug: data.slug };
}

export async function getListingBySlug(db: Db, slug: string): Promise<FullListing | null> {
  const { data, error } = await db
    .from("listings")
    .select(`
      *,
      seller:profiles!seller_id(${PUBLIC_SELLER}),
      images:listing_images(*)
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    // Try by ID fallback in case slug is an id
    const { data: byId } = await db
      .from("listings")
      .select(`
        *,
        seller:profiles!seller_id(${PUBLIC_SELLER}),
        images:listing_images(*)
      `)
      .eq("id", slug)
      .maybeSingle();
    if (!byId) return null;
    return mapFullListing(byId);
  }

  return mapFullListing(data);
}

export async function getListingById(db: Db, id: string): Promise<FullListing | null> {
  const { data, error } = await db
    .from("listings")
    .select(`
      *,
      seller:profiles!seller_id(${PUBLIC_SELLER}),
      images:listing_images(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapFullListing(data);
}

function mapFullListing(row: any): FullListing {
  const seller = Array.isArray(row.seller) ? row.seller[0] : row.seller;
  const rawImages = (row.images || []) as any[];

  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    title: String(row.title),
    slug: String(row.slug || row.id),
    description: String(row.description),
    category: String(row.category),
    categoryId: row.category_id || null,
    listingType: String(row.listing_type || row.format || "fixed_price"),
    format: String(row.format || "buy_now"),
    condition: String(row.condition || "used_good"),
    priceMajor: Number(row.amount_minor || 0) / 100,
    amountMinor: Number(row.amount_minor || 0),
    currency: String(row.currency || "NGN"),
    quantity: Number(row.quantity || 1),
    negotiable: Boolean(row.negotiable),
    bidsCount: Number(row.bids_count || 0),
    status: String(row.status),
    city: String(row.city),
    country: String(row.country || "Nigeria"),
    fulfillment: String(row.fulfillment || "both"),
    imageUrl: String(row.image_url),
    galleryImages: rawImages.map((img) => ({
      id: String(img.id),
      url: String(img.url),
      isPrimary: Boolean(img.is_primary),
      sortOrder: Number(img.sort_order || 0),
    })),
    publishedAt: String(row.published_at || row.created_at),
    createdAt: String(row.created_at),
    seller: {
      id: String(seller?.id || row.seller_id),
      username: String(seller?.username || ""),
      displayName: String(seller?.display_name || "Merchant"),
      rating: Number(seller?.rating || 5.0),
      reviewsCount: Number(seller?.reviews_count || 0),
      verified: Boolean(seller?.is_verified),
      avatarUrl: seller?.avatar_url || null,
      city: seller?.city || null,
      country: seller?.country || null,
    },
  };
}

export async function searchListings(
  db: Db,
  params: Partial<ListingSearchInput> = {},
): Promise<{ listings: FullListing[]; total: number }> {
  let query = db
    .from("listings")
    .select(`
      *,
      seller:profiles!seller_id(${PUBLIC_SELLER}),
      images:listing_images(*)
    `, { count: "exact" })
    .in("status", ["active", "published"]);

  if (params.q) {
    query = query.or(`title.ilike.${likePattern(params.q)},description.ilike.${likePattern(params.q)}`);
  }
  if (params.category && params.category !== "all") {
    query = query.eq("category", params.category);
  }
  if (params.city && params.city !== "all") {
    query = query.ilike("city", `%${params.city}%`);
  }
  if (params.condition) {
    query = query.eq("condition", params.condition);
  }
  if (params.format && params.format !== "all") {
    query = query.eq("format", params.format);
  }
  if (params.minPrice !== undefined) {
    query = query.gte("amount_minor", params.minPrice * 100);
  }
  if (params.maxPrice !== undefined) {
    query = query.lte("amount_minor", params.maxPrice * 100);
  }

  // Sort
  const sort = params.sort || "newest";
  if (sort === "price_asc") {
    query = query.order("amount_minor", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("amount_minor", { ascending: false });
  } else if (sort === "bids_desc") {
    query = query.order("bids_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const page = params.page || 1;
  const limit = params.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) {
    throw new Error(`Search error: ${error.message}`);
  }

  const listings = (data || []).map(mapFullListing);
  return { listings, total: count || 0 };
}

export async function updateListing(
  db: Db,
  id: string,
  sellerId: string,
  input: UpdateListingInput,
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (input.title) updates.title = input.title;
  if (input.description) updates.description = input.description;
  if (input.categorySlug) updates.category = input.categorySlug;
  if (input.condition) updates.condition = input.condition;
  if (input.priceMajor !== undefined && input.currency) {
    updates.amount_minor = toMinorUnits(input.priceMajor, input.currency);
  }
  if (input.city) updates.city = input.city;
  if (input.status) updates.status = input.status;
  if (input.imageUrl) updates.image_url = input.imageUrl;

  const { error } = await db
    .from("listings")
    .update(updates)
    .eq("id", id)
    .eq("seller_id", sellerId);

  if (error) {
    throw new Error(`Failed to update listing: ${error.message}`);
  }
}

export async function setListingStatus(
  db: Db,
  id: string,
  sellerId: string,
  status: "published" | "active" | "paused" | "sold" | "removed",
): Promise<void> {
  const { error } = await db
    .from("listings")
    .update({ status })
    .eq("id", id)
    .eq("seller_id", sellerId);

  if (error) {
    throw new Error(`Failed to transition listing status to ${status}: ${error.message}`);
  }
}
