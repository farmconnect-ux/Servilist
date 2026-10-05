/**
 * Pages that need a signed-in member. Visitors are sent to sign in before the
 * page loads; each page and action still checks the session itself.
 */
const PROTECTED = ["/dashboard", "/admin", "/requests/new", "/checkout", "/design-system", "/sell", "/services/new"];

/** Matches a path or anything beneath it, never a look-alike such as /seller for /sell. */
export function requiresSignIn(pathname: string): boolean {
  return PROTECTED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
