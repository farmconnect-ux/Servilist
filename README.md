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
├── public/                 # Static web assets served by server.js
│   ├── index.html          # Main application page and modal dialogs
│   ├── style.css           # Modern responsive design system
│   ├── servilist.js        # Core client application engine
│   └── supabaseClient.js   # Supabase client SDK and sync adapter
├── tests/                  # Automated test suite
│   └── smoke.spec.js       # Playwright end-to-end smoke test
├── server.js               # Node.js HTTP server and API router
├── supabase_schema.sql     # PostgreSQL database schema & RLS policies
├── package.json            # Scripts and dependencies
├── .env.example            # Environment variable template
├── .gitattributes          # Line ending normalization
└── .gitignore              # Ignored files (secrets, node_modules)
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

### Development Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests
```bash
npm test
```

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Local preview server port | `3000` |
| `SUPABASE_URL` | Supabase Project URL | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Anon Public API Key | `your-supabase-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase Service Role Key | (optional) |
| `SYNC_SECRET` | Secret key for authenticated server sync | (optional) |

> **Security Note:** Never commit `.env` or sensitive credential files to Git. All live credentials must be kept in environment variables.
