import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { getSessionUser } from "@/server/auth/session";
import { can } from "@/server/policies/access";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 group" aria-label="Servilist Home">
      <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xl shadow-xs transition-transform group-hover:scale-105">
        S
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-extrabold tracking-tight text-zinc-900 group-hover:text-emerald-700 leading-none">
          Servilist
        </span>
        <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase leading-none mt-0.5">
          Marketplace & Escrow
        </span>
      </div>
    </Link>
  );
}

/** Top utility bar for desktop */
export function TopUtilityBar() {
  return (
    <div className="hidden border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-600 md:block">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-medium text-zinc-700">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Pan-African Marketplace
          </span>
          <span className="text-zinc-300">|</span>
          <Link href="/requests" className="hover:text-emerald-700 transition">
            Reverse Marketplace: Post what you can&apos;t find
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/safety" className="hover:text-emerald-700 transition">
            Safety Tips
          </Link>
          <Link href="/escrow" className="hover:text-emerald-700 transition">
            Escrow Protection
          </Link>
          <Link href="/design-system" className="font-semibold text-emerald-700 hover:underline">
            UI Design System
          </Link>
          <span className="text-zinc-300">|</span>
          <span className="font-semibold text-zinc-700">NGN (₦)</span>
        </div>
      </div>
    </div>
  );
}

/** Mobile Sticky Bottom Navigation */
export function MobileBottomNav({ user }: { user: unknown }) {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-zinc-200 bg-white/95 backdrop-blur-md md:hidden"
    >
      <Link
        href="/"
        className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-emerald-700"
      >
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
        <span>Home</span>
      </Link>

      <Link
        href="/search"
        className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-emerald-700"
      >
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <span>Explore</span>
      </Link>

      {/* Standout Center + SELL Button */}
      <Link
        href="/sell"
        className="flex -translate-y-3 flex-col items-center justify-center"
        aria-label="Sell or List Item"
      >
        <div className="flex size-13 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg ring-4 ring-white hover:bg-emerald-700 transition">
          <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <span className="text-[10px] font-extrabold text-emerald-700 mt-1">SELL</span>
      </Link>

      <Link
        href="/requests"
        className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-emerald-700"
      >
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
          />
        </svg>
        <span>Requests</span>
      </Link>

      <Link
        href={user ? "/dashboard" : "/login"}
        className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-emerald-700"
      >
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
        <span>{user ? "Account" : "Sign In"}</span>
      </Link>
    </nav>
  );
}

/** Global navigation header. Supports desktop and mobile responsive layout. */
export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <>
      <TopUtilityBar />
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Brand />

          {/* Center Category & Mode Links (Desktop) */}
          <nav aria-label="Main" className="hidden lg:flex items-center gap-6 text-sm font-semibold text-zinc-700">
            <Link href="/categories" className="hover:text-emerald-700 transition">
              Categories
            </Link>
            <Link href="/services" className="hover:text-emerald-700 transition">
              Services
            </Link>
            <Link
              href="/requests"
              className="flex items-center gap-1.5 hover:text-emerald-700 transition"
            >
              <span>Buyer Requests</span>
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                Demand
              </span>
            </Link>
            <Link
              href="/auctions"
              className="flex items-center gap-1.5 hover:text-amber-600 transition"
            >
              <span>Live Auctions</span>
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
            </Link>
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {can(user, "admin.access") && (
                  <ButtonLink href="/admin" variant="outline" size="sm">
                    Admin
                  </ButtonLink>
                )}
                <ButtonLink href="/dashboard" variant="ghost" size="sm">
                  Dashboard
                </ButtonLink>
                <ButtonLink href="/dashboard/seller" variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Seller Hub
                </ButtonLink>
                <form action={signOutAction} className="hidden sm:inline">
                  <button
                    type="submit"
                    className="min-h-9 rounded-md px-3 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 cursor-pointer"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="sm">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/register" variant="outline" size="sm" className="hidden sm:inline-flex">
                  Create account
                </ButtonLink>
              </>
            )}

            {/* Standout Prominent + SELL CTA Button */}
            <ButtonLink
              href="/sell"
              variant="primary"
              size="sm"
              className="shadow-sm font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Sell</span>
            </ButtonLink>
          </div>
        </div>
      </header>
      <MobileBottomNav user={user} />
    </>
  );
}

/** Rich Multi-Column Footer */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white pb-20 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand Info */}
          <div className="col-span-2 flex flex-col gap-4">
            <Brand />
            <p className="max-w-sm text-sm text-zinc-500 leading-relaxed">
              Pan-African marketplace combining supply-led trade and demand-led buyer requests with
              automated escrow settlements and verified logistics.
            </p>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500" />
                Double-Entry Escrow
              </span>
              <span>•</span>
              <span>CAC & National ID Verified</span>
            </div>
          </div>

          {/* Column 1: Marketplace Modes */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold tracking-wider text-zinc-900 uppercase">Marketplace</p>
            <ul className="flex flex-col gap-2 text-sm text-zinc-600">
              <li>
                <Link href="/#listings" className="hover:text-emerald-700">
                  Buy Products
                </Link>
              </li>
              <li>
                <Link href="/sell" className="hover:text-emerald-700 font-medium text-emerald-700">
                  + Sell an Item
                </Link>
              </li>
              <li>
                <Link href="/requests" className="hover:text-emerald-700">
                  Buyer Requests (Reverse)
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-emerald-700">
                  Hire Services
                </Link>
              </li>
              <li>
                <Link href="/auctions" className="hover:text-amber-600">
                  Live Auctions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Trust & Safety */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold tracking-wider text-zinc-900 uppercase">Trust & Escrow</p>
            <ul className="flex flex-col gap-2 text-sm text-zinc-600">
              <li>
                <Link href="/escrow" className="hover:text-emerald-700">
                  Escrow Guarantee
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-emerald-700">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link href="/verification" className="hover:text-emerald-700">
                  Vendor Verification
                </Link>
              </li>
              <li>
                <Link href="/disputes" className="hover:text-emerald-700">
                  Dispute Resolution
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Legal */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold tracking-wider text-zinc-900 uppercase">Company & Legal</p>
            <ul className="flex flex-col gap-2 text-sm text-zinc-600">
              <li>
                <Link href="/design-system" className="hover:text-emerald-700 font-semibold text-emerald-700">
                  Design System Spec
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-700">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-emerald-700">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-700">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 sm:flex-row text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Servilist Technologies. All rights reserved.</p>
          <p>Always inspect goods and confirm OTP delivery before releasing escrow funds.</p>
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
    <nav aria-label={label} className="flex gap-1 overflow-x-auto md:flex-col pb-2 md:pb-0">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="min-h-10 shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
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
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[240px_1fr]">
      <aside className="md:sticky md:top-24 md:self-start border-b md:border-b-0 pb-4 md:pb-0 border-zinc-200">
        <p className="px-3.5 pb-2.5 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
          {title}
        </p>
        <SectionNav label={navLabel} items={items} />
      </aside>
      <main className="flex min-w-0 flex-col gap-6">{children}</main>
    </div>
  );
}
