import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** Session cookies are never readable from page scripts. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax" as const,
    path: "/",
  };
}

/**
 * Database client for the current request, acting as the signed-in member (or
 * as an anonymous visitor). Row-level security applies to everything it does.
 */
export async function createDb() {
  const store = await cookies();

  return createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookieOptions: sessionCookieOptions(),
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) =>
            store.set(name, value, { ...options, ...sessionCookieOptions() }),
          );
        } catch {
          // Server Components cannot write cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}

export type Db = Awaited<ReturnType<typeof createDb>>;
