/**
 * Authorisation policies (master spec section 70): role, resource, ownership.
 *
 * These functions are pure. The roles and permissions they receive come from
 * the database for the signed-in member, never from the browser, and the
 * database enforces the same rules again through row-level security.
 */

export const PERMISSIONS = [
  "admin.access",
  "users.read",
  "users.manage",
  "roles.manage",
  "listings.moderate",
  "requests.moderate",
  "reviews.moderate",
  "reports.manage",
  "disputes.manage",
  "orders.read",
  "orders.manage",
  "payments.read",
  "payments.manage",
  "payouts.manage",
  "categories.manage",
  "verifications.manage",
  "settings.manage",
  "audit.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type AccountStatus = "active" | "suspended" | "banned" | "pending_verification" | "deleted";

export interface Access {
  userId: string;
  status: AccountStatus;
  roles: readonly string[];
  permissions: readonly string[];
}

/** Role level: does this member hold the permission at all? */
export function can(access: Access | null, permission: Permission): boolean {
  if (!access || access.status !== "active") return false;
  return access.permissions.includes(permission);
}

/** Ownership level: is this the member's own record? */
export function owns(access: Access | null, ownerId: string | null | undefined): boolean {
  return !!access && !!ownerId && access.userId === ownerId;
}

/**
 * Resource level: a member may change their own record while their account is
 * active; anyone else needs the moderation permission for that resource.
 */
export function canManage(
  access: Access | null,
  resource: { ownerId: string | null | undefined; moderatePermission: Permission },
): boolean {
  if (!access || access.status !== "active") return false;
  return owns(access, resource.ownerId) || can(access, resource.moderatePermission);
}

/** Members who are suspended or banned keep read access but cannot post or trade. */
export function canParticipate(access: Access | null): boolean {
  return !!access && access.status === "active";
}
