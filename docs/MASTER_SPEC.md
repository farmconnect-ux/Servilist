# Servilist master build specification

Source of truth, provided by Quadri on 2026-10-05. Reproduced as written.

---

MARKETPLACE PLATFORM
Complete Software Requirements Specification and Engineering Build Prompt
Document status: Master Build Specification
Product type: Two-sided marketplace and reverse marketplace
Primary modes: Buy, Sell, Request, Hire, Auction
Target architecture: Modern modular monolith with PostgreSQL
Initial deployment: Web, mobile-first responsive PWA
Future: Native mobile applications, AI matching, logistics, advanced commerce
1. PRODUCT VISION
Build a modern multi-sided marketplace that combines the simplicity of classified marketplaces, the structured commerce functionality of auction/e-commerce platforms, and a reverse marketplace where buyers can publish requests for products and services and sellers or service providers can respond with offers.
The platform must support four fundamental actions:
BUY: Users discover and purchase products.
SELL: Users publish products and services.
REQUEST: Buyers publish what they need and receive offers from sellers or providers.
HIRE: Buyers publish service requirements and receive quotations from service providers.
The platform should additionally support auctions, negotiations, messaging, payments, delivery, reviews, seller reputation, business accounts, verification and administrative moderation.
The central marketplace concept is:

```text
SELLER HAS SOMETHING
        |
        v
     LISTING
        |
        v
   MARKETPLACE
        ^
        |
     REQUEST
        ^
        |
BUYER NEEDS SOMETHING

```

The platform must therefore support both:
Supply-led commerce
A seller creates a listing and waits for buyers.
Demand-led commerce
A buyer creates a request and waits for sellers.
The system should eventually intelligently connect both sides.
2. CORE PRODUCT PRINCIPLE
Every authenticated user has the potential to be both a buyer and seller.
Do not create separate buyer and seller account types.
Instead:

```text
User
 |
 +-- Buyer capabilities
 |
 +-- Seller capabilities
 |
 +-- Service provider capabilities
 |
 +-- Business capabilities

```

Users can switch between these activities without creating another account.
3. PRIMARY USER TYPES
3.1 Guest
Can:

* Browse listings
* Search
* View public seller profiles
* View categories
* View public requests where enabled
* View services
* View auctions
* Register/login

Cannot:

* Message
* Buy
* Make offers
* Post listings
* Post requests
* Bid
* Review

3.2 Registered User
Can:

* Buy
* Sell
* Post requests
* Respond to requests
* Message other users
* Save listings
* Make offers
* Place bids
* Place orders
* Review completed transactions

3.3 Verified User
A registered user who has completed required identity verification.
Additional capabilities may include:

* Higher transaction limits
* Higher-value listings
* Seller verification badge
* Payout eligibility
* Reduced fraud restrictions

3.4 Business
Businesses can have:

* Business profile
* Staff
* Multiple listings
* Services
* Inventory
* Business verification
* Analytics
* Orders
* Payouts

3.5 Service Provider
A user or business offering services.
Examples:

* Plumber
* Electrician
* Cleaner
* Mechanic
* Developer
* Designer
* Transport provider
* Construction contractor

3.6 Administrator
Can manage:

* Users
* Listings
* Requests
* Orders
* Payments
* Payouts
* Disputes
* Reviews
* Categories
* Reports
* Verification
* Platform configuration
* Audit logs

4. CORE MARKETPLACE OBJECTS
The platform must distinguish these entities:

```text
Listing
Request
Offer
Auction
Bid
Order
Payment
Payout
Conversation
Message
Review
Dispute
Delivery

```

Do not combine these entities into one generic table.
Each represents a different business process.
5. LISTING TYPES
A listing may be:

```text
classified
fixed_price
negotiable
auction
service

```

The listing workflow is:

```text
DRAFT
  |
  v
PUBLISHED
  |
  +----> PAUSED
  |
  +----> SOLD
  |
  +----> EXPIRED
  |
  +----> REMOVED

```

6. REQUEST TYPES
Requests may be:

```text
PRODUCT
SERVICE
BULK_PURCHASE
CUSTOM

```

Example product request:
Looking for an iPhone 16 Pro Max under ₦1,500,000.
Example service request:
Need a plumber to repair a leaking pipe in Lekki.
Example bulk purchase:
Need 500 bags of cement delivered to Ibadan.
7. REQUEST STATE MACHINE
Implement the following request states:

```text
DRAFT
   |
   v
PUBLISHED
   |
   +----> RECEIVING_OFFERS
   |
   +----> ACCEPTED
   |
   +----> IN_PROGRESS
   |
   +----> COMPLETED
   |
   +----> CANCELLED
   |
   +----> EXPIRED

```

Recommended implementation:

```text
DRAFT
PUBLISHED
RECEIVING_OFFERS
ACCEPTED
IN_PROGRESS
COMPLETED
CANCELLED
EXPIRED

```

A request must not transition arbitrarily.
Implement a domain service responsible for validating every transition.
8. OFFER STATE MACHINE
Offers can originate from:

1. Buyer making an offer against a seller listing.
2. Seller responding to a buyer request.
3. Service provider submitting a quotation.

Offer states:

```text
PENDING
   |
   +----> ACCEPTED
   |
   +----> REJECTED
   |
   +----> COUNTERED
   |
   +----> EXPIRED
   |
   +----> CANCELLED

```

Counter-offers must create a new immutable offer version or linked offer record.
Never overwrite historical negotiation data.
9. ORDER STATE MACHINE
Orders:

```text
PENDING_PAYMENT
      |
      v
PAID
      |
      v
PROCESSING
      |
      v
SHIPPED
      |
      v
DELIVERED
      |
      v
COMPLETED

```

Alternative paths:

```text
PENDING_PAYMENT -> CANCELLED

PAID -> REFUND_PENDING

PROCESSING -> CANCELLED

SHIPPED -> DISPUTED

DELIVERED -> DISPUTED

DISPUTED -> RESOLVED

```

10. PAYMENT STATE MACHINE
Payment statuses:

```text
INITIATED
   |
   v
PENDING
   |
   +----> SUCCESS
   |
   +----> FAILED
   |
   +----> CANCELLED

```

After successful payment:

```text
SUCCESS
   |
   v
HELD / PLATFORM_CLEARING
   |
   v
RELEASED

```

Refund states:

```text
REFUND_REQUESTED
REFUND_PROCESSING
REFUNDED
REFUND_FAILED

```

The application must not assume that a browser redirect means payment succeeded.
Payment confirmation must come from a verified payment provider webhook or trusted server-side verification.
11. FINANCIAL LEDGER
The system must maintain an internal financial ledger.
Do not use the payment gateway dashboard as the source of truth.
Use:

```text
ledger_accounts
ledger_transactions
ledger_entries

```

Every financial transaction should be traceable.
Example:

```text
Buyer payment
      |
      +-- Seller payable
      |
      +-- Platform commission
      |
      +-- Delivery fee

```

All ledger entries should be immutable.
Corrections should be performed through reversal entries rather than modifying historical entries.
12. TECHNOLOGY STACK
Use the following preferred stack unless a strong technical reason requires a change.
Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
React Hook Form
Zod
TanStack Query

```

Backend
Preferred initial architecture:

```text
Next.js application
Modular backend/domain services
REST API

```

Alternative:

```text
NestJS API
Next.js frontend

```

Use a modular monolith initially.
Do NOT introduce microservices in the MVP.
13. DATABASE
Use:

```text
PostgreSQL

```

Use UUIDs for primary identifiers.
Enable:

```text
pgcrypto
PostGIS

```

where available.
Use PostGIS for geographical search.
14. DATABASE SCHEMA
Create migrations for the following entities.
users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(30) UNIQUE,
    password_hash TEXT,
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

```

Allowed status:

```text
active
suspended
banned
pending_verification
deleted

```

15. profiles

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    username VARCHAR(80) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    date_of_birth DATE,
    country_code VARCHAR(5),
    state VARCHAR(100),
    city VARCHAR(100),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

```

16. roles
Create RBAC tables:

```text
roles
permissions
role_permissions
user_roles

```

Suggested roles:

```text
USER
SELLER
SERVICE_PROVIDER
BUSINESS_OWNER
MODERATOR
SUPPORT_AGENT
FINANCE_ADMIN
ADMIN
SUPER_ADMIN

```

Avoid granting administrative permissions through frontend logic.
Authorization must be enforced server-side.
17. businesses

```sql
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    email VARCHAR(255),
    phone VARCHAR(30),
    website TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    verification_status VARCHAR(40) DEFAULT 'unverified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

```

18. categories

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES categories(id),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

```

Support unlimited hierarchy.
Example:

```text
Electronics
  Phones
    Smartphones
      iPhone

```

19. listings

```sql
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id),
    business_id UUID REFERENCES businesses(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    listing_type VARCHAR(40) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(15,2),
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    quantity INTEGER DEFAULT 1,
    condition VARCHAR(40),
    status VARCHAR(40) NOT NULL DEFAULT 'draft',
    negotiable BOOLEAN DEFAULT FALSE,
    location_id UUID,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

```

Create indexes on:

```text
seller_id
category_id
status
price
location_id
published_at

```

20. listing_images

```sql
CREATE TABLE listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

```

21. requests

```sql
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES users(id),
    category_id UUID REFERENCES categories(id),
    request_type VARCHAR(40) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget_min DECIMAL(15,2),
    budget_max DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'NGN',
    location_id UUID,
    status VARCHAR(40) NOT NULL DEFAULT 'draft',
    response_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

```

22. request_responses

```sql
CREATE TABLE request_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES requests(id),
    responder_id UUID NOT NULL REFERENCES users(id),
    price DECIMAL(15,2),
    delivery_cost DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'NGN',
    message TEXT,
    estimated_delivery_days INTEGER,
    status VARCHAR(40) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

```

23. offers

```sql
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id),
    request_id UUID REFERENCES requests(id),
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    parent_offer_id UUID REFERENCES offers(id),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NGN',
    message TEXT,
    status VARCHAR(40) DEFAULT 'pending',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

```

Business validation must ensure that an offer belongs to a valid listing or request.
24. auctions

```sql
CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL UNIQUE REFERENCES listings(id),
    starting_price DECIMAL(15,2) NOT NULL,
    reserve_price DECIMAL(15,2),
    current_price DECIMAL(15,2),
    minimum_increment DECIMAL(15,2) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(40) DEFAULT 'scheduled',
    winner_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

```

25. auction_bids

```sql
CREATE TABLE auction_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES auctions(id),
    bidder_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

```

Bids are immutable.
26. orders

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    listing_id UUID REFERENCES listings(id),
    request_id UUID REFERENCES requests(id),
    subtotal DECIMAL(15,2) NOT NULL,
    delivery_fee DECIMAL(15,2) DEFAULT 0,
    platform_fee DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NGN',
    status VARCHAR(40) NOT NULL DEFAULT 'pending_payment',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

```

27. order_items

```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL
);

```

28. payments

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    provider VARCHAR(50) NOT NULL,
    provider_reference VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NGN',
    status VARCHAR(40) DEFAULT 'initiated',
    paid_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

```

29. payouts

```sql
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NGN',
    status VARCHAR(40) DEFAULT 'pending',
    provider_reference VARCHAR(255),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

```

30. conversations

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id),
    request_id UUID REFERENCES requests(id),
    order_id UUID REFERENCES orders(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

```

31. conversation_members

```sql
CREATE TABLE conversation_members (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (conversation_id, user_id)
);

```

32. messages

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    body TEXT,
    attachment_url TEXT,
    message_type VARCHAR(30) DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

```

33. reviews

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id, reviewer_id, reviewee_id)
);

```

Only completed transactions can generate reviews.
34. disputes

```sql
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    opened_by UUID NOT NULL REFERENCES users(id),
    reason VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(40) DEFAULT 'open',
    resolution TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

```

35. notifications

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

```

36. reports
Users can report:

```text
listing
user
message
review
request

```

Schema:

```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    target_type VARCHAR(40) NOT NULL,
    target_id UUID NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(40) DEFAULT 'open',
    handled_by UUID REFERENCES users(id),
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

```

37. AUDIT LOG
All sensitive administrative actions must be logged.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    before_data JSONB,
    after_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

```

38. API CONTRACT
Use REST APIs with consistent response structures.
Standard success response:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}

```

Standard error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {}
  }
}

```

39. AUTHENTICATION API

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/verify-phone
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/me

```

Support phone authentication.
Email should be optional initially.
40. PROFILE API

```http
GET /api/users/:id
PATCH /api/users/me

GET /api/users/:id/listings
GET /api/users/:id/reviews
GET /api/users/:id/services

PATCH /api/users/me/profile
PATCH /api/users/me/location

```

41. LISTING API

```http
POST /api/listings
GET /api/listings
GET /api/listings/:id
PATCH /api/listings/:id
DELETE /api/listings/:id

POST /api/listings/:id/publish
POST /api/listings/:id/pause
POST /api/listings/:id/archive

POST /api/listings/:id/favorite
DELETE /api/listings/:id/favorite

```

42. REQUEST API

```http
POST /api/requests
GET /api/requests
GET /api/requests/:id
PATCH /api/requests/:id
DELETE /api/requests/:id

POST /api/requests/:id/publish
POST /api/requests/:id/cancel

GET /api/requests/:id/responses
POST /api/requests/:id/responses

```

43. OFFER API

```http
POST /api/offers
GET /api/offers
GET /api/offers/:id

POST /api/offers/:id/accept
POST /api/offers/:id/reject
POST /api/offers/:id/counter
POST /api/offers/:id/cancel

```

44. AUCTION API

```http
POST /api/auctions
GET /api/auctions
GET /api/auctions/:id

POST /api/auctions/:id/bids

POST /api/auctions/:id/start
POST /api/auctions/:id/end

```

The backend must validate:

```text
Auction is active
Bidder is authorised
Bid amount is sufficient
Auction has not expired
User is not the seller

```

45. ORDER API

```http
POST /api/orders
GET /api/orders
GET /api/orders/:id

POST /api/orders/:id/cancel
POST /api/orders/:id/confirm-delivery
POST /api/orders/:id/dispute
POST /api/orders/:id/complete

```

46. PAYMENT API

```http
POST /api/payments/initialize
GET /api/payments/:id
POST /api/payments/verify
POST /api/payments/webhook/paystack
POST /api/payments/webhook/flutterwave
POST /api/payments/:id/refund

```

Webhook endpoints must validate provider signatures.
Never trust client-supplied payment status.
47. MESSAGING API

```http
GET /api/conversations
POST /api/conversations

GET /api/conversations/:id
GET /api/conversations/:id/messages

POST /api/conversations/:id/messages
POST /api/conversations/:id/read

```

Use WebSockets or a managed realtime service for real-time messages.
48. REVIEW API

```http
POST /api/orders/:id/review
GET /api/users/:id/reviews

```

The backend must verify:

```text
Reviewer participated in order
Order is completed
Reviewer has not already reviewed
Reviewee belongs to order

```

49. FRONTEND ROUTES
Build the following pages.
Public pages

```text
/
 /search
 /categories
 /categories/[slug]
 /products/[slug]
 /services/[slug]
 /requests/[slug]
 /auctions/[slug]
 /seller/[username]
 /business/[slug]
 /login
 /register
 /forgot-password
 /help
 /terms
 /privacy

```

50. HOME PAGE
The homepage must contain:

```text
Global navigation
Search
Categories
Buy CTA
Sell CTA
Request CTA
Featured listings
Popular categories
Services
Buyer requests
Auctions
Nearby listings
Trust indicators
Footer

```

The primary hero message should communicate:
Buy what you need. Sell what you have. Request what you cannot find.
Primary actions:

```text
[Buy]
[Sell]
[Post a Request]

```

51. SEARCH PAGE
Features:

```text
Search field
Category filters
Location filters
Price range
Condition
Seller verification
Rating
Delivery
Sort
Pagination/infinite scrolling

```

Support:

```text
products
services
requests
auctions

```

Search should return relevant results rather than simply exact text matches.
52. PRODUCT PAGE
Display:

```text
Image gallery
Title
Price
Condition
Location
Seller
Rating
Verification
Description
Specifications
Delivery
Quantity
Buy Now
Make Offer
Message Seller
Save
Report

```

For auction listings:

```text
Current bid
Bid increment
Auction timer
Bid history
Place bid

```

53. SELL PAGE
Create a multi-step wizard.

```text
1. Select type
2. Select category
3. Details
4. Images
5. Pricing
6. Location
7. Delivery
8. Preview
9. Publish

```

Persist drafts.
Users must be able to leave and resume.
54. POST REQUEST PAGE
Wizard:

```text
1. Request type
2. Category
3. What do you need?
4. Budget
5. Location
6. Deadline
7. Attachments
8. Preview
9. Publish

```

After publishing:

```text
Request dashboard
Responses
Messages
Offers
Accept response
Cancel request

```

55. REQUEST DETAIL PAGE
Display:

```text
Request title
Description
Budget
Location
Deadline
Buyer profile
Verification
Number of responses
Responses

```

For eligible sellers:

```text
[Respond]

```

Response form:

```text
Your price
Delivery cost
Estimated delivery
Message
Attachments

```

56. SELLER PROFILE
Display:

```text
Profile photo
Username
Verification
Rating
Reviews
Location
About
Listings
Services
Completed transactions
Response rate

```

Do not expose sensitive personal information.
57. MESSAGES PAGE
Desktop:

```text
Conversation list | Active conversation

```

Mobile:

```text
Conversation list
      ↓
Conversation

```

Messages should support:

```text
Text
Image
Offer
Order
Request
System notification

```

58. DASHBOARD
Authenticated users should have:

```text
Overview
Buying
Selling
Requests
Services
Orders
Offers
Messages
Notifications
Saved items
Payments
Reviews
Profile
Settings

```

59. SELLER DASHBOARD
Metrics:

```text
Active listings
Views
Messages
Offers
Orders
Revenue
Pending payouts
Rating

```

Tables:

```text
Listings
Orders
Offers
Analytics

```

60. BUYER DASHBOARD
Display:

```text
Active orders
Offers
Requests
Saved listings
Recently viewed
Messages

```

61. REQUEST DASHBOARD
Show:

```text
Active requests
Responses received
Accepted requests
Completed requests
Expired requests

```

62. ADMIN DASHBOARD
The admin dashboard must be separate from the public frontend.
Routes:

```text
/admin
/admin/users
/admin/businesses
/admin/listings
/admin/requests
/admin/offers
/admin/orders
/admin/payments
/admin/payouts
/admin/disputes
/admin/reports
/admin/reviews
/admin/categories
/admin/verifications
/admin/auctions
/admin/settings
/admin/audit-logs

```

63. ADMIN OVERVIEW
Show:

```text
Registered users
Active users
New listings
New requests
Orders
GMV
Platform revenue
Pending payouts
Open disputes
Reports
Suspended accounts

```

Charts:

```text
GMV over time
Listings over time
Requests over time
Completed transactions
User growth
Revenue

```

64. ADMIN USER MANAGEMENT
Admin must be able to:

```text
Search users
View user
Suspend
Unsuspend
Ban
Verify
Review transaction history
View reports
View disputes
View audit history

```

High-risk actions require confirmation.
65. ADMIN LISTING MANAGEMENT
Admin can:

```text
Search listings
Filter
View listing
Remove listing
Restore listing
Edit category
Mark as featured
Review reports

```

Removal must require a reason.
66. ADMIN REQUEST MANAGEMENT
Admin can:

```text
Search requests
Review reported requests
Close abusive requests
Remove spam
View responses
Suspend request creator

```

67. ADMIN PAYMENT MANAGEMENT
Admin can view:

```text
Payment
Order
Buyer
Seller
Provider
Provider reference
Amount
Status
Webhook history
Refunds
Payouts

```

Never expose payment secrets in UI.
68. ADMIN DISPUTES
Dispute dashboard:

```text
Open
Under review
Awaiting buyer
Awaiting seller
Resolved
Escalated

```

Admin should be able to:

```text
View order
View messages
View evidence
View payment
Issue refund
Release funds according to permitted workflow
Close dispute

```

Every resolution must create an audit log.
69. AUTHENTICATION
Implement:

```text
Phone authentication
Email authentication
Password authentication
Session management
Password reset
Email verification
Phone verification

```

Use secure HTTP-only cookies for web sessions.
Never store authentication tokens in localStorage if avoidable.
70. RBAC
Authorization must operate at three levels:

```text
Role
Resource
Ownership

```

Example:
A seller may update:

```text
their own listing

```

but not:

```text
another seller's listing

```

An admin may update:

```text
any listing

```

Implement authorization policies server-side.
71. SECURITY REQUIREMENTS
Implement:

```text
CSRF protection where applicable
Rate limiting
Input validation
Output sanitisation
SQL injection protection
XSS protection
Secure cookies
Password hashing
Webhook signature verification
RBAC
Ownership checks
Audit logging
File upload validation
MIME validation
File size limits

```

Never trust:

```text
price
seller_id
buyer_id
payment status
role
permissions
order status

```

when supplied by the client.
Derive sensitive values server-side.
72. FILE UPLOADS
Supported:

```text
JPEG
PNG
WEBP
PDF where necessary

```

Images should be:

```text
validated
resized
compressed
thumbnail generated
stored using object storage

```

Do not store large image binaries directly inside PostgreSQL.
73. SEARCH
Implement PostgreSQL search initially.
Prepare architecture for:

```text
Meilisearch
Typesense
OpenSearch

```

Search index should contain:

```text
title
description
category
location
price
condition
seller rating
verification
listing type

```

74. LOCATION
Use PostGIS.
Create a location model capable of storing:

```text
country
state
city
LGA
address
latitude
longitude
geography point

```

Support:

```text
near me
within 5km
within 10km
within 25km

```

Do not expose precise seller location unless the seller explicitly permits it.
75. NOTIFICATION SYSTEM
Create a notification abstraction.

```text
NotificationService

```

Providers:

```text
In-app
Email
SMS
Push

```

Events:

```text
OFFER_RECEIVED
OFFER_ACCEPTED
OFFER_REJECTED
REQUEST_RESPONSE
ORDER_CREATED
PAYMENT_SUCCESS
PAYMENT_FAILED
MESSAGE_RECEIVED
DELIVERY_UPDATED
REVIEW_RECEIVED
DISPUTE_OPENED

```

76. BACKGROUND JOBS
Use a queue system for:

```text
Email
SMS
Notifications
Search indexing
Image processing
Auction expiration
Listing expiration
Request expiration
Payment reconciliation
Payout processing
Analytics aggregation

```

Do not execute long-running jobs directly inside HTTP requests.
77. CRON JOBS
Implement scheduled jobs for:

```text
Expire listings
Expire requests
Expire offers
End auctions
Send reminders
Reconcile payments
Process eligible payouts
Update search indexes

```

Auction ending must be handled server-side.
78. AUDITABILITY
Important events must be recorded.
Examples:

```text
LOGIN
LISTING_CREATED
LISTING_PUBLISHED
LISTING_REMOVED
REQUEST_CREATED
OFFER_CREATED
OFFER_ACCEPTED
ORDER_CREATED
PAYMENT_SUCCESS
REFUND_CREATED
PAYOUT_CREATED
USER_SUSPENDED
USER_BANNED
DISPUTE_RESOLVED

```

79. FRONTEND COMPONENT ARCHITECTURE
Create reusable components:

```text
SearchBar
CategoryMenu
ListingCard
ListingGrid
ListingGallery
SellerCard
SellerBadge
VerificationBadge
RatingStars
PriceDisplay
OfferModal
RequestCard
RequestResponseCard
ServiceCard
AuctionCard
BidPanel
MessageList
MessageComposer
OrderCard
PaymentSummary
DeliveryCard
ReviewForm
ReportModal

```

Avoid duplicating UI logic.
80. DESIGN SYSTEM
Use a clean marketplace visual language.
Requirements:

```text
Mobile-first
Accessible
High contrast
Clear typography
Strong hierarchy
Consistent buttons
Consistent forms
Consistent cards
Clear transaction states

```

Do not make the interface visually cluttered like a traditional classifieds site.
The platform should feel modern, trustworthy and commercial.
81. ACCESSIBILITY
Target WCAG 2.2 AA where practical.
Implement:

```text
Keyboard navigation
Semantic HTML
Accessible forms
ARIA labels where necessary
Focus states
Colour contrast
Screen-reader support
Error messaging

```

82. SEO
Public pages must be server-rendered.
Implement:

```text
metadata
Open Graph
canonical URLs
sitemap
robots.txt
structured data
breadcrumbs

```

Use structured data for eligible:

```text
Product
Service
LocalBusiness
BreadcrumbList

```

83. PERFORMANCE
Target:

```text
LCP < 2.5 seconds
CLS < 0.1
INP < 200ms

```

Use:

```text
Image optimisation
Lazy loading
Pagination
Caching
Server rendering
CDN
Database indexes
Query optimisation

```

84. RESPONSIVE BREAKPOINTS
Support:

```text
Mobile
Tablet
Laptop
Desktop
Large desktop

```

The application must remain usable at approximately:

```text
320px
375px
768px
1024px
1440px+

```

85. PHASED DEVELOPMENT PLAN
PHASE 0: Foundation
Build:

```text
Project setup
TypeScript
Next.js
Database
ORM
Authentication
RBAC
Design system
Environment configuration
CI/CD
Error handling
Logging

```

Deliverable:
A functioning authenticated application shell.
86. PHASE 1: CORE MARKETPLACE
Build:

```text
Users
Profiles
Categories
Listings
Images
Search
Seller profiles
Favorites
Public product pages
Sell wizard

```

Deliverable:
Users can register, create listings, search and contact sellers.
87. PHASE 2: REQUEST MARKETPLACE
Build:

```text
Buyer requests
Request wizard
Request discovery
Seller responses
Request offers
Offer comparison
Accept response

```

Deliverable:
Buyer can publish a need and sellers can respond.
This phase is strategically important because it establishes the platform's reverse marketplace identity.
88. PHASE 3: NEGOTIATION AND ORDERS
Build:

```text
Offers
Counter-offers
Order creation
Order status
Order dashboard
Messaging

```

Deliverable:
Buyer and seller can negotiate and create an order.
89. PHASE 4: PAYMENTS
Build:

```text
Payment abstraction
Paystack integration
Flutterwave integration
Webhooks
Payment verification
Transaction records
Ledger
Refunds
Payout architecture

```

Deliverable:
Users can securely pay for marketplace transactions.
Do not implement a stored-value wallet unless the legal/payment architecture has been reviewed.
90. PHASE 5: REVIEWS AND TRUST
Build:

```text
Ratings
Reviews
Verification
Reports
Moderation
Seller reputation
Transaction history

```

Deliverable:
Trust and reputation infrastructure.
91. PHASE 6: SERVICES
Build:

```text
Service profiles
Service categories
Service requests
Quotes
Booking
Service orders
Service reviews

```

Deliverable:
A functioning services marketplace.
92. PHASE 7: AUCTIONS
Build:

```text
Auction creation
Bidding
Bid validation
Auction timers
Auction closing
Winner determination
Order creation

```

Deliverable:
Functional eBay-style auction capability.
93. PHASE 8: DELIVERY
Build:

```text
Delivery abstraction
Pickup
Seller delivery
Courier integration
Tracking
Proof of delivery
Delivery status

```

Deliverable:
End-to-end fulfilment.
94. PHASE 9: BUSINESS MARKETPLACE
Build:

```text
Business accounts
Business verification
Staff
Inventory
Business analytics
Business storefront

```

Deliverable:
SME and commercial seller capability.
95. PHASE 10: INTELLIGENT MARKETPLACE
Build:

```text
AI search
Recommendation engine
Listing/request matching
Fraud detection
Natural-language request creation
Personalised recommendations

```

Example:

```text
Buyer:
"I need a fairly new laptop under 500k that can run Python and AutoCAD."

AI
  |
  +-- Category: Laptop
  +-- Price <= 500,000
  +-- Condition: Used/Refurbished/New
  +-- Use cases: Python + AutoCAD

```

96. FOLDER STRUCTURE
Use:

```text
src/
│
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── search/
│   │   ├── categories/
│   │   ├── products/
│   │   ├── services/
│   │   ├── requests/
│   │   ├── auctions/
│   │   └── sellers/
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   │
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── buying/
│   │   ├── selling/
│   │   ├── requests/
│   │   ├── services/
│   │   ├── orders/
│   │   ├── offers/
│   │   ├── messages/
│   │   ├── payments/
│   │   └── settings/
│   │
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── users/
│   │   ├── listings/
│   │   ├── requests/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── disputes/
│   │   ├── reports/
│   │   ├── categories/
│   │   └── audit-logs/
│   │
│   └── api/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── marketplace/
│   ├── listings/
│   ├── requests/
│   ├── offers/
│   ├── auctions/
│   ├── orders/
│   ├── messaging/
│   ├── payments/
│   ├── reviews/
│   └── admin/
│
├── features/
│   ├── auth/
│   ├── users/
│   ├── listings/
│   ├── requests/
│   ├── offers/
│   ├── auctions/
│   ├── orders/
│   ├── payments/
│   ├── messaging/
│   ├── reviews/
│   ├── disputes/
│   └── notifications/
│
├── server/
│   ├── auth/
│   ├── services/
│   ├── repositories/
│   ├── policies/
│   ├── validators/
│   └── integrations/
│
├── lib/
│   ├── db/
│   ├── search/
│   ├── storage/
│   ├── payments/
│   ├── notifications/
│   ├── maps/
│   └── security/
│
├── types/
├── hooks/
└── utils/

```

97. CODING STANDARDS
Use:

```text
TypeScript strict mode
ESLint
Prettier
Zod validation
Typed API responses
Reusable domain services
Repository pattern where appropriate
No any unless unavoidable
No duplicated business logic
No business logic inside UI components

```

98. DOMAIN SERVICE RULE
Business logic must not live inside React components.
Bad:

```text
Button -> directly modifies database

```

Good:

```text
UI
 ↓
API
 ↓
Authorization
 ↓
Validation
 ↓
Domain service
 ↓
Repository
 ↓
Database

```

99. TESTING
Implement:
Unit tests
For:

```text
Offer state transitions
Request state transitions
Order state transitions
Payment state transitions
Auction bidding
Authorization
Pricing
Commission calculations

```

Integration tests
For:

```text
Registration
Listing creation
Request creation
Offer acceptance
Order creation
Payment webhook
Refund
Review

```

End-to-end tests
At minimum:

```text
Register -> List -> Search -> Message

Register -> Request -> Receive offer -> Accept -> Order

Seller -> Listing -> Buyer -> Payment -> Delivery -> Review

```

100. PAYMENT TESTING
Create tests for:

```text
Payment success
Payment failure
Duplicate webhook
Delayed webhook
Invalid webhook
Amount mismatch
Currency mismatch
Refund
Partial refund
Payout failure

```

Webhook handlers must be idempotent.
101. IDEMPOTENCY
Important financial operations must support idempotency.
For example:

```http
Idempotency-Key: abc123

```

Use this for:

```text
Create order
Initialize payment
Create payout
Refund

```

A repeated request must not create duplicate financial transactions.
102. ERROR HANDLING
Use structured error codes.
Examples:

```text
AUTH_REQUIRED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
LISTING_UNAVAILABLE
OFFER_EXPIRED
REQUEST_CLOSED
AUCTION_ENDED
PAYMENT_FAILED
PAYMENT_AMOUNT_MISMATCH
ORDER_NOT_CANCELLABLE
DUPLICATE_REVIEW
RATE_LIMITED

```

103. SEED DATA
Create development seed data.
Categories:

```text
Electronics
Vehicles
Property
Fashion
Home & Garden
Agriculture
Construction
Jobs & Services
Phones
Computers
Machinery

```

Create sample:

```text
Users
Sellers
Businesses
Listings
Requests
Offers
Services
Auctions
Orders
Reviews

```

104. ENVIRONMENT VARIABLES
Create:

```text
DATABASE_URL

AUTH_SECRET

NEXT_PUBLIC_APP_URL

STORAGE_ENDPOINT
STORAGE_ACCESS_KEY
STORAGE_SECRET_KEY
STORAGE_BUCKET

PAYSTACK_SECRET_KEY
PAYSTACK_PUBLIC_KEY

FLUTTERWAVE_SECRET_KEY
FLUTTERWAVE_PUBLIC_KEY

EMAIL_PROVIDER_KEY
SMS_PROVIDER_KEY

MAPS_API_KEY

REDIS_URL

SENTRY_DSN

```

Never commit secrets.
Provide:

```text
.env.example

```

with placeholder values only.
105. ADMIN SECURITY
Admin routes must have:

```text
Authentication
RBAC
Permission checks
Audit logging
Session timeout
Optional MFA architecture

```

Never rely on hiding admin links.
106. MODERATION ARCHITECTURE
Listings and requests should support moderation status:

```text
pending
approved
rejected
flagged
removed

```

MVP may allow automatic publishing with user reporting.
Higher-risk categories should be configurable for manual moderation.
107. PROHIBITED CONTENT
Create an admin-configurable prohibited category system.
Do not hard-code prohibited categories into the UI.
Administrators should be able to define:

```text
category
keyword
risk level
action

```

Possible actions:

```text
block
manual review
allow

```

108. PLATFORM COMMISSION
Do not hard-code platform fees.
Create configuration:

```text
platform_fee_percentage
minimum_fee
maximum_fee
category_specific_fee
seller_subscription_discount

```

Fee calculations must be performed server-side.
109. INVENTORY
For physical products, support:

```text
quantity
reserved_quantity
available_quantity

```

Formula:

```text
available = quantity - reserved_quantity

```

Prevent overselling through transactional database operations.
110. CONCURRENCY
Critical operations must use database transactions.
Examples:

```text
Accept offer
Create order
Reserve inventory
Place auction bid
Process payment
Create payout

```

111. AUCTION CONCURRENCY
Auction bidding must use a transactional mechanism.
Two users submitting bids simultaneously must not produce an inconsistent current price.
The database must determine which bid wins.
112. OBSERVABILITY
Implement:

```text
structured logging
error tracking
performance monitoring
database monitoring
payment monitoring
webhook logs
audit logs

```

Track:

```text
API latency
error rates
payment failures
search latency
database latency
queue failures

```

113. ANALYTICS
Track marketplace events:

```text
user_registered
listing_created
listing_viewed
listing_saved
request_created
request_response
offer_created
offer_accepted
order_created
payment_success
payment_failed
delivery_completed
review_created

```

Do not collect unnecessary personal information.
114. KEY MARKETPLACE METRICS
Admin dashboard should eventually track:

```text
GMV
Orders
Completed orders
Average order value
Active buyers
Active sellers
Active requests
Request fulfilment rate
Offer acceptance rate
Seller conversion rate
Buyer conversion rate
Repeat purchase rate
Dispute rate
Refund rate
Platform revenue

```

The most strategically important metric for the reverse marketplace is:
Request fulfilment rate.
This measures whether users actually get what they request.
115. MATCHING ENGINE ARCHITECTURE
Create a future-compatible interface:

```text
MatchingService

```

Inputs:

```text
request
category
location
budget
attributes

```

Outputs:

```text
matching listings
matching sellers
matching services

```

Initial implementation can use deterministic rules.
Later it can use:

```text
semantic search
embeddings
AI ranking
behavioural recommendations

```

116. API VERSIONING
Use:

```text
/api/v1/

```

Example:

```text
/api/v1/listings
/api/v1/requests
/api/v1/orders

```

This allows future API changes without immediately breaking clients.
117. DOCUMENTATION
Create:

```text
README.md
ARCHITECTURE.md
DATABASE.md
API.md
SECURITY.md
PAYMENTS.md
DEPLOYMENT.md
CONTRIBUTING.md

```

Document every major domain.
118. DEVELOPMENT PRINCIPLE
Do not build all phases simultaneously.
Build vertically.
For example:

```text
Authentication
   ↓
Listing creation
   ↓
Listing discovery
   ↓
Listing detail
   ↓
Messaging

```

Then:

```text
Request creation
   ↓
Request discovery
   ↓
Seller response
   ↓
Offer

```

Then:

```text
Offer
   ↓
Order
   ↓
Payment
   ↓
Completion

```

Each phase must result in a working feature rather than disconnected screens.
119. ACCEPTANCE CRITERIA FOR MVP
The MVP is considered functional when:
A user can register.
A user can verify their phone.
A user can create a profile.
A user can publish a product listing.
Another user can discover the listing.
The buyer can view the seller.
The buyer can message the seller.
The buyer can make an offer.
The seller can accept, reject or counter.
An accepted offer can create an order.
The buyer can pay.
The backend verifies payment.
The seller can fulfil the order.
The buyer can confirm completion.
Both sides can review each other.
A buyer can create a request.
A seller can discover the request.
The seller can submit a response.
The buyer can compare responses.
The buyer can accept one response.
The accepted response can become an order.
An administrator can moderate users, listings, requests, orders and reports.
120. IMPORTANT ENGINEERING RULES
Do not:

```text
Build fake payment flows
Trust frontend payment status
Trust frontend prices
Trust frontend user IDs
Allow users to modify other users' records
Store secrets in source code
Store passwords in plaintext
Build financial logic only in the frontend
Hard-code categories
Hard-code commissions
Use microservices unnecessarily
Create duplicated domain logic

```

Do:

```text
Validate server-side
Authorise server-side
Use transactions
Use immutable financial records
Use idempotent payment operations
Use database constraints
Use audit logs
Use typed APIs
Use reusable components
Use migrations
Write tests for critical workflows

```

121. IMPLEMENTATION INSTRUCTION TO CODING AGENT
You are the principal software engineer responsible for building this platform.
Do not generate a superficial marketplace template.
Build the application according to this specification as a production-oriented modular monolith.
Before implementing a feature, understand its complete lifecycle.
For every domain:

```text
Database
 ↓
Repository
 ↓
Domain service
 ↓
Validation
 ↓
Authorization
 ↓
API
 ↓
Frontend
 ↓
Tests

```

must be considered.
Do not implement only the UI.
122. BUILD ORDER
Execute development in this exact order.
Sprint 1

```text
Project setup
Database
ORM
Authentication
RBAC
Design system
Layout

```

Sprint 2

```text
Profiles
Categories
Listings
Images
Search
Seller profiles

```

Sprint 3

```text
Buyer requests
Request responses
Offers
Messaging

```

Sprint 4

```text
Orders
Payment abstraction
Paystack integration
Webhook handling

```

Sprint 5

```text
Reviews
Reports
Moderation
Admin dashboard

```

Sprint 6

```text
Services
Service requests
Service quotations

```

Sprint 7

```text
Auctions
Bidding
Auction settlement

```

Sprint 8

```text
Delivery
Business accounts
Advanced verification
Analytics

```

Sprint 9

```text
Search optimisation
Matching engine
Performance optimisation
Security hardening

```

Sprint 10

```text
End-to-end testing
Production deployment
Monitoring
Documentation

```

123. FINAL PRODUCT STRUCTURE
The completed application should conceptually look like:

```text
                    MARKETPLACE
                         |
       +-----------------+-----------------+
       |                 |                 |
      BUY              SELL             REQUEST
       |                 |                 |
 Products             Products          Products
 Services             Services          Services
 Auctions             Businesses        Bulk Orders
       |                 |                 |
       +-----------------+-----------------+
                         |
                    NEGOTIATION
                         |
                       OFFERS
                         |
                       ORDER
                         |
              +----------+----------+
              |          |          |
           PAYMENT    DELIVERY    CHAT
              |          |          |
              +----------+----------+
                         |
                    COMPLETION
                         |
                       REVIEW
                         |
                    REPUTATION

```

The strategic differentiator remains:

```text
Traditional marketplace:

Seller -> Listing -> Buyer

This platform:

Seller -> Listing -> Buyer

AND

Buyer -> Request -> Sellers

```

The second workflow should be treated as a core product capability, not an add-on.
124. DEFINITION OF DONE
A feature is not considered complete until:

```text
Database schema exists
Migration exists
Backend service exists
Authorization exists
Validation exists
API endpoint exists
Frontend exists
Loading state exists
Error state exists
Empty state exists
Mobile layout works
Tests exist
Audit requirements are addressed
Security requirements are addressed
Documentation is updated

```

Do not mark a feature complete merely because its page renders.
125. FIRST DEVELOPMENT TASK
Begin by generating:

```text
1. Repository structure
2. Next.js application
3. TypeScript configuration
4. Tailwind/shadcn setup
5. PostgreSQL schema
6. Database migrations
7. Authentication
8. RBAC
9. Base application layout
10. Public homepage
11. Dashboard shell
12. Admin shell
13. Seed data
14. Automated tests
15. README

```

Then proceed to the marketplace modules in the defined sprint order.
After each phase, run:

```text
type checking
linting
unit tests
integration tests
build

```

Fix all errors before proceeding to the next phase.
Do not leave placeholder TODO implementations for core business functionality.
When an external integration is not yet configured, create a properly abstracted provider interface and a development/mock implementation, while clearly documenting the production configuration required.
The final application must be deployable, maintainable, secure, responsive and architected for future expansion into native mobile applications, AI-powered matching, logistics and advanced business commerce.
