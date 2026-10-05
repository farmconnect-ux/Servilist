/**
 * Which parts of the app are open.
 *
 * Code for later sprints exists in the repository before it has been verified
 * against the database and its access rules. Until a sprint is verified, its
 * pages and endpoints answer "not found". This is an allow-list on purpose:
 * anything new is closed until someone opens it here.
 */

/** Open exactly at this path. */
const EXACT = new Set(["/", "/dashboard", "/admin"]);

/** Open at this path and everything beneath it. */
const PREFIXES = [
  // Sprint 1: accounts, roles, shells
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/dashboard/settings",
  "/admin/users",
  "/admin/audit-logs",
  "/api/v1/health",
  "/api/v1/me",
  // Sprint 2: categories, listings, search, seller profiles
  "/search",
  "/categories",
  "/products",
  "/seller",
  "/sell",
  "/api/v1/categories",
  "/api/v1/listings",
  "/api/v1/users",
  // Sprint 3: buyer requests and quotes, offers on listings, messages
  "/requests",
  "/dashboard/requests",
  "/dashboard/offers",
  "/dashboard/messages",
  "/api/v1/requests",
  "/api/v1/offers",
  "/api/v1/conversations",
];

export function isReleased(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (EXACT.has(path)) return true;
  return PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
