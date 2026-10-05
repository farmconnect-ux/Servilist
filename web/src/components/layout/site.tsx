import Link from "next/link";
import {
  ClipboardList,
  Home,
  LayoutGrid,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { isReleased } from "@/lib/release";
import { getSessionUser } from "@/server/auth/session";
import { can } from "@/server/policies/access";

/**
 * Global navigation (docs/UI_UX_SPEC.md sections 9 and 10).
 *
 * Every link here is filtered through the release list, so navigation never
 * points at a page that is not open yet.
 */

const PAGE = "mx-auto w-full max-w-7xl px-4 md:px-5 lg:px-6";

export function Brand() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Servilist home">
      <span className="flex size-9 items-center justify-center rounded-input bg-primary-600 text-lg font-bold text-white">
        S
      </span>
      <span className="text-xl font-bold tracking-tight text-ink">Servilist</span>
    </Link>
  );
}

interface NavLink {
  href: string;
  label: string;
}

function open(links: NavLink[]): NavLink[] {
  return links.filter((link) => isReleased(link.href.split("?")[0]!.split("#")[0]!));
}

const MAIN_LINKS: NavLink[] = [
  { href: "/categories", label: "Categories" },
  { href: "/search", label: "Buy" },
  { href: "/services", label: "Services" },
  { href: "/requests", label: "Requests" },
  { href: "/auctions", label: "Auctions" },
];

/** Section 9: the 36px utility bar. Desktop only. */
function TopUtilityBar() {
  const links = open([
    { href: "/help", label: "Help" },
    { href: "/safety", label: "Safety" },
    { href: "/sell", label: "Sell on Servilist" },
  ]);
  return (
    <div className="hidden border-b border-line bg-surface-muted text-xs text-ink-soft md:block">
      <div className={`${PAGE} flex h-9 items-center justify-between`}>
        <p>Buy, sell and request across Africa</p>
        <nav aria-label="Utility" className="flex items-center gap-5">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary-700">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

/** The search field is the most prominent element of the header (section 9). */
function HeaderSearch({ id }: { id: string }) {
  return (
    <form action="/search" method="get" role="search" className="flex min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        Search products, services or requests
      </label>
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-l-input border border-r-0 border-line-strong bg-surface px-3 focus-within:border-primary-600">
        <Search className="size-5 shrink-0 text-muted" aria-hidden="true" />
        <input
          id={id}
          name="q"
          type="search"
          maxLength={80}
          placeholder="Search products, services or requests..."
          className="min-h-11 w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="min-h-11 shrink-0 rounded-r-input bg-primary-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
      >
        Search
      </button>
    </form>
  );
}

/** Section 10: fixed bottom navigation on mobile, with Sell standing out. */
function MobileBottomNav({ signedIn }: { signedIn: boolean }) {
  const item =
    "flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-ink-soft hover:text-primary-700";
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-line bg-surface md:hidden"
    >
      <Link href="/" className={item}>
        <Home className="size-5" aria-hidden="true" />
        Home
      </Link>
      <Link href="/search" className={item}>
        <Search className="size-5" aria-hidden="true" />
        Search
      </Link>
      <Link
        href="/sell"
        className="flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-primary-700"
      >
        <span className="-mt-5 flex size-12 items-center justify-center rounded-pill bg-primary-600 text-white shadow-md ring-4 ring-surface">
          <Plus className="size-6" aria-hidden="true" />
        </span>
        Sell
      </Link>
      {isReleased("/requests") ? (
        <Link href="/requests" className={item}>
          <ClipboardList className="size-5" aria-hidden="true" />
          Requests
        </Link>
      ) : null}
      <Link href={signedIn ? "/dashboard" : "/login"} className={item}>
        <User className="size-5" aria-hidden="true" />
        {signedIn ? "Account" : "Sign in"}
      </Link>
    </nav>
  );
}

export async function SiteHeader() {
  const user = await getSessionUser();
  const mainLinks = open(MAIN_LINKS);

  return (
    <>
      <TopUtilityBar />
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        {/* Desktop and tablet: 72px main header */}
        <div className={`${PAGE} hidden h-18 items-center gap-6 md:flex`}>
          <Brand />
          <HeaderSearch id="header-search" />
          <div className="flex shrink-0 items-center gap-1">
            {user ? (
              <>
                {isReleased("/dashboard/messages") ? (
                  <ButtonLink href="/dashboard/messages" variant="ghost" size="sm">
                    <MessageSquare className="size-4" aria-hidden="true" />
                    Messages
                  </ButtonLink>
                ) : null}
                <ButtonLink href="/dashboard" variant="ghost" size="sm">
                  <User className="size-4" aria-hidden="true" />
                  Account
                </ButtonLink>
                {can(user, "admin.access") ? (
                  <ButtonLink href="/admin" variant="ghost" size="sm">
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    Admin
                  </ButtonLink>
                ) : null}
              </>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="sm">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/register" variant="secondary" size="sm">
                  Create account
                </ButtonLink>
              </>
            )}
            <ButtonLink href="/sell" size="sm" className="ml-2">
              <Plus className="size-4" aria-hidden="true" />
              Sell
            </ButtonLink>
          </div>
        </div>

        {/* Desktop: section links */}
        <div className="hidden border-t border-line md:block">
          <nav aria-label="Main" className={`${PAGE} flex h-11 items-center gap-6 text-sm`}>
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 font-medium text-ink-soft hover:text-primary-700"
              >
                {link.href === "/categories" ? (
                  <LayoutGrid className="size-4" aria-hidden="true" />
                ) : null}
                {link.label}
              </Link>
            ))}
            {user ? (
              <form action={signOutAction} className="ml-auto">
                <button
                  type="submit"
                  className="min-h-11 cursor-pointer text-sm font-medium text-muted hover:text-ink"
                >
                  Sign out
                </button>
              </form>
            ) : null}
          </nav>
        </div>

        {/* Mobile: logo and account, then search */}
        <div className="md:hidden">
          <div className={`${PAGE} flex h-14 items-center justify-between`}>
            <Brand />
            <Link
              href={user ? "/dashboard" : "/login"}
              className="flex size-11 items-center justify-center rounded-input text-ink-soft hover:bg-surface-muted"
              aria-label={user ? "Your account" : "Sign in"}
            >
              <User className="size-5" aria-hidden="true" />
            </Link>
          </div>
          <div className={`${PAGE} pb-3`}>
            <HeaderSearch id="header-search-mobile" />
          </div>
        </div>
      </header>
      <MobileBottomNav signedIn={Boolean(user)} />
    </>
  );
}

export function SiteFooter() {
  const columns: { title: string; links: NavLink[] }[] = [
    {
      title: "Buy",
      links: open([
        { href: "/search", label: "Browse listings" },
        { href: "/categories", label: "Categories" },
        { href: "/services", label: "Services" },
        { href: "/auctions", label: "Auctions" },
      ]),
    },
    {
      title: "Sell",
      links: open([
        { href: "/sell", label: "List an item" },
        { href: "/services/new", label: "Offer a service" },
        { href: "/dashboard/offers", label: "Offers" },
        { href: "/dashboard/orders", label: "Orders" },
      ]),
    },
    {
      title: "Request",
      links: open([
        { href: "/requests", label: "Browse requests" },
        { href: "/requests/new", label: "Post a request" },
        { href: "/dashboard/requests", label: "My requests" },
      ]),
    },
    {
      title: "Account",
      links: open([
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/messages", label: "Messages" },
        { href: "/dashboard/settings", label: "Profile and settings" },
      ]),
    },
  ].filter((column) => column.links.length > 0);

  return (
    // Bottom padding leaves room for the fixed mobile navigation
    <footer className="mt-auto border-t border-line bg-surface pb-20 md:pb-0">
      <div className={`${PAGE} py-12`}>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Brand />
            <p className="mt-3 max-w-xs text-sm text-muted">
              Buy what you need. Sell what you have. Request what you cannot find.
            </p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold text-ink">{column.title}</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-primary-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Servilist. Meet in public places and check the item before you pay.</p>
          <p>Prices are shown in the seller&apos;s own currency.</p>
        </div>
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
    <nav aria-label={label} className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:pb-0">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex min-h-11 shrink-0 items-center rounded-input px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-primary-50 hover:text-primary-800"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** Section 61: sidebar and content on desktop, top navigation and content on mobile. */
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
    <div className={`${PAGE} grid gap-8 py-8 md:grid-cols-[240px_1fr]`}>
      <aside className="border-b border-line pb-4 md:sticky md:top-36 md:self-start md:border-b-0 md:pb-0">
        <p className="px-3 pb-2 text-xs font-semibold text-muted">{title}</p>
        <SectionNav label={navLabel} items={items} />
      </aside>
      <main className="flex min-w-0 flex-col gap-6 pb-8">{children}</main>
    </div>
  );
}
