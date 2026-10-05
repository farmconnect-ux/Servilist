# Servilist UI/UX Design System Specification

Source of truth for the interface. Provided by Quadri on 2026-10-05 and saved here unchanged
apart from this note and the code fence. `docs/MASTER_SPEC.md` governs behaviour and data;
this document governs how the product looks and flows.

```text
Marketplace Platform
Screen-by-Screen UI/UX Design System Specification
Purpose: Production-ready UI/UX specification for a two-sided marketplace combining classified listings, e-commerce, services, auctions, and buyer-request marketplace functionality.
Core marketplace model:
BUY what you need. SELL what you have. REQUEST what you cannot find.
The platform must support two complementary marketplace directions:
Supply side
Seller → Product/Service → Buyer
Demand side
Buyer → Request → Sellers/Service Providers → Offers → Buyer
The UI must make both directions equally important.
1. DESIGN PRINCIPLES
1.1 Product personality
The interface should feel:
Modern
Trustworthy
Commercial
Fast
Local-first
Mobile-friendly
Premium but accessible
Simple enough for first-time marketplace users
Powerful enough for professional sellers
Do not visually copy Craigslist, eBay, Facebook Marketplace, Jiji, Amazon, or other existing marketplaces.
The product should establish its own visual identity.
2. GLOBAL DESIGN TOKENS
2.1 Colour system
Use CSS variables so the entire interface can be rebranded without modifying components.
:root {
  --primary-50: #f0fdf4;
  --primary-100: #dcfce7;
  --primary-200: #bbf7d0;
  --primary-300: #86efac;
  --primary-400: #4ade80;
  --primary-500: #22c55e;
  --primary-600: #16a34a;
  --primary-700: #15803d;
  --primary-800: #166534;
  --primary-900: #14532d;

  --accent-50: #fffbeb;
  --accent-100: #fef3c7;
  --accent-200: #fde68a;
  --accent-500: #f59e0b;
  --accent-600: #d97706;

  --background: #fafaf9;
  --surface: #ffffff;
  --surface-muted: #f5f5f4;

  --text-primary: #18181b;
  --text-secondary: #52525b;
  --text-muted: #71717a;
  --text-disabled: #a1a1aa;

  --border: #e4e4e7;
  --border-strong: #d4d4d8;

  --success: #16a34a;
  --warning: #d97706;
  --danger: #dc2626;
  --info: #2563eb;
}

Primary green communicates marketplace activity, growth and trust.
Amber should be reserved for attention, promotions, auctions and important secondary actions.
Do not make every component green.
3. TYPOGRAPHY
Use Inter or Geist.
Preferred:
Font family:
Inter, system-ui, sans-serif

Typography scale:
ElementDesktopMobile
Hero
48px
32px
H1
40px
28px
H2
32px
24px
H3
24px
20px
H4
20px
18px
Card title
16px
15px
Body
16px
15px
Small
14px
13px
Metadata
12px
12px
Font weights:
400 Regular
500 Medium
600 Semibold
700 Bold

Avoid excessive bold text.
4. SPACING SYSTEM
Use an 8-point spacing system.
4px
8px
12px
16px
24px
32px
48px
64px
80px
96px

Page horizontal padding:
Desktop:
max-width: 1280px
padding: 24px

Tablet:
padding: 20px

Mobile:
padding: 16px

5. BORDER RADIUS
Small controls: 6px
Inputs: 8px
Cards: 12px
Large cards: 16px
Modal: 16px
Hero containers: 20px
Pills: 999px

Avoid excessively rounded interfaces.
6. SHADOW SYSTEM
Use shadows sparingly.
shadow-sm
shadow-md
shadow-lg

Most cards should use:
background: white
border: 1px solid var(--border)

rather than heavy shadows.
7. BUTTON SYSTEM
Primary
Used for:
Buy Now
Sell
Post Request
Accept Offer
Pay Now
Place Bid
States:
Default
Hover
Active
Focus
Loading
Disabled
Success
Error

Example:
[ Buy Now ]

Primary button:
height: 44px
padding: 0 18px
radius: 8px
font-weight: 600

Mobile primary buttons may use 48px height.
Secondary
Used for:
Message Seller
Make Offer
Save
View Details
Ghost
Used for:
Filters
Navigation
Less important actions
Destructive
Used for:
Delete
Cancel Order
Report
Remove Listing
Never use red for normal actions.
8. GLOBAL COMPONENT LIBRARY
Create reusable components before implementing screens.
Button
IconButton
Input
Textarea
Select
Combobox
Checkbox
Radio
Switch
Slider
Tabs
Badge
Avatar
Rating
Tooltip
Popover
Dropdown
Modal
Drawer
Toast
Alert
Skeleton
Pagination
Breadcrumb
Card
ProductCard
ServiceCard
RequestCard
AuctionCard
OfferCard
SellerCard
OrderCard
StatCard
EmptyState
ErrorState
LoadingState
PriceDisplay
LocationDisplay
VerifiedBadge
StatusBadge
ImageGallery
SearchBar
FilterPanel
FileUploader
Stepper
Timeline
ChatMessage
OfferMessage

9. GLOBAL NAVIGATION
Desktop header
Top utility bar
Help | Safety | Sell on [Brand] | Download App

Height:
36px

Main header
LOGO

[ Search products, services or requests... ] [Location]

Categories
Buy
Services
Requests
Auctions

Sell

Messages
Wishlist
Account

Height:
72px

The search bar should be the most visually prominent element in the navigation.
10. MOBILE NAVIGATION
Mobile header:
[Logo]                         [Account]

Below:
[ Search products, services or requests... ]

Bottom navigation:
Home
Search
+ Sell
Requests
Account

The + Sell button should visually stand out.
The mobile navigation must remain fixed.
11. HOMEPAGE
Route:
/

Desktop structure
Header

Hero

Quick Actions

Popular Categories

Featured Products

People Are Looking For

Services Near You

Trending Auctions

Nearby Marketplace

Trust & Safety

App Promotion

Footer

Hero
Large headline:
BUY WHAT YOU NEED.
SELL WHAT YOU HAVE.
REQUEST WHAT YOU CAN'T FIND.

Supporting text:
Buy products, discover services, sell your items,
or tell sellers exactly what you're looking for.

Search:
[ What are you looking for?              ]
[ Location ] [ Search ]

CTA group:
[ Buy Something ]
[ Sell Something ]
[ Post a Request ]

On mobile, stack the CTAs.
12. QUICK ACTIONS
Four large action cards:
Buy
Sell
Request
Find a Service

Each contains:
Icon
Title
Short description
Arrow

Example:
Post a Request
Tell sellers what you need and let them send offers.
→

13. CATEGORY COMPONENT
Desktop:
Popular Categories

[Phones] [Computers] [Vehicles] [Property]
[Fashion] [Electronics] [Home] [Agriculture]
[Machinery] [Services] [Jobs] [More]

Each category:
Icon
Name
Listing count

Mobile:
Horizontal scrolling carousel.
14. PRODUCT CARD
Standard dimensions:
Desktop:
width: 100%
image ratio: 4:3

Structure:
┌─────────────────────┐
│                     │
│       IMAGE         │
│                 ♡   │
├─────────────────────┤
│ Product title       │
│ ₦250,000            │
│ Used · Lagos        │
│ ★ 4.8 · Seller      │
└─────────────────────┘

Hover:
Slight image zoom
Border emphasis
Wishlist remains visible
Do not enlarge the entire card dramatically.
15. PRODUCT DETAILS PAGE
Route:
/listing/:id

Desktop:
Breadcrumb

┌──────────────────────┬────────────────────────┐
│                      │ Product title           │
│                      │ Rating                  │
│    IMAGE GALLERY     │ Price                   │
│                      │ Condition               │
│                      │ Location                │
│                      │                         │
│                      │ [Buy Now]               │
│                      │ [Make Offer]            │
│                      │ [Message Seller]        │
└──────────────────────┴────────────────────────┘

Description

Specifications

Delivery Information

Seller Information

Reviews

Related Listings

Mobile:
Image gallery

Title
Price
Condition
Location
Seller

Description

Specifications

Reviews

Fixed bottom action bar:
[ Message ] [ Make Offer ] [ Buy Now ]

16. IMAGE GALLERY
Desktop:
Large primary image

Thumbnail  Thumbnail
Thumbnail  Thumbnail

Mobile:
Swipeable fullscreen gallery.
Features:
Zoom
Fullscreen
Thumbnail navigation
Image counter
Example:
3 / 8

17. SELLER PROFILE
Route:
/seller/:id

Header:
Avatar
Seller name
Verified badge
Rating
Location
Response rate
Joined date

Stats:
120 Sales
98% Response
4.8 Rating

Actions:
[Message]
[Follow]

Tabs:
Listings
Services
Reviews
About

18. SEARCH RESULTS
Route:
/search?q=

Desktop:
Search header

[Search bar]

Results summary

┌──────────────┬──────────────────────────────┐
│ FILTERS      │ Results                      │
│              │                              │
│ Category     │ Product Product Product      │
│ Price        │ Product Product Product      │
│ Location     │ Product Product Product      │
│ Condition    │                              │
│ Delivery     │ Pagination                   │
│ Rating       │                              │
└──────────────┴──────────────────────────────┘

Tabs:
All
Products
Services
Requests

Mobile:
Results

[ Filters ] [ Sort ]

Product cards

Filter opens as bottom drawer.
19. SEARCH INTELLIGENCE
The search engine must understand marketplace intent.
Example:
"plumber Lagos"

Results may contain:
Products
Services
Requests

Example:
"Toyota Camry 2018"

Results should prioritize:
Vehicles
Listings
Requests

Search should not assume everything is a product.
20. REQUEST MARKETPLACE
This is one of the platform's most important differentiators.
Route:
/requests

Hero:
Can't find what you need?

Tell sellers what you're looking for.
They'll send you offers.

CTA:
[ Post a Request ]

Request feed:
Request Card
Request Card
Request Card

21. REQUEST CARD
Structure:
┌─────────────────────────────┐
│ NEED                         │
│                             │
│ Toyota Camry 2016-2019      │
│                             │
│ Budget: ₦12m                │
│ Location: Lagos             │
│ Needed by: 20 Oct           │
│                             │
│ 7 sellers responded         │
│                             │
│ [View Request]              │
└─────────────────────────────┘

Show:
Request title
Category
Budget
Location
Deadline
Offer count
Buyer verification
22. CREATE REQUEST FLOW
Route:
/requests/create

Do not immediately display a huge form.
First:
What are you looking for?

Large textarea:
Example:
I need a fairly used Toyota Camry between 2016 and 2019,
preferably in good condition and around Lagos.

Button:
Continue

Then progressively reveal:
Category
Budget
Quantity
Location
Required date
Description
Photos
Delivery requirements

Final preview:
[ Publish Request ]

23. REQUEST DETAIL
Route:
/requests/:id

Structure:
Breadcrumb

LOOKING FOR

Toyota Camry 2016-2019

Budget
₦10m - ₦13m

Location
Lagos

Required by
20 October

Buyer
Verified buyer

7 Offers

CTA:
[ Make an Offer ]

For sellers:
Request details
[Make Offer]

For the request owner:
Offers
Compare Offers

24. SELLER OFFER FLOW
Seller clicks:
Make an Offer

Modal/page:
Your Offer

Price
Delivery cost
Delivery time
Condition
Warranty
Additional message

[Send Offer]

Show seller's profile automatically.
25. OFFER CARD
┌───────────────────────────────┐
│ Seller                        │
│ ★ 4.8 · Verified              │
│                               │
│ ₦12,300,000                   │
│ Delivery: 2 days              │
│ Location: Lagos               │
│                               │
│ [View Offer]                  │
└───────────────────────────────┘

Buyer actions:
Accept
Decline
Message
Compare

26. OFFER COMPARISON
Desktop:
                Seller A   Seller B   Seller C

Price           ₦12m       ₦12.3m     ₦11.8m
Rating          4.8        4.7        4.5
Delivery        2 days     1 day      4 days
Location        Lagos      Lagos      Ogun
Verified        ✓          ✓          ✓

                [Accept]   [Accept]   [Accept]

Mobile:
Stack offers vertically.
27. SERVICES MARKETPLACE
Route:
/services

Categories:
Repairs
Cleaning
Construction
Transport
Beauty
Professional Services
Agriculture
Technology
Events
Other

Service card:
Provider
Service
Rating
Jobs completed
Location
Starting price
[Request Quote]

28. SERVICE REQUEST
Structure:
What service do you need?

Describe your problem

Location

Preferred date

Budget

Photos

[Request Quotes]

Providers receive the request and can submit offers.
29. AUCTION MARKETPLACE
Route:
/auctions

Auction card:
IMAGE

Toyota Camry 2018

Current bid
₦10,500,000

12 bids

Ends in
02h 14m

[View Auction]

Use amber sparingly to communicate auction urgency.
30. AUCTION DETAIL
Structure:
Image Gallery

Auction title
Current bid
Minimum next bid
Bid count
Countdown

[Enter Bid]

Seller information

Description

Bid history

The countdown must update in real time.
Near-expiry state:
ENDING SOON

31. SELL FLOW
Route:
/sell

Use a stepper:
01 Type
02 Category
03 Details
04 Photos
05 Price
06 Delivery
07 Preview

Desktop:
Left:
Stepper

Right:
Current form

Mobile:
01 / 07

with a progress bar.
32. SELL, TYPE SCREEN
Options:
Sell a Product
Offer a Service
Create an Auction

Cards with large icons.
33. PRODUCT DETAILS FORM
Fields:
Title
Category
Description
Brand
Condition
Quantity
Location

Use smart suggestions.
Example:
User enters:
iPhone 15 Pro Max

System can suggest:
Category: Phones
Brand: Apple

34. PHOTO UPLOAD
Large drag/drop area desktop.
Mobile:
[ + Add Photos ]

Requirements:
Minimum: 1
Recommended: 5+
Maximum: platform-defined

Allow:
Reorder
Delete
Set cover image
Preview
35. PRICE SCREEN
Show:
Price
Quantity
Negotiable?

If negotiable:
Allow offers

For auctions:
Starting bid
Bid increment
Auction duration

36. DELIVERY SCREEN
Options:
Pickup
Seller delivery
Platform delivery
Buyer arrangement

Location picker:
City
Area
Address

Do not require unnecessary address information for public listings.
37. LISTING PREVIEW
Show the exact buyer-facing appearance.
Preview

[Listing]

[ Edit ]
[ Publish Listing ]

After publishing:
Listing published successfully.

CTA:
View Listing
Manage Listing
Share

38. CHECKOUT
Route:
/checkout

Desktop:
Checkout

┌─────────────────────────────┬─────────────────────┐
│ Delivery                    │ Order Summary       │
│ Address                     │                     │
│ Delivery method             │ Item                │
│ Payment method              │ Price               │
│                             │ Delivery             │
│                             │ Platform fee        │
│                             │ Total               │
│                             │                     │
│                             │ [Pay Now]           │
└─────────────────────────────┴─────────────────────┘

Mobile:
Order summary should be collapsible.
39. PAYMENT UI
Payment options:
Card
Bank Transfer
Other supported methods

Show:
Item
Delivery
Platform fee
Total

Never hide platform fees until the final screen.
40. ORDER CONFIRMATION
Success screen:
✓ Payment successful

Order #123456

Your order has been confirmed.

Actions:
[Track Order]
[View Order]
[Continue Shopping]

41. ORDER TRACKING
Use a visual timeline:
✓ Payment confirmed
      |
✓ Seller preparing
      |
● Shipped
      |
○ Delivered
      |
○ Completed

Each stage displays:
Status
Timestamp
Relevant information

42. BUYER DASHBOARD
Route:
/dashboard

Header:
Good morning, Quadri

Quick actions:
Buy
Sell
Request
Find Service

Stats:
Orders
Requests
Offers
Messages

Sections:
Recent Orders
My Requests
Saved Listings
Recommended for You

43. SELLER DASHBOARD
Route:
/seller/dashboard

Stats:
Sales this month
Orders
Active listings
Unread messages

Action-required panel:
3 offers waiting
2 orders need fulfilment
1 listing expiring

Revenue chart:
7 days
30 days
90 days
1 year

44. LISTING MANAGEMENT
Route:
/dashboard/listings

Tabs:
Active
Draft
Sold
Expired
Archived

Desktop table:
Image
Product
Price
Views
Offers
Status
Actions

Mobile cards.
Actions:
Edit
Pause
Promote
Delete
Duplicate

45. ORDER MANAGEMENT
Seller view:
New
Processing
Shipped
Delivered
Completed
Cancelled

Order card/table:
Order
Buyer
Item
Amount
Status
Date
Action

46. MESSAGING
Route:
/messages

Desktop:
┌───────────────┬──────────────────────────────┐
│ Conversations │ Chat                         │
│               │                              │
│ Seller A      │ Product context              │
│ Seller B      │                              │
│ Buyer C       │ Messages                    │
│               │                              │
│               │ [Type message...]            │
└───────────────┴──────────────────────────────┘

Every marketplace conversation should display context.
Example:
You're discussing:

Toyota Camry 2018
₦12,000,000

View Listing

47. STRUCTURED CHAT OFFERS
Offers must not appear as plain text.
Chat card:
OFFER

₦11,800,000

Delivery: Included
Valid until: 20 Oct

[Accept] [Decline]

This connects messaging directly to transactions.
48. WISHLIST
Route:
/wishlist

Tabs:
Listings
Services
Auctions

Grid of cards.
Empty state:
Nothing saved yet.

Save items you like and find them here later.

[Start Shopping]

49. NOTIFICATIONS
Route:
/notifications

Group:
Today
Yesterday
Earlier

Examples:
A seller responded to your request.
Your payment was confirmed.
Your listing received a new offer.
Your auction ends soon.

Each notification should link directly to the relevant object.
50. PROFILE
Route:
/profile

Sections:
Profile Information
Contact Information
Verification
Addresses
Payment Methods
Notifications
Privacy
Security
Selling Preferences
Business Information

51. VERIFICATION
Display verification progressively.
Phone verified ✓
Email verified ✓
Identity verified ✓
Business verified ✓

Avoid overwhelming users with badges.
Seller cards should show only the most relevant badge.
52. ADMIN DASHBOARD
Route:
/admin

Desktop sidebar:
Dashboard
Users
Listings
Requests
Offers
Orders
Payments
Auctions
Services
Reports
Disputes
Verification
Categories
Settings

Main dashboard:
GMV
Transactions
Active Users
Active Listings
Requests
Offers
Disputes

Charts:
Revenue
Transactions
New Users
Listings

53. ADMIN USER MANAGEMENT
Table:
User
Role
Verification
Listings
Orders
Status
Joined
Actions

Actions:
View
Suspend
Verify
Restrict

Use confirmation dialogs for destructive actions.
54. ADMIN LISTING MODERATION
Queue:
Pending
Reported
Flagged
Approved
Rejected

Moderation screen:
Listing preview

Seller
Category
Price
Images
Description

Reports

[Approve]
[Reject]
[Request Changes]

55. DISPUTE MANAGEMENT
Structure:
Dispute #1234

Buyer
Seller
Order
Amount

Issue
Evidence
Messages

Timeline

Admin decision

Actions:
Resolve for buyer
Resolve for seller
Partial resolution
Request more evidence

56. EMPTY STATES
Every major page must have a designed empty state.
Example:
No requests yet.

Tell sellers what you're looking for
and let them come to you.

[Post a Request]

Never show a completely blank screen.
57. LOADING STATES
Use skeleton loaders.
Product card:
████████████
████████
██████

Do not display spinning loaders for every small operation.
Use skeletons for page-level content.
58. ERROR STATES
Example:
Something went wrong.

We couldn't load this listing.
Please try again.

[Try Again]

Never expose raw API errors.
Bad:
500 Internal Server Error

Good:
We couldn't load your listings.
Please try again.

59. TOAST SYSTEM
Success:
Listing published successfully.

Warning:
Your listing expires in 2 days.

Error:
Payment failed. Please try another payment method.

Information:
Your offer has been sent to the seller.

Toasts should not contain critical information that disappears permanently.
60. RESPONSIVE BREAKPOINTS
Use:
xs: 480px
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px

Desktop:
≥ 1024px

Tablet:
768px - 1023px

Mobile:
< 768px

61. RESPONSIVE RULES
Navigation
Desktop:
Full navigation.
Mobile:
Bottom navigation.
Product grids
Desktop:
4 columns

Large desktop:
5 columns

Tablet:
3 columns

Mobile:
2 columns

Request cards
Desktop:
Grid.
Mobile:
Single column.
Dashboard
Desktop:
Sidebar + content.
Mobile:
Top navigation + content.
Tables
Desktop:
Real table.
Mobile:
Convert to cards.
Never force users to horizontally scroll wide tables unless absolutely necessary.
62. MOBILE-FIRST PRINCIPLE
All major actions must be comfortable with one hand.
Minimum touch target:
44px

Prefer:
48px

Important mobile actions should remain visible.
For product pages:
Message
Make Offer
Buy Now

should remain accessible through a sticky bottom action bar.
63. ACCESSIBILITY
Target:
WCAG 2.2 AA

Requirements:
Keyboard navigation
Visible focus states
Proper semantic HTML
Accessible labels
Alt text
Sufficient colour contrast
Screen reader support
No colour-only status indicators
Minimum 44px touch targets
Modal focus trapping
Escape closes dialogs
Error messages associated with inputs
64. COMPONENT STATES
Every interactive component must support:
Default
Hover
Focus
Active
Disabled
Loading
Success
Error
Selected

Do not build only the happy path.
65. IMAGE RULES
Product images should:
object-fit: cover

Primary gallery:
object-fit: contain

Images should use lazy loading except for above-the-fold content.
Provide placeholders when images are unavailable.
66. ICONOGRAPHY
Use a consistent icon library such as:
Lucide

Icons should generally be:
16px
20px
24px

Do not mix multiple icon styles.
67. PAGE TRANSITIONS
Keep transitions subtle.
Recommended:
150ms - 250ms

Use transitions for:
Hover
Drawer
Modal
Dropdown
Button state
Image changes
Avoid excessive animation.
68. DESIGN SYSTEM FILE STRUCTURE
Recommended frontend structure:
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx
│   │   ├── categories/
│   │   ├── services/
│   │   ├── requests/
│   │   └── auctions/
│   │
│   ├── (marketplace)/
│   │   ├── search/
│   │   ├── listings/
│   │   ├── services/
│   │   ├── requests/
│   │   └── auctions/
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── listings/
│   │   ├── orders/
│   │   ├── requests/
│   │   ├── offers/
│   │   ├── messages/
│   │   └── settings/
│   │
│   ├── checkout/
│   ├── seller/
│   └── admin/
│
├── components/
│   ├── ui/
│   ├── navigation/
│   ├── marketplace/
│   ├── products/
│   ├── services/
│   ├── requests/
│   ├── auctions/
│   ├── checkout/
│   ├── dashboard/
│   ├── messaging/
│   └── admin/
│
├── lib/
├── hooks/
├── types/
├── services/
└── styles/

69. COMPONENT ARCHITECTURE
Do not build pages as giant components.
Bad:
ProductPage.tsx

containing everything.
Preferred:
ProductPage
├── Breadcrumb
├── ProductGallery
├── ProductSummary
│   ├── PriceDisplay
│   ├── Rating
│   ├── VerificationBadge
│   └── ProductActions
├── SellerCard
├── ProductDescription
├── ProductSpecifications
├── DeliveryInformation
├── Reviews
└── RelatedProducts

70. REQUEST COMPONENT ARCHITECTURE
RequestPage
├── RequestHeader
├── RequestSummary
├── RequestDetails
├── BuyerCard
├── RequestStats
├── OfferList
│   ├── OfferCard
│   ├── OfferCard
│   └── OfferCard
└── RequestActions

71. DASHBOARD COMPONENT ARCHITECTURE
DashboardLayout
├── Sidebar
├── MobileHeader
└── DashboardContent
    ├── DashboardHeader
    ├── QuickActions
    ├── StatsGrid
    ├── ActionRequired
    ├── RecentOrders
    ├── RecentRequests
    └── Recommendations

72. DESIGN SYSTEM DOCUMENTATION
Create a dedicated design system route:
/design-system

Only accessible in development/admin environments.
Show:
Colours
Typography
Buttons
Inputs
Cards
Badges
Modals
Tables
Tabs
Toasts
Forms
Loading
Errors
Empty States

This becomes the visual source of truth for the entire application.
73. UX FLOW, BUYER
Homepage
    ↓
Search
    ↓
Results
    ↓
Product
    ↓
Seller
    ↓
Buy / Make Offer
    ↓
Checkout
    ↓
Payment
    ↓
Order Tracking
    ↓
Delivery
    ↓
Review

74. UX FLOW, REQUEST
Homepage
    ↓
Post Request
    ↓
Describe Need
    ↓
Set Budget
    ↓
Set Location
    ↓
Publish
    ↓
Receive Offers
    ↓
Compare
    ↓
Message Seller
    ↓
Accept Offer
    ↓
Checkout
    ↓
Fulfilment
    ↓
Review

75. UX FLOW, SELLER
Dashboard
    ↓
Sell
    ↓
Select Product / Service / Auction
    ↓
Create Listing
    ↓
Publish
    ↓
Receive Views
    ↓
Receive Messages / Offers
    ↓
Accept Order
    ↓
Fulfil
    ↓
Payment
    ↓
Review

76. UX FLOW, SERVICE PROVIDER
Services
    ↓
Browse Requests
    ↓
Open Service Request
    ↓
Make Offer
    ↓
Buyer Accepts
    ↓
Schedule
    ↓
Complete Service
    ↓
Payment
    ↓
Review

77. TRUST ARCHITECTURE
Trust should be visible throughout the entire transaction.
At minimum:
Verified Identity
Verified Phone
Verified Business
Seller Rating
Completed Transactions
Response Rate

Show trust information near the decision point.
Do not hide trust information inside profile settings.
78. LOCATION EXPERIENCE
Marketplace discovery should support:
Country
State
City
Area
Distance

Examples:
Lagos
Ikeja
Lekki
Surulere
Ibadan
Port Harcourt
Abuja

Users should be able to search locally or nationally.
79. SEARCH FILTER UX
Filters should be contextual.
Product:
Category
Price
Condition
Brand
Location
Delivery
Rating

Services:
Service type
Location
Price
Rating
Availability

Requests:
Category
Budget
Location
Deadline

Auctions:
Category
Current bid
Ending soon
Location

80. CHECKOUT TRUST DESIGN
Before payment, display:
Seller
Product
Price
Delivery
Platform fee
Total
Protection information

Example:
Your payment is protected while the order is being fulfilled.

The exact wording should be adjusted to the platform's actual payment and escrow model.
81. SELLER TRUST DESIGN
Seller dashboard should show:
Profile completion
Verification progress
Response rate
Rating
Sales

Example:
Your seller profile is 80% complete.

[Complete Profile]

82. REQUEST TRUST DESIGN
Buyer requests should also display trust.
Example:
Quadri O.
✓ Identity verified
★ 4.9
12 completed purchases

This reduces low-quality requests and improves seller confidence.
83. PERFORMANCE UX
The UI should feel fast even on slower connections.
Implement:
Image optimization
Lazy loading
Skeleton loading
Optimistic UI where safe
Pagination/infinite loading
Debounced search
Cached queries
Responsive image sizes
Avoid blocking the entire page for small operations.
84. SEO
Public marketplace pages should be indexable.
Important routes:
/
 /categories/*
/listings/*
/services/*
/requests/*
/auctions/*
/seller/*

Use:
Metadata
Open Graph
Structured data
Canonical URLs
SEO-friendly titles

Private dashboard pages should not be indexed.
85. FINAL VISUAL HIERARCHY
Every page should answer these questions immediately:
What is this?
Page title.
What can I do?
Primary CTA.
What information matters?
Main content.
Can I trust this?
Verification, ratings and reputation.
What happens next?
Clear action.
86. MOST IMPORTANT UX RULE
The application should never force users to understand the entire marketplace before they can use it.
A new user should be able to open the homepage and immediately understand:
I can BUY.
I can SELL.
I can REQUEST.
I can FIND A SERVICE.

Everything else should progressively reveal itself.
87. IMPLEMENTATION PRIORITY
Build in this order:
Phase 1, Design System
Tokens
Typography
Buttons
Inputs
Cards
Navigation
Modal
Drawer
Toast
Forms
Responsive system

Phase 2, Public Marketplace
Homepage
Search
Categories
Product listing
Product details
Seller profile
Services
Requests
Auctions

Phase 3, Authentication
Sign up
Login
OTP
Profile
Verification

Phase 4, Seller
Sell flow
Listing management
Seller dashboard
Order management

Phase 5, Buyer
Buyer dashboard
Wishlist
Orders
Requests
Offers

Phase 6, Transactions
Checkout
Payments
Orders
Tracking
Reviews

Phase 7, Communication
Messages
Structured offers
Notifications

Phase 8, Admin
Admin dashboard
Moderation
Users
Listings
Payments
Disputes
Verification

Phase 9, Polish
Accessibility
SEO
Performance
Animations
Empty states
Error states
Loading states
Mobile optimisation

88. CODING AGENT INSTRUCTION
Build the interface as a production-grade design system, not as isolated page mockups.
Every screen must:
Reuse the global design tokens.
Reuse shared components.
Work on desktop, tablet and mobile.
Support loading, empty, error and success states.
Support keyboard accessibility.
Maintain consistent spacing and typography.
Maintain consistent button hierarchy.
Maintain consistent card behaviour.
Never introduce arbitrary colours.
Never introduce arbitrary border radii.
Never create duplicate components when an existing component can be reused.
Never hide critical actions behind unnecessary menus.
Never make users horizontally scroll on mobile unless unavoidable.
Keep primary actions visually obvious.
Treat buyer requests as a first-class marketplace object.
Treat services as a first-class marketplace object.
Treat offers as structured transactional objects, not ordinary messages.
Maintain consistent trust signals throughout the marketplace.
Use responsive layouts rather than separate desktop and mobile applications.
Keep business logic separate from presentation components.
The final application should feel like one coherent marketplace product, not a combination of Craigslist, eBay and a service marketplace.
The primary UX loop must always remain:
DISCOVER
    ↓
DECIDE
    ↓
CONTACT / OFFER
    ↓
TRANSACT
    ↓
FULFIL
    ↓
REVIEW
    ↓
BUILD TRUST

The defining product loop is:
BUY
SELL
REQUEST

with:
SERVICES
AUCTIONS
OFFERS
MESSAGING
PAYMENTS
REVIEWS

supporting the core marketplace.
```
