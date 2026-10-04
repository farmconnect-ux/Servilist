# Servilist Africa

> Pan-African Hybrid Marketplace: Hyperlocal Classifieds, Timed Auctions, Reverse Buyer Requests & Safe Trade Escrow.

Servilist is built specifically for African commerce across major corridors (Nigeria, Kenya, Ghana, South Africa, Rwanda, Egypt, Tanzania, Uganda). It bridges Craigslist-style community classifieds with eBay-style competitive live auctions, reverse buyer requests (ISO/Wanted/RFQ), and escrow protection released via a secret 6-digit Handover OTP.

---

## Key Features

1. **Hyperlocal Classifieds & Community Gigs**:
   - Hyperlocal trade across African commercial centers (Lagos, Nairobi, Accra, Johannesburg, Kigali, Cairo, etc.).
   - Cash meetup safe exchange recommendations.

2. **Timed Auctions & Live Bidding**:
   - Reserve price enforcement, minimum bid increments, real-time countdown tickers.
   - Buy It Now (BIN) option for instant acquisition.

3. **Reverse Buyer Requests (ISO / Wanted / RFQ)**:
   - Buyers post requests for hard-to-find goods or specific artisan services with urgency and target budget.
   - Local vendors and service contractors submit competitive quotes and timelines.

4. **Multi-Currency African Engine**:
   - Native support for 10 African currencies: NGN (₦), KES (KSh), GHS (GH₵), ZAR (R), EGP (E£), RWF (FRw), TZS (TSh), UGX (USh), XOF (CFA), and US Dollars ($).
   - Dual-pricing display (`≈ $USD`) and real-time cross-currency converter & matrix calculator.

5. **Safe Meetup & Escrow Protection**:
   - 4-stage milestone pipeline: Funded ➔ Safe Handover / Inspection ➔ Secret OTP Verification ➔ Payout Released.
   - Recommended safe meetup zones near police stations and commercial hubs.

6. **Unified Market Dashboards**:
   - Seller Hub, Buyer Requests Hub, Service Provider Quotes Tracker, Escrow Analytics, and Supabase Cloud Sync Console.

---

## Project Structure

```
├── src/                    # Modular TypeScript architecture
│   ├── types/              # Domain types (Listing, Request, Quote, Escrow, Money)
│   ├── money/              # Integer minor units, currency conversion, display formatting
│   ├── data/               # Single-source African locations, seeds, localStorage manager
│   ├── auctions/           # Next min bid calculation, reserve met, bid validation
│   ├── listings/           # Pure filtering and multi-criteria sorting algorithms
│   ├── requests/           # Buyer request and vendor quote domain factories
│   ├── escrow/             # State machine, collision-safe codes, OTP generator
│   ├── ui/                 # Accessible dialogs, SVG icons, mobile bottom nav, sheets
│   └── main.ts             # Application controller and DOM event coordinator
├── supabase/
│   └── migrations/         # Versioned SQL migrations (00001 - 00008)
├── tests/                  # Automated test suite
│   └── smoke.spec.js       # Playwright end-to-end smoke test suite (3 specs)
├── public/                 # Static assets and icons
│   ├── index.html          # HTML shell and dialog templates
│   └── style.css           # Phone-first design system with responsive sheets
├── dist/                   # Production bundle output (Vite)
├── server.js               # Node.js HTTP preview server and sync router
├── vite.config.ts          # Vite build and Vitest configuration
├── tsconfig.json           # TypeScript compilation settings
├── eslint.config.js        # ESLint 9 TypeScript flat configuration
├── package.json            # Scripts and dependencies
├── .env.example            # Environment variable template
├── .gitattributes          # Line ending normalization
└── .gitignore              # Ignored files (secrets, node_modules, dist)
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

```bash
npm install
```

### Development & Preview

```bash
# Start Vite development server with HMR:
npm run dev

# Or build and launch the production preview server:
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quality Assurance & Testing

```bash
# Run all tests (unit tests + smoke tests):
npm test

# Run Vitest unit tests only:
npm run test:unit

# Run Playwright end-to-end smoke tests:
npm run test:smoke

# Static type check:
npm run typecheck

# Code linting:
npm run lint

# Format verification:
npm run format:check
```

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable                    | Description                              | Default                            |
| :-------------------------- | :--------------------------------------- | :--------------------------------- |
| `PORT`                      | Local preview server port                | `3000`                             |
| `SUPABASE_URL`              | Supabase Project URL                     | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY`         | Supabase Anon Public API Key             | `your-supabase-anon-key`           |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase Service Role Key    | (optional)                         |
| `SYNC_SECRET`               | Secret key for authenticated server sync | (optional)                         |

> **Security Note:** Never commit `.env` or sensitive credential files to Git. All live credentials must be kept in environment variables.
