import "server-only";
import type { Db } from "@/lib/db/server";
import type { AccountStatus } from "@/server/policies/access";

export interface OwnProfile {
  displayName: string;
  username: string;
  city: string;
  country: string;
  bio: string;
}

export async function getOwnProfile(db: Db, userId: string): Promise<OwnProfile | null> {
  const { data } = await db
    .from("profiles")
    .select("display_name, username, city, country, bio")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    displayName: data.display_name ?? "",
    username: data.username ?? "",
    city: data.city ?? "",
    country: data.country ?? "",
    bio: data.bio ?? "",
  };
}

export async function updateOwnProfile(
  db: Db,
  userId: string,
  values: { displayName: string; city: string; country: string; bio: string },
): Promise<void> {
  const { error } = await db
    .from("profiles")
    .update({
      display_name: values.displayName,
      city: values.city || null,
      country: values.country || null,
      bio: values.bio || null,
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

type CountQuery = ReturnType<ReturnType<Db["from"]>["select"]>;

async function count(
  db: Db,
  table: string,
  filter: (query: CountQuery) => CountQuery = (query) => query,
): Promise<number> {
  const { count: total, error } = await filter(
    db.from(table).select("id", { count: "exact", head: true }),
  );
  if (error) throw new Error(`Could not count ${table}: ${error.message}`);
  return total ?? 0;
}

/** Supabase returns a joined row as an object or a one-item array depending on the relation. */
function joined<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export interface MemberActivity {
  listings: number;
  requests: number;
  orders: number;
  conversations: number;
}

/** What the member has on the marketplace today; row-level security scopes orders and messages. */
export async function getMemberActivity(db: Db, userId: string): Promise<MemberActivity> {
  const [listings, requests, orders, messages] = await Promise.all([
    count(db, "listings", (q) => q.eq("seller_id", userId).eq("status", "active")),
    count(db, "buyer_requests", (q) => q.eq("buyer_id", userId).eq("status", "open")),
    count(db, "escrow_orders"),
    count(db, "messages"),
  ]);
  return { listings, requests, orders, conversations: messages };
}

export interface PlatformOverview {
  members: number;
  suspended: number;
  activeListings: number;
  openRequests: number;
}

export async function getPlatformOverview(db: Db): Promise<PlatformOverview> {
  const [members, suspended, activeListings, openRequests] = await Promise.all([
    count(db, "profiles"),
    count(db, "profiles", (q) => q.in("status", ["suspended", "banned"])),
    count(db, "listings", (q) => q.eq("status", "active")),
    count(db, "buyer_requests", (q) => q.eq("status", "open")),
  ]);
  return { members, suspended, activeListings, openRequests };
}

export interface MemberRow {
  id: string;
  displayName: string;
  username: string;
  status: AccountStatus;
  city: string | null;
  joinedAt: string;
  roles: string[];
}

export async function listMembers(db: Db, limit = 100): Promise<MemberRow[]> {
  const { data, error } = await db
    .from("profiles")
    .select("id, display_name, username, status, city, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load members: ${error.message}`);

  const ids = (data ?? []).map((row) => row.id as string);
  const { data: roleRows } = ids.length
    ? await db.from("user_roles").select("user_id, role:roles(key)").in("user_id", ids)
    : { data: [] };

  const rolesByUser = new Map<string, string[]>();
  type RoleRow = { user_id: string; role: { key: string } | { key: string }[] | null };
  ((roleRows ?? []) as RoleRow[]).forEach((row) => {
    const key = joined(row.role)?.key;
    if (!key) return;
    rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), key]);
  });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    displayName: (row.display_name as string) ?? "",
    username: (row.username as string) ?? "",
    status: row.status as AccountStatus,
    city: (row.city as string | null) ?? null,
    joinedAt: row.created_at as string,
    roles: rolesByUser.get(row.id as string) ?? [],
  }));
}

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  actorName: string;
}

export async function listAuditLog(db: Db, limit = 100): Promise<AuditEntry[]> {
  const { data, error } = await db
    .from("audit_logs")
    .select(
      "id, action, entity_type, entity_id, metadata, created_at, actor:profiles!actor_id(display_name)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load the audit log: ${error.message}`);

  type AuditRow = {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    actor: { display_name: string } | { display_name: string }[] | null;
  };
  return ((data ?? []) as AuditRow[]).map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    actorName: joined(row.actor)?.display_name ?? "System",
  }));
}
