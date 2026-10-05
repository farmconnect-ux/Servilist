import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublishableKey, supabaseUrl } from "@/lib/public-config";
import { isReleased } from "@/lib/release";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/requests/new", "/checkout", "/design-system"];

/**
 * Keeps the session cookie fresh and sends signed-out visitors away from
 * private areas early. This is a convenience only: every private page and
 * action checks the session and permissions again on the server.
 */
export async function proxy(request: NextRequest) {
  // Unverified sprints stay closed: their pages and endpoints answer "not found"
  if (!isReleased(request.nextUrl.pathname)) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "not_found", message: "Not found." } },
        { status: 404 },
      );
    }
    const missing = request.nextUrl.clone();
    missing.pathname = "/_closed";
    return NextResponse.rewrite(missing, { status: 404 });
  }

  let response = NextResponse.next({ request });

  const url = supabaseUrl();
  const key = supabasePublishableKey();

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  const supabase = createServerClient(url, key, {
    cookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { ...options, ...cookieOptions }),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  if (!user && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
