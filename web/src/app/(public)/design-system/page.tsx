import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, Card, Metric, EmptyState, VerifiedBadge } from "@/components/ui/card";
import { Input, Textarea, Select, Field, Alert } from "@/components/ui/form";
import { ListingCard, RequestCard, AuctionCard, SearchBar, PriceDisplay } from "@/components/marketplace/cards";

export const metadata = {
  title: "Design System & UI Tokens · Servilist",
  description:
    "Production UI/UX Design System Specification for Servilist: Two-sided marketplace, classifieds, services, auctions, and buyer requests.",
};

const COLOR_GROUPS = [
  {
    name: "Primary Green Scale (Marketplace activity, trust, money, growth)",
    shades: [
      { name: "--primary-50", hex: "#f0fdf4", textDark: true },
      { name: "--primary-100", hex: "#dcfce7", textDark: true },
      { name: "--primary-200", hex: "#bbf7d0", textDark: true },
      { name: "--primary-300", hex: "#86efac", textDark: true },
      { name: "--primary-400", hex: "#4ade80", textDark: true },
      { name: "--primary-500", hex: "#22c55e", textDark: false },
      { name: "--primary-600 (Brand)", hex: "#16a34a", textDark: false },
      { name: "--primary-700", hex: "#15803d", textDark: false },
      { name: "--primary-800", hex: "#166534", textDark: false },
      { name: "--primary-900", hex: "#14532d", textDark: false },
    ],
  },
  {
    name: "Accent Amber Scale (Timed auctions, urgent requests, notifications)",
    shades: [
      { name: "--accent-50", hex: "#fffbeb", textDark: true },
      { name: "--accent-100", hex: "#fef3c7", textDark: true },
      { name: "--accent-200", hex: "#fde68a", textDark: true },
      { name: "--accent-500", hex: "#f59e0b", textDark: false },
      { name: "--accent-600", hex: "#d97706", textDark: false },
    ],
  },
  {
    name: "Neutral & Surface Scale (Warm off-white, cards, borders)",
    shades: [
      { name: "--background", hex: "#fafaf9", textDark: true },
      { name: "--surface", hex: "#ffffff", textDark: true },
      { name: "--surface-muted", hex: "#f5f5f4", textDark: true },
      { name: "--border", hex: "#e4e4e7", textDark: true },
      { name: "--border-strong", hex: "#d4d4d8", textDark: true },
      { name: "--text-primary", hex: "#18181b", textDark: false },
      { name: "--text-secondary", hex: "#52525b", textDark: false },
      { name: "--text-muted", hex: "#71717a", textDark: false },
    ],
  },
];

export default function DesignSystemPage() {
  const dummyListing = {
    id: "demo-listing-1",
    slug: "demo-iphone-15-pro-max",
    title: "Apple iPhone 15 Pro Max 256GB Natural Titanium (Mint Condition)",
    category: "Phones & Tablets",
    format: "buy_now" as const,
    currency: "NGN",
    amountMinor: 145000000,
    bidsCount: 0,
    auctionEndsAt: null,
    city: "Ikeja, Lagos",
    imageUrl: null,
    createdAt: new Date().toISOString(),
    seller: {
      id: "seller-1",
      username: "techhub_ikeja",
      displayName: "TechHub Ikeja Ltd",
      rating: 4.9,
      reviewsCount: 38,
      verified: true,
    },
  };

  const dummyRequest = {
    id: "demo-request-1",
    title: "Looking for Toyota Corolla 2018 Clean Title with Inspection Report",
    category: "Vehicles & Auto",
    requestType: "good" as const,
    currency: "NGN",
    budgetMinor: 850000000,
    urgency: "urgent",
    city: "Abuja, FCT",
    createdAt: new Date().toISOString(),
    buyer: {
      id: "buyer-1",
      username: "amina_k",
      displayName: "Amina K.",
      rating: 5.0,
      reviewsCount: 12,
      verified: true,
    },
  };

  const dummyAuction = {
    id: "demo-auction-1",
    title: "Sony PlayStation 5 Disc Edition + 2 DualSense Controllers & God of War",
    currentBidMinor: 62000000,
    bidsCount: 14,
    currency: "NGN",
    endsAt: new Date(Date.now() + 86400000).toISOString(),
    city: "Victoria Island, Lagos",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 space-y-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
          Source of Truth Specification
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
          Marketplace UI/UX Design System
        </h1>
        <p className="mt-2 text-base text-zinc-600 max-w-3xl">
          Specification-aligned design tokens, atomic components, and responsive screen templates for Servilist.
          Designed for high-trust African two-sided commerce: Supply-led trade, demand-led buyer requests,
          timed auctions, and milestone escrow.
        </p>
      </div>

      {/* 1. Core Marketplace Principles */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
          1. Core Marketplace Model & Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border-l-4 border-l-emerald-600 bg-white">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Supply Side (Traditional Commerce)
            </span>
            <h3 className="text-lg font-bold text-zinc-900 mt-1">
              Seller → Listing → Product / Service → Buyer
            </h3>
            <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
              Merchants create structured listings for products, professional services, or timed auctions.
              Buyers browse categories, search by keyword, filter by city, and purchase via direct escrow or OTP handover.
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-l-amber-500 bg-white">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Demand Side (Reverse Marketplace)
            </span>
            <h3 className="text-lg font-bold text-zinc-900 mt-1">
              Buyer → Request → Sellers Quote → Multi-Turn Offers → Buyer
            </h3>
            <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
              When buyers cannot find an item in catalog search, they post a Buyer Request specifying their target budget,
              urgency, and specs. Intelligent PostgreSQL tsvector matching alerts verified merchants to submit quotes.
            </p>
          </Card>
        </div>
      </section>

      {/* 2. Color System */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">2. Global Color Tokens</h2>
          <p className="text-xs text-zinc-500">
            Strictly bounded CSS custom properties configured in <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">globals.css</code>.
          </p>
        </div>

        <div className="space-y-6">
          {COLOR_GROUPS.map((group) => (
            <div key={group.name} className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{group.name}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
                {group.shades.map((shade) => (
                  <div
                    key={shade.name}
                    className="flex flex-col rounded-xl overflow-hidden border border-zinc-200 shadow-2xs"
                  >
                    <div
                      className="h-16 w-full flex items-center justify-center p-2 text-center"
                      style={{ backgroundColor: shade.hex }}
                    >
                      <span
                        className="text-[10px] font-mono font-bold"
                        style={{ color: shade.textDark ? "#18181b" : "#ffffff" }}
                      >
                        {shade.hex}
                      </span>
                    </div>
                    <div className="p-2 bg-white text-center">
                      <span className="text-[10px] font-semibold text-zinc-600 truncate block">
                        {shade.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Typography Scale */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">3. Typography Scale (Inter Font)</h2>
        <Card className="p-6 bg-white space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Hero Display (40-48px, Weight 800)</span>
            <p className="text-4xl sm:text-5xl font-black text-zinc-900 tracking-tight mt-1">
              BUY WHAT YOU NEED. SELL WHAT YOU HAVE.
            </p>
          </div>

          <div className="border-b border-zinc-100 pb-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Page Title H1 (28-32px, Weight 700)</span>
            <p className="text-3xl font-extrabold text-zinc-900 mt-1">
              Seller Hub & Multi-Vendor Merchant Dashboard
            </p>
          </div>

          <div className="border-b border-zinc-100 pb-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Section Title H2 (20-24px, Weight 700)</span>
            <p className="text-2xl font-bold text-zinc-900 mt-1">
              Active Buyer Demands Matching Your Inventory
            </p>
          </div>

          <div className="border-b border-zinc-100 pb-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Card Title H3 (15-16px, Weight 600)</span>
            <p className="text-base font-semibold text-zinc-900 mt-1">
              Apple iPhone 15 Pro Max 256GB Natural Titanium (Mint Condition)
            </p>
          </div>

          <div className="border-b border-zinc-100 pb-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Body Regular (14-15px, Weight 400)</span>
            <p className="text-sm text-zinc-600 mt-1 leading-relaxed max-w-2xl">
              When an order is created, the buyer deposits funds into the Servilist ledger. A cryptographic 6-digit handover OTP is generated for physical or courier handover.
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Price Display Scale (Emerald Bold Font)</span>
            <div className="flex flex-wrap items-baseline gap-6 mt-2">
              <PriceDisplay amountMinor={145000000} currency="NGN" size="lg" />
              <PriceDisplay amountMinor={145000000} currency="NGN" size="md" />
              <PriceDisplay amountMinor={145000000} currency="NGN" size="sm" />
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Button System */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">4. Button System (44px / 48px Standards)</h2>
        <Card className="p-6 bg-white space-y-6">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Button Variants</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="accent">Accent (Auctions)</Button>
              <Button variant="danger">Destructive Button</Button>
              <Button disabled variant="primary">Disabled</Button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Standard Sizes</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small (36px)</Button>
              <Button size="md">Medium / Standard (44px)</Button>
              <Button size="lg">Large / Hero (50px)</Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 5. Badges & Chips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">5. Badges, Chips & Trust Seals</h2>
        <Card className="p-6 bg-white space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <VerifiedBadge text="Verified Merchant" />
            <Badge tone="brand">Buy Now</Badge>
            <Badge tone="accent">⚡ Live Auction</Badge>
            <Badge tone="info">Service Wanted</Badge>
            <Badge tone="warning">Urgent Request</Badge>
            <Badge tone="success">In Escrow</Badge>
            <Badge tone="danger">Disputed</Badge>
            <Badge tone="neutral">Draft</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Badge tone="brand" pill>Pill Badge</Badge>
            <Badge tone="accent" pill>Urgent Deadline</Badge>
            <Badge tone="success" pill>OTP Verified</Badge>
          </div>
        </Card>
      </section>

      {/* 6. Form Controls */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">6. Form Controls & Validation States</h2>
        <Card className="p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field id="sample-title" label="Listing Title" hint="Include brand, model, and condition" required>
              <Input id="sample-title" placeholder="e.g. iPhone 15 Pro Max 256GB" />
            </Field>

            <Field id="sample-city" label="Location & City" required>
              <Select id="sample-city">
                <option value="lagos">Lagos, Nigeria</option>
                <option value="abuja">Abuja, FCT</option>
                <option value="ph">Port Harcourt, Rivers</option>
              </Select>
            </Field>

            <Field id="sample-desc" label="Description" hint="Detailed product specifications">
              <Textarea id="sample-desc" placeholder="Describe the item or service deliverables..." />
            </Field>

            <div className="space-y-3">
              <Alert tone="info" title="Escrow Protection">
                Payments are held securely in a multi-tenant escrow ledger until item delivery.
              </Alert>
              <Alert tone="success" title="Verification Passed">
                CAC business registration and identity documents confirmed.
              </Alert>
              <Alert tone="warning" title="Auction Ending Soon">
                Anti-sniping protection activates within the final 5 minutes.
              </Alert>
            </div>
          </div>
        </Card>
      </section>

      {/* 7. Interactive Cards Showcase */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">7. Reusable Marketplace Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Supply Side: Product Card
            </p>
            <ListingCard listing={dummyListing} />
          </div>

          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Demand Side: Buyer Request Card
            </p>
            <RequestCard request={dummyRequest} />
          </div>

          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Auction Mode: Timed Auction Card
            </p>
            <AuctionCard auction={dummyAuction} />
          </div>
        </div>
      </section>

      {/* 8. Dashboard Widgets & Empty States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">8. Dashboard Metrics & Empty States</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric label="Gross Merchandise Value" value="₦48,250,000" change="+18.4%" tone="positive" />
          <Metric label="Active Escrow Balance" value="₦14,800,000" note="Protected in ledger" />
          <Metric label="Pending KYC Verifications" value="23" note="Awaiting review" />
          <Metric label="Dispute Rate" value="0.4%" change="-0.2%" tone="positive" />
        </div>

        <div className="mt-4">
          <EmptyState
            title="No open orders currently pending"
            action={
              <ButtonLink href="/search" variant="primary" size="sm">
                Explore Marketplace Listings
              </ButtonLink>
            }
          >
            All your incoming orders have been fulfilled or confirmed via delivery OTP.
          </EmptyState>
        </div>
      </section>
    </div>
  );
}
