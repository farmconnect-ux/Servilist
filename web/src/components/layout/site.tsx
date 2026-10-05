import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { getSessionUser } from "@/server/auth/session";
import { can } from "@/server/policies/access";

export function Brand() {
  return (
    <Link href="/" className="text-2xl font-extrabold text-brand" aria-label="Servilist home">
      Servilist
    </Link>
  );
}

/** Global navigation. What it shows depends on the session, checked on the server. */
export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
        <Brand />
        <nav aria-label="Main" className="flex flex-wrap items-center gap-1 text-sm font-semibold">
          {user ? (
            <>
              {can(user, "admin.access") ? (
                <ButtonLink href="/admin" variant="ghost">
                  Admin
                </ButtonLink>
              ) : null}
              <ButtonLink href="/dashboard" variant="ghost">
                Dashboard
              </ButtonLink>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="min-h-11 rounded-control px-4 text-sm font-bold text-muted hover:bg-page"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost">
                Sign in
              </ButtonLink>
              <ButtonLink href="/register">Create account</ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-extrabold text-brand">Servilist</span> · Buy, sell and request
          across Africa.
        </p>
        <p>Meet in public places and check the item before you pay.</p>
      </div>
    </footer>
  );
}

export interface NavItem {
  href: string;
  label: string;
}

/** Section navigation for the dashboard and admin shells. */
export function SectionNav({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <nav aria-label={label} className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="min-h-11 shrink-0 rounded-control px-4 py-3 text-sm font-semibold text-ink hover:bg-brand-soft hover:text-brand-strong"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function Shell({
  title,
  navLabel,
  items,
  children,
}: {
  title: string;
  navLabel: string;
  items: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <p className="px-4 pb-2 text-[11px] font-bold tracking-wide text-muted uppercase">
          {title}
        </p>
        <SectionNav label={navLabel} items={items} />
      </aside>
      <main className="flex min-w-0 flex-col gap-6">{children}</main>
    </div>
  );
}
