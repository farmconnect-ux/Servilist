import "server-only";
import crypto from "crypto";
import type { Db } from "@/lib/db/server";
import { toMinorUnits } from "@/lib/money";
import type { CreateServiceInput, CreateServiceBookingInput } from "../validators/service";
import { likePattern, type PublicProfile } from "./marketplace";

const PUBLIC_PROFILE = "id, username, display_name, rating, reviews_count, is_verified";

export interface ServiceRecord {
  id: string;
  providerId: string;
  categorySlug: string;
  title: string;
  slug: string;
  description: string;
  pricingModel: string;
  basePriceMinor: number;
  currency: string;
  deliveryType: string;
  city?: string | null;
  country: string;
  packages: any[];
  status: string;
  createdAt: string;
  provider?: PublicProfile;
}

export interface ServiceBookingRecord {
  id: string;
  bookingNumber: string;
  serviceId: string;
  clientId: string;
  providerId: string;
  packageName: string;
  amountMinor: number;
  currency: string;
  scheduledDate?: string | null;
  status: string;
  deliverablesNote?: string | null;
  createdAt: string;
  client?: PublicProfile;
  provider?: PublicProfile;
  service?: {
    title: string;
    slug: string;
  } | null;
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base}-${suffix}`;
}

export async function createService(
  db: Db,
  providerId: string,
  input: CreateServiceInput,
): Promise<ServiceRecord> {
  const slug = generateSlug(input.title);
  const basePriceMinor = toMinorUnits(input.basePriceMajor, input.currency);

  const formattedPackages = (input.packages || []).map((pkg) => ({
    name: pkg.name,
    priceMinor: toMinorUnits(pkg.priceMajor, input.currency),
    timeline: pkg.timeline,
    deliverables: pkg.deliverables || null,
  }));

  const { data, error } = await db
    .from("services")
    .insert({
      provider_id: providerId,
      category_slug: input.categorySlug,
      title: input.title,
      slug,
      description: input.description,
      pricing_model: input.pricingModel,
      base_price_minor: basePriceMinor,
      currency: input.currency,
      delivery_type: input.deliveryType,
      city: input.city || null,
      country: input.country,
      packages: formattedPackages,
      status: "active",
    })
    .select(`
      *,
      provider:profiles!provider_id(${PUBLIC_PROFILE})
    `)
    .single();

  if (error) throw new Error(`Failed to create service: ${error.message}`);

  const prov = Array.isArray(data.provider) ? data.provider[0] : data.provider;

  return {
    id: data.id,
    providerId: data.provider_id,
    categorySlug: data.category_slug,
    title: data.title,
    slug: data.slug,
    description: data.description,
    pricingModel: data.pricing_model,
    basePriceMinor: Number(data.base_price_minor),
    currency: data.currency,
    deliveryType: data.delivery_type,
    city: data.city,
    country: data.country,
    packages: data.packages || [],
    status: data.status,
    createdAt: data.created_at,
    provider: prov ? {
      id: prov.id,
      username: prov.username,
      displayName: prov.display_name,
      rating: Number(prov.rating || 5.0),
      reviewsCount: Number(prov.reviews_count || 0),
      verified: Boolean(prov.is_verified),
    } : undefined,
  };
}

export async function getServiceBySlug(db: Db, slug: string): Promise<ServiceRecord | null> {
  const { data, error } = await db
    .from("services")
    .select(`
      *,
      provider:profiles!provider_id(${PUBLIC_PROFILE})
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    // Fallback try UUID id
    const { data: byId } = await db
      .from("services")
      .select(`
        *,
        provider:profiles!provider_id(${PUBLIC_PROFILE})
      `)
      .eq("id", slug)
      .maybeSingle();
    if (!byId) return null;
    const p = Array.isArray(byId.provider) ? byId.provider[0] : byId.provider;
    return {
      id: byId.id,
      providerId: byId.provider_id,
      categorySlug: byId.category_slug,
      title: byId.title,
      slug: byId.slug,
      description: byId.description,
      pricingModel: byId.pricing_model,
      basePriceMinor: Number(byId.base_price_minor),
      currency: byId.currency,
      deliveryType: byId.delivery_type,
      city: byId.city,
      country: byId.country,
      packages: byId.packages || [],
      status: byId.status,
      createdAt: byId.created_at,
      provider: p ? {
        id: p.id,
        username: p.username,
        displayName: p.display_name,
        rating: Number(p.rating || 5.0),
        reviewsCount: Number(p.reviews_count || 0),
        verified: Boolean(p.is_verified),
      } : undefined,
    };
  }

  const prov = Array.isArray(data.provider) ? data.provider[0] : data.provider;
  return {
    id: data.id,
    providerId: data.provider_id,
    categorySlug: data.category_slug,
    title: data.title,
    slug: data.slug,
    description: data.description,
    pricingModel: data.pricing_model,
    basePriceMinor: Number(data.base_price_minor),
    currency: data.currency,
    deliveryType: data.delivery_type,
    city: data.city,
    country: data.country,
    packages: data.packages || [],
    status: data.status,
    createdAt: data.created_at,
    provider: prov ? {
      id: prov.id,
      username: prov.username,
      displayName: prov.display_name,
      rating: Number(prov.rating || 5.0),
      reviewsCount: Number(prov.reviews_count || 0),
      verified: Boolean(prov.is_verified),
    } : undefined,
  };
}

export async function getServiceById(db: Db, id: string): Promise<ServiceRecord | null> {
  return getServiceBySlug(db, id);
}

export async function listServices(
  db: Db,
  params: { categorySlug?: string; city?: string; q?: string; page?: number; limit?: number } = {},
): Promise<{ services: ServiceRecord[]; total: number }> {
  let query = db
    .from("services")
    .select(`
      *,
      provider:profiles!provider_id(${PUBLIC_PROFILE})
    `, { count: "exact" })
    .eq("status", "active");

  if (params.q) {
    query = query.or(`title.ilike.${likePattern(params.q)},description.ilike.${likePattern(params.q)}`);
  }
  if (params.categorySlug && params.categorySlug !== "all") {
    query = query.eq("category_slug", params.categorySlug);
  }
  if (params.city && params.city !== "all") {
    query = query.ilike("city", `%${params.city}%`);
  }

  query = query.order("created_at", { ascending: false });

  const limit = params.limit || 20;
  const page = params.page || 1;
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Could not load services: ${error.message}`);

  const services = (data || []).map((row: any) => {
    const prov = Array.isArray(row.provider) ? row.provider[0] : row.provider;
    return {
      id: row.id,
      providerId: row.provider_id,
      categorySlug: row.category_slug,
      title: row.title,
      slug: row.slug,
      description: row.description,
      pricingModel: row.pricing_model,
      basePriceMinor: Number(row.base_price_minor),
      currency: row.currency,
      deliveryType: row.delivery_type,
      city: row.city,
      country: row.country,
      packages: row.packages || [],
      status: row.status,
      createdAt: row.created_at,
      provider: prov ? {
        id: prov.id,
        username: prov.username,
        displayName: prov.display_name,
        rating: Number(prov.rating || 5.0),
        reviewsCount: Number(prov.reviews_count || 0),
        verified: Boolean(prov.is_verified),
      } : undefined,
    };
  });

  return { services, total: count || 0 };
}

export async function createServiceBooking(
  db: Db,
  clientId: string,
  providerId: string,
  input: CreateServiceBookingInput,
): Promise<ServiceBookingRecord> {
  const bookingNumber = `SB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  const amountMinor = toMinorUnits(input.amountMajor, input.currency);

  const { data, error } = await db
    .from("service_bookings")
    .insert({
      booking_number: bookingNumber,
      service_id: input.serviceId,
      client_id: clientId,
      provider_id: providerId,
      package_name: input.packageName,
      amount_minor: amountMinor,
      currency: input.currency,
      scheduled_date: input.scheduledDate || null,
      deliverables_note: input.deliverablesNote || null,
      status: "pending",
    })
    .select(`
      *,
      service:services(title, slug)
    `)
    .single();

  if (error) throw new Error(`Failed to create service booking: ${error.message}`);

  const serv = Array.isArray(data.service) ? data.service[0] : data.service;

  return {
    id: data.id,
    bookingNumber: data.booking_number,
    serviceId: data.service_id,
    clientId: data.client_id,
    providerId: data.provider_id,
    packageName: data.package_name,
    amountMinor: Number(data.amount_minor),
    currency: data.currency,
    scheduledDate: data.scheduled_date,
    status: data.status,
    deliverablesNote: data.deliverables_note,
    createdAt: data.created_at,
    service: serv ? { title: serv.title, slug: serv.slug } : null,
  };
}

export async function listBookingsForUser(
  db: Db,
  userId: string,
  role: "client" | "provider" | "all" = "all",
): Promise<ServiceBookingRecord[]> {
  let query = db
    .from("service_bookings")
    .select(`
      *,
      client:profiles!client_id(${PUBLIC_PROFILE}),
      provider:profiles!provider_id(${PUBLIC_PROFILE}),
      service:services(title, slug)
    `)
    .order("created_at", { ascending: false });

  if (role === "client") {
    query = query.eq("client_id", userId);
  } else if (role === "provider") {
    query = query.eq("provider_id", userId);
  } else {
    query = query.or(`client_id.eq.${userId},provider_id.eq.${userId}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load bookings: ${error.message}`);

  return (data || []).map((row: any) => {
    const cl = Array.isArray(row.client) ? row.client[0] : row.client;
    const pr = Array.isArray(row.provider) ? row.provider[0] : row.provider;
    const serv = Array.isArray(row.service) ? row.service[0] : row.service;

    return {
      id: row.id,
      bookingNumber: row.booking_number,
      serviceId: row.service_id,
      clientId: row.client_id,
      providerId: row.provider_id,
      packageName: row.package_name,
      amountMinor: Number(row.amount_minor),
      currency: row.currency,
      scheduledDate: row.scheduled_date,
      status: row.status,
      deliverablesNote: row.deliverables_note,
      createdAt: row.created_at,
      client: cl ? {
        id: cl.id,
        username: cl.username,
        displayName: cl.display_name,
        rating: Number(cl.rating || 5.0),
        reviewsCount: Number(cl.reviews_count || 0),
        verified: Boolean(cl.is_verified),
      } : undefined,
      provider: pr ? {
        id: pr.id,
        username: pr.username,
        displayName: pr.display_name,
        rating: Number(pr.rating || 5.0),
        reviewsCount: Number(pr.reviews_count || 0),
        verified: Boolean(pr.is_verified),
      } : undefined,
      service: serv ? { title: serv.title, slug: serv.slug } : null,
    };
  });
}
