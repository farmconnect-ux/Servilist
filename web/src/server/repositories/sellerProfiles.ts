import "server-only";
import type { Db } from "@/lib/db/server";

export interface SellerPublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  ratingAverage: number;
  ratingCount: number;
  verified: boolean;
  status: string;
  memberSince: string;
  /**
   * Counted from the database. Orders are private, so completed sales are only
   * countable for the member themselves or staff; public pages do not show them.
   */
  stats: {
    activeListingsCount: number;
    completedSalesCount: number;
  };
}

export async function getSellerByUsername(
  db: Db,
  username: string,
): Promise<SellerPublicProfile | null> {
  const { data: profile, error } = await db
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, city, country, rating, reviews_count, is_verified, status, created_at")
    .eq("username", username)
    .maybeSingle();

  if (error || !profile) return null;

  const [{ count: activeListings }, { count: completedOrders }] = await Promise.all([
    db.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", profile.id).in("status", ["active", "published"]),
    db.from("escrow_orders").select("id", { count: "exact", head: true }).eq("seller_id", profile.id).eq("status", "released"),
  ]);

  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name || "Servilist member",
    avatarUrl: profile.avatar_url,
    bio: profile.bio || null,
    city: profile.city,
    country: profile.country,
    ratingAverage: Number(profile.rating || 5.0),
    ratingCount: Number(profile.reviews_count || 0),
    verified: Boolean(profile.is_verified),
    status: profile.status || "active",
    memberSince: profile.created_at,
    stats: {
      activeListingsCount: activeListings || 0,
      completedSalesCount: completedOrders || 0,
    },
  };
}

export async function getProfileById(
  db: Db,
  id: string,
): Promise<SellerPublicProfile | null> {
  const { data: profile, error } = await db
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, city, country, rating, reviews_count, is_verified, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !profile) return null;

  const [{ count: activeListings }, { count: completedOrders }] = await Promise.all([
    db.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", profile.id).in("status", ["active", "published"]),
    db.from("orders").select("id", { count: "exact", head: true }).eq("seller_id", profile.id).eq("status", "completed"),
  ]);

  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name || "Servilist member",
    avatarUrl: profile.avatar_url,
    bio: profile.bio || null,
    city: profile.city,
    country: profile.country,
    ratingAverage: Number(profile.rating || 5.0),
    ratingCount: Number(profile.reviews_count || 0),
    verified: Boolean(profile.is_verified),
    status: profile.status || "active",
    memberSince: profile.created_at,
    stats: {
      activeListingsCount: activeListings || 0,
      completedSalesCount: completedOrders || 0,
    },
  };
}
