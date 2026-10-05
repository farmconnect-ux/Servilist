# Servilist Marketplace Platform — System Architecture

**Document Status**: Production Architecture & Engineering Reference  
**Product**: Two-Sided & Reverse Pan-African Marketplace Platform  
**Target Stack**: Next.js 16 (Turbopack) · React 19 · TypeScript Strict · Tailwind CSS · PostgreSQL (Supabase)

---

## 1. Architectural Philosophy & Principles

Servilist is engineered as a **high-cohesion, low-coupling modular monolith**. It combines supply-led commerce (sellers listing products and services), demand-led commerce (buyers publishing specific requests and receiving quotations), auctions (eBay-style timed bidding with anti-sniping protection), and secure escrow transactions backed by double-entry ledger accounting and secret handover OTP verification.

### 1.1 Single Identity, Flexible Capabilities

Every authenticated user is modeled as a unified persona capable of acting as a Buyer, Seller, Service Provider, or Business without maintaining separate user accounts. The active context is determined by the action being taken:

```text
User (id: UUID)
 ├── Buyer Capabilities (Order tracking, requests, chat, purchase receipts)
 ├── Seller Capabilities (Inventory catalog, incoming order fulfillment, analytics)
 ├── Service Provider (Service catalog, tiered packages, booking schedule)
 └── Business Storefront (Verified CAC registration, company branding, policies)
```

### 1.2 Separation of Dashboards

In strict alignment with platform governance rules, user experiences are partitioned into dedicated, non-unified operational interfaces:

- **🛒 Buyer Dashboard (`/dashboard`)**: Order tracking, purchase history, active requests, conversations, profile settings.
- **💰 Seller Hub (`/dashboard/seller`)**: Sales analytics, inventory toggle, incoming order fulfillment, courier dispatch, verification KYC modal, and matching buyer demands.
- **🛡️ Admin Dashboard (`/admin`, `/admin/vendors`, `/admin/reports`, `/admin/audit-logs`)**: Platform-wide settled GMV, escrow volume, KYC review queue, moderation triage, and immutable audit logs.

---

## 2. Layered Architecture & Domain Service Rule

To avoid coupling business logic to presentation layers, Servilist strictly follows **Master Specification Section 98 (Domain Service Rule)**:

```text
[ React UI Component / Page ]
            ↓
    [ Next.js API Route ]
            ↓
  [ Authorization Policy ]  (e.g., canParticipate, requireUser, RBAC)
            ↓
    [ Zod Validation ]      (e.g., CreateListingSchema, PlaceBidSchema)
            ↓
    [ Domain Service ]      (e.g., auctions.ts, orders.ts, services.ts)
            ↓
   [ Repository Layer ]     (e.g., createOrderRecord, placeBidRecord)
            ↓
 [ Database / PostgreSQL ]  (Tables, Triggers, RLS Policies, Ledger)
```

No React component or Next.js page directly issues database writes or performs financial calculations.

---

## 3. Escrow & Double-Entry Financial Ledger

Servilist does not rely on third-party payment gateway dashboards as the financial source of truth. All monetary operations are recorded in an internal, double-entry financial ledger (`ledger_accounts`, `ledger_transactions`, `ledger_entries`):

### 3.1 Financial Flow

```text
Buyer Payment (100%)
      │
      ▼
Platform Clearing / Escrow Account
      │
      ├───────────────────────────────┐
      ▼                               ▼
Seller Payable (95%)          Platform Commission (5%)
(Held until OTP release)      (Earned Revenue)
```

### 3.2 Secret Handover OTP Release Mechanism

To eliminate delivery disputes:

1. When an escrow order is created, the system generates a cryptographic 6-digit verification code (`verification_otp_code`).
2. Only the SHA-256 hash (`verification_otp_hash`) is verified server-side.
3. The plain OTP is displayed **exclusively** to the buyer in their order tracking interface.
4. Upon physical handover or courier delivery, the buyer reveals the OTP to the seller/courier.
5. The seller submits the OTP to `/api/v1/orders/[id]/release-otp`. The server hashes the candidate code, validates it against the stored hash, transitions order status to `completed`, and releases the seller payout in the financial ledger.

---

## 4. Timed Bidding & Auction Engine

Servilist supports live eBay-style timed auctions with atomic database concurrency and anti-sniping protection:

1. **Concurrency Protection**: Bids are placed through `place_bid` PostgreSQL RPC with row-level locking (`FOR UPDATE`) on the `auctions` record.
2. **Anti-Sniping Rule**: If a bid is submitted within 5 minutes (`anti_sniping_seconds`) of `ends_at`, the deadline is automatically extended by 5 minutes.
3. **Winner Settlement**: When an auction ends, if the highest bid meets or exceeds the reserve price, the auction transitions to `settled`, and an order is automatically generated for the winning bidder with status `pending_payment`. If the reserve price was not met, the auction closes as `ended`.

---

## 5. Intelligent Reverse-Marketplace Matching Engine

Servilist bridges supply and demand:

- **Demand Signals**: When a buyer submits a request (e.g., _"Need 20 units of 550W solar panels in Ibadan"_), the matching engine scans active seller listings and scores them based on:
  - Exact category match (40%)
  - Budget compatibility (25%)
  - Geographic city proximity (20%)
  - Full-text search keyword overlap (15%)
- **Supply Signals**: Sellers viewing `/dashboard/seller` receive real-time demand alerts displaying open buyer requests matching their current catalog items.

---

## 6. Security & Authorization Model

1. **Row Level Security (RLS)**: Enforced across all tables in PostgreSQL. Public users can browse active listings; authenticated users can only view their own orders, bids, and private conversations.
2. **RBAC & Admin Security**: Administrative operations require the `admin` role verified against database permissions (`my_access` RPC). Sensitive administrative actions automatically generate immutable records in `audit_logs`.
3. **No Stored-Value Wallets**: To comply with pan-African banking and fintech regulatory requirements, Servilist uses direct payment routing through licensed payment infrastructure (Paystack and Flutterwave) rather than maintaining unlicensed customer wallet balances.
