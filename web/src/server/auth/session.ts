import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createDb } from "@/lib/db/server";
import { can, type Access, type AccountStatus, type Permission } from "@/server/policies/access";

export interface SessionUser extends Access {
  email: string | null;
  displayName: string;
  username: string;
}

/**
 * The signed-in member for this request, verified with the auth server (not
 * read from the cookie alone), with roles and permissions from the database.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const db = await createDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: access }] = await Promise.all([
    db.from("profiles").select("username, display_name, status").eq("id", user.id).maybeSingle(),
    db.rpc("my_access").maybeSingle<{ roles: string[]; permissions: string[] }>(),
  ]);

  return {
    userId: user.id,
    email: user.email ?? null,
    displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "Member",
    username: profile?.username ?? "",
    status: (profile?.status as AccountStatus | undefined) ?? "active",
    roles: access?.roles ?? [],
    permissions: access?.permissions ?? [],
  };
});

/** For private pages and actions: returns the member or sends the visitor to sign in. */
export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/**
 * For admin pages and actions. A member without the permission gets the same
 * "not found" page as a wrong address, so the admin area is not advertised.
 */
export async function requirePermission(
  permission: Permission,
  next = "/admin",
): Promise<SessionUser> {
  const user = await requireUser(next);
  if (!can(user, permission)) notFound();
  return user;
}
