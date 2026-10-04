import {
  BuyerShipment,
  PurchaseReceipt,
  WishlistItem,
  BuyerMessage,
  ShippingAddress,
  SavedPaymentMethod,
  SellerSalesMetrics,
  SellerFulfillmentOrder,
  CustomerInquiry,
  SellerFinanceSummary,
  PlatformAnalyticsMetrics,
  ActivityFeedItem,
  VendorComplianceRecord,
  SplitPayoutConfig,
  VendorPayoutHold,
  VendorPayoutRequest,
  CatalogOversightPolicy,
  ProhibitedScanItem,
  VendorScorecard,
  AdminDisputeCase,
  AdminAuditLog,
  SystemAnnouncement,
} from './types';

// =============================================================
// Buyer Initial Seed State
// =============================================================
export const INITIAL_BUYER_SHIPMENTS: BuyerShipment[] = [
  {
    id: 'ship-101',
    orderNumber: 'ORD-NBO-8472',
    itemTitle: '5kVA Solar Hybrid Inverter + Lithium Battery',
    sellerName: 'Nairobi Green Power Solutions',
    courier: 'Sendy Express Africa',
    trackingNumber: 'SND-KE-992384',
    originCity: 'Nairobi, Kenya',
    destinationCity: 'Lagos, Nigeria',
    amountMinor: 245000000, // 2,450,000 NGN
    currency: 'NGN',
    estimatedDelivery: 'Oct 06, 2026',
    currentStep: 3,
    statusText: 'In Transit &bull; Arrived at Lagos Murtala Hub',
    otpCode: '829471',
  },
  {
    id: 'ship-102',
    orderNumber: 'ORD-ACC-3921',
    itemTitle: 'Apple MacBook Pro M3 Max (36GB / 1TB SSD)',
    sellerName: 'Kigali Premium Gadgets',
    courier: 'DHL Africa Air Express',
    trackingNumber: 'DHL-GH-482019',
    originCity: 'Kigali, Rwanda',
    destinationCity: 'Accra, Ghana',
    amountMinor: 385000000, // 3,850,000 NGN
    currency: 'NGN',
    estimatedDelivery: 'Oct 08, 2026',
    currentStep: 2,
    statusText: 'Dispatched &bull; Awaiting Regional Air Freight',
    otpCode: '310948',
  },
  {
    id: 'ship-103',
    orderNumber: 'ORD-LOS-1194',
    itemTitle: 'Toyota Hilux 4x4 Heavy Duty Roof Rack & Bull Bar',
    sellerName: 'Joburg 4x4 Outfitters',
    courier: 'GIG Logistics International',
    trackingNumber: 'GIG-NG-773120',
    originCity: 'Johannesburg, South Africa',
    destinationCity: 'Lagos, Nigeria',
    amountMinor: 95000000, // 950,000 NGN
    currency: 'NGN',
    estimatedDelivery: 'Oct 05, 2026',
    currentStep: 1,
    statusText: 'Confirmed &bull; Payment Secured in Escrow Vault',
    otpCode: '582103',
  },
];

export const INITIAL_PURCHASE_RECEIPTS: PurchaseReceipt[] = [
  {
    id: 'rcp-901',
    receiptNumber: 'RCP-2026-0881',
    date: 'Sep 29, 2026',
    itemTitle: 'Starlink Gen 3 Satellite Kit (Pan-African Roam)',
    sellerName: 'TechVanguard West Africa',
    amountMinor: 85000000,
    currency: 'NGN',
    paymentMethod: 'Paystack Card Checkout',
    status: 'completed',
  },
  {
    id: 'rcp-902',
    receiptNumber: 'RCP-2026-0744',
    date: 'Sep 22, 2026',
    itemTitle: 'Commercial Cassava Grinder & Motor (Stainless)',
    sellerName: 'Ibadan Agrik Equipment Co.',
    amountMinor: 42000000,
    currency: 'NGN',
    paymentMethod: 'Escrow Bank Transfer',
    status: 'completed',
  },
  {
    id: 'rcp-903',
    receiptNumber: 'RCP-2026-0612',
    date: 'Sep 14, 2026',
    itemTitle: 'DJI Mini 4 Pro Fly More Combo',
    sellerName: 'Accra Aerial Imaging',
    amountMinor: 110000000,
    currency: 'NGN',
    paymentMethod: 'MTN Mobile Money',
    status: 'completed',
  },
];

export const INITIAL_WISHLIST: WishlistItem[] = [
  {
    id: 'wsh-01',
    listingId: 'serv-1',
    title: '5kVA Hybrid Solar Inverter (Pure Sine Wave)',
    category: 'solar',
    city: 'Lagos, Nigeria',
    priceMinor: 185000000,
    currency: 'NGN',
    targetAlertPriceMinor: 170000000,
    priceAlertEnabled: true,
    inStock: true,
    imageUrl:
      'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'wsh-02',
    listingId: 'serv-2',
    title: 'Sony Alpha A7 IV Mirrorless Camera Body',
    category: 'electronics',
    city: 'Nairobi, Kenya',
    priceMinor: 240000000,
    currency: 'NGN',
    targetAlertPriceMinor: 220000000,
    priceAlertEnabled: false,
    inStock: true,
    imageUrl:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'wsh-03',
    listingId: 'serv-3',
    title: 'Automatic Drip Irrigation Kit for 1-Acre Farm',
    category: 'agriculture',
    city: 'Kigali, Rwanda',
    priceMinor: 65000000,
    currency: 'NGN',
    targetAlertPriceMinor: 60000000,
    priceAlertEnabled: true,
    inStock: true,
    imageUrl:
      'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=500&q=80',
  },
];

export const INITIAL_BUYER_MESSAGES: BuyerMessage[] = [
  {
    id: 'msg-01',
    sellerName: 'Nairobi Green Power Solutions',
    sellerAvatar: 'NG',
    itemTitle: '5kVA Solar Hybrid Inverter',
    lastMessage: 'The Sendy courier has picked up the unit. Tracking ID attached.',
    timestamp: '12 mins ago',
    unreadCount: 1,
  },
  {
    id: 'msg-02',
    sellerName: 'Ikeja Certified Electronics Hub',
    sellerAvatar: 'IC',
    itemTitle: 'Dell XPS 15 9530 Core i9',
    lastMessage: 'Yes, original warranty receipt from Dell South Africa is included.',
    timestamp: '2 hours ago',
    unreadCount: 0,
  },
  {
    id: 'msg-03',
    sellerName: 'Accra Artisan Guild',
    sellerAvatar: 'AA',
    itemTitle: 'Custom Teak Executive Office Desk',
    lastMessage: 'Dimensions verified: 180cm x 90cm. Ready for safe inspection.',
    timestamp: '1 day ago',
    unreadCount: 0,
  },
];

export const INITIAL_SHIPPING_ADDRESSES: ShippingAddress[] = [
  {
    id: 'addr-01',
    label: 'Primary Residence (Lagos)',
    recipientName: 'John Doe',
    phone: '+234 803 123 4567',
    street: '14 Admiralty Way, Lekki Phase 1',
    city: 'Lagos',
    country: 'Nigeria',
    isDefault: true,
  },
  {
    id: 'addr-02',
    label: 'Regional Office (Nairobi)',
    recipientName: 'John Doe (Servilist East Africa)',
    phone: '+254 712 987 654',
    street: 'The Promenade, 5th Floor, General Mathenge Drive, Westlands',
    city: 'Nairobi',
    country: 'Kenya',
    isDefault: false,
  },
];

export const INITIAL_PAYMENT_METHODS: SavedPaymentMethod[] = [
  {
    id: 'pm-01',
    type: 'mobile_money',
    provider: 'M-Pesa Kenya',
    accountIdentifier: '+254 712 *** 654 (Safaricom)',
    isDefault: true,
  },
  {
    id: 'pm-02',
    type: 'card',
    provider: 'Visa Debit (Access Bank Nigeria)',
    accountIdentifier: '•••• •••• •••• 5192 (Exp 08/29)',
    isDefault: false,
  },
  {
    id: 'pm-03',
    type: 'mobile_money',
    provider: 'MTN MoMo Ghana',
    accountIdentifier: '+233 24 555 ***9',
    isDefault: false,
  },
];

// =============================================================
// Seller Initial Seed State
// =============================================================
export const INITIAL_SELLER_METRICS: SellerSalesMetrics = {
  grossRevenueMinor: 4850000000, // ₦48.5M GMV
  currency: 'NGN',
  totalOrdersCount: 142,
  avgOrderValueMinor: 34154929, // ~₦341k AOV
  conversionRatePercent: 4.8,
  returnRatePercent: 0.6,
  periodGrowthPercent: 24.5,
};

export const INITIAL_SELLER_FULFILLMENTS: SellerFulfillmentOrder[] = [
  {
    id: 'ful-1',
    orderCode: 'SLR-ORD-771',
    buyerName: 'Amina Bello',
    itemTitle: 'Commercial Maize Sheller (5.5HP Honda Engine)',
    destinationCity: 'Kano, Nigeria',
    amountMinor: 85000000,
    currency: 'NGN',
    status: 'awaiting_dispatch',
    courier: 'GIG Logistics Express',
    waybillNumber: 'PENDING-GEN',
    createdAt: 'Today, 09:15 AM',
  },
  {
    id: 'ful-2',
    orderCode: 'SLR-ORD-768',
    buyerName: 'David Mwangi',
    itemTitle: 'Victron MultiPlus-II 48/5000 Inverter Charger',
    destinationCity: 'Nairobi, Kenya',
    amountMinor: 210000000,
    currency: 'NGN',
    status: 'dispatched',
    courier: 'Sendy Cargo Inter-State',
    waybillNumber: 'WB-SND-90182',
    createdAt: 'Yesterday, 14:30 PM',
  },
  {
    id: 'ful-3',
    orderCode: 'SLR-ORD-752',
    buyerName: 'Kwame Mensah',
    itemTitle: 'Caterpillar 15kVA Diesel Soundproof Generator',
    destinationCity: 'Accra, Ghana',
    amountMinor: 450000000,
    currency: 'NGN',
    status: 'delivered',
    courier: 'Bosta West Africa Freight',
    waybillNumber: 'WB-BST-33190',
    createdAt: 'Sep 28, 2026',
  },
];

export const INITIAL_SELLER_INQUIRIES: CustomerInquiry[] = [
  {
    id: 'inq-1',
    buyerName: 'Emeka Okafor',
    itemTitle: 'Felicity 10kWh LiFePO4 Lithium Battery',
    inquiryType: 'Pre-sale',
    subject: 'BMS compatibility with Deye inverters?',
    message: 'Hello, does this battery communicate via CAN bus with 8kW Deye hybrid inverters?',
    status: 'open',
    date: '35 mins ago',
  },
  {
    id: 'inq-2',
    buyerName: 'Zainab Touré',
    itemTitle: 'Automatic Peanut Butter Processing Machine',
    inquiryType: 'Delivery Status',
    subject: 'Waybill tracking link update',
    message: 'Could you share the courier waypoint scan link for the Abidjan shipment?',
    status: 'open',
    date: '3 hours ago',
  },
  {
    id: 'inq-3',
    buyerName: 'Peter Kamau',
    itemTitle: '10-Pack Solar Streetlights (100W)',
    inquiryType: 'Return Request',
    subject: 'One bracket damaged in transit',
    message:
      'One pole mounting bracket arrived bent during transport. Can you send a replacement bracket?',
    status: 'resolved',
    date: '1 day ago',
  },
];

export const INITIAL_SELLER_FINANCE: SellerFinanceSummary = {
  availablePayoutMinor: 320000000, // ₦3.2M available
  pendingEscrowMinor: 295000000, // ₦2.95M in escrow
  platformFeesMinor: 16000000, // ₦160k (5% commission)
  totalEarningsMinor: 4850000000,
  currency: 'NGN',
  payoutDestination: 'Access Bank Nigeria • Acct: •••• 9210 (John Doe Enterprise)',
  payoutHistory: [
    {
      id: 'po-1',
      reference: 'PAYOUT-2026-09-30',
      date: 'Sep 30, 2026',
      amountMinor: 185000000,
      destination: 'Access Bank NGN (Direct EFT)',
      status: 'completed',
    },
    {
      id: 'po-2',
      reference: 'PAYOUT-2026-09-15',
      date: 'Sep 15, 2026',
      amountMinor: 240000000,
      destination: 'Access Bank NGN (Direct EFT)',
      status: 'completed',
    },
  ],
};

// =============================================================
// Admin Initial Seed State (Multi-Vendor Oversight)
// =============================================================
export const INITIAL_ADMIN_METRICS: PlatformAnalyticsMetrics = {
  gmvMinor: 12480000000, // ₦124.8M platform GMV
  currency: 'NGN',
  netCommissionEarnedMinor: 624000000, // ₦6.24M (5% net commission)
  commissionRatePercent: 5.0,
  dailyActiveUsers: 8420,
  monthlyActiveUsers: 72600,
  newBuyersThisMonth: 1840,
  newSellersThisMonth: 342,
  conversionRatePercent: 4.2,
};

export const INITIAL_ACTIVITY_FEEDS: ActivityFeedItem[] = [
  {
    id: 'act-1',
    type: 'transaction',
    message:
      'Escrow Order ESC-8921 funded: ₦2,450,000 for Solar Inverter (Lagos ➔ Nairobi corridor).',
    timestamp: '3 mins ago',
    severity: 'success',
  },
  {
    id: 'act-2',
    type: 'system_alert',
    message: 'High auction bid volume on MacBook Pro M3 (14 bids in 8 minutes).',
    timestamp: '18 mins ago',
    severity: 'info',
  },
  {
    id: 'act-3',
    type: 'transaction',
    message:
      'Automated Stripe Connect split payout triggered: ₦1,850,000 to vendor, ₦97,368 net platform cut.',
    timestamp: '42 mins ago',
    severity: 'success',
  },
  {
    id: 'act-4',
    type: 'error_log',
    message:
      'Payment gateway webhook timeout from Safaricom M-Pesa sandbox (retried successfully).',
    timestamp: '1 hour ago',
    severity: 'warning',
  },
];

// 1. Vendor Compliance Records
export const INITIAL_VENDOR_COMPLIANCE: VendorComplianceRecord[] = [
  {
    id: 'vcomp-1',
    vendorName: 'Kofi Mensah',
    businessName: 'Accra Agro-Mechanics Ltd',
    country: 'Ghana',
    city: 'Accra',
    businessLicenseNo: 'GH-CS-2023-89102',
    taxId: 'TIN-P00293102-GH',
    kycStatus: 'verified',
    commissionTier: 'Growth (3.5%)',
    storefrontApproval: 'approved',
    customReturnPolicy:
      '7-day replacement guarantee for verified mechanical flaws; return freight shared 50/50.',
    storeBio:
      'Authorized West African distributor for Tier-1 agro-processing engines and harvesting gear.',
    submittedAt: 'Today, 08:30 AM',
  },
  {
    id: 'vcomp-2',
    vendorName: 'Fatima Al-Mansoor',
    businessName: 'Nile Valley Solar Engineering',
    country: 'Egypt',
    city: 'Cairo',
    businessLicenseNo: 'EG-CR-9921820',
    taxId: 'ETA-991823-EG',
    kycStatus: 'pending_review',
    commissionTier: 'Standard (5.0%)',
    storefrontApproval: 'pending',
    customReturnPolicy: '14 days unboxed return; buyer bears insured DHL freight.',
    storeBio:
      'Clean energy contractor specializing in micro-grid hybrid storage across North Africa.',
    submittedAt: 'Yesterday, 16:45 PM',
  },
  {
    id: 'vcomp-3',
    vendorName: 'Thabo Ndlovu',
    businessName: 'Gauteng Industrial Parts Depot',
    country: 'South Africa',
    city: 'Johannesburg',
    businessLicenseNo: 'ZA-CIPC-2021/77102',
    taxId: 'SARS-90182910',
    kycStatus: 'verified',
    commissionTier: 'Standard (5.0%)',
    storefrontApproval: 'approved',
    customReturnPolicy:
      'Strict 48-hour physical inspection warranty prior to handover OTP release.',
    storeBio:
      'OEM commercial truck spares, mining gear, and hydraulic parts with SABS certification.',
    submittedAt: 'Sep 27, 2026',
  },
  {
    id: 'vcomp-4',
    vendorName: 'Chidi Nwosu',
    businessName: 'Lagos Fast Deals & Gadgets',
    country: 'Nigeria',
    city: 'Lagos',
    businessLicenseNo: 'RC-UNVERIFIED-99',
    taxId: 'FIRS-PENDING',
    kycStatus: 'rejected',
    commissionTier: 'Standard (5.0%)',
    storefrontApproval: 'restricted',
    customReturnPolicy: 'No refunds on discounted electronics (Violates platform policy).',
    storeBio: 'Wholesale clearance lot for electronics.',
    submittedAt: 'Sep 15, 2026',
  },
];

// 2. Financial Automation & Split Payouts
export const INITIAL_SPLIT_CONFIG: SplitPayoutConfig = {
  routerEngine: 'Stripe Connect',
  automatedSplitActive: true,
  defaultCommissionPercent: 5.0,
  autoVatWithholding: true,
  regionalVatRules: [
    { region: 'Nigeria (FIRS)', vatRatePercent: 7.5 },
    { region: 'Kenya (KRA)', vatRatePercent: 16.0 },
    { region: 'Ghana (GRA)', vatRatePercent: 15.0 },
    { region: 'South Africa (SARS)', vatRatePercent: 15.0 },
    { region: 'Rwanda (RRA)', vatRatePercent: 18.0 },
  ],
};

export const INITIAL_PAYOUT_HOLDS: VendorPayoutHold[] = [
  {
    id: 'hld-1',
    vendorName: 'Lagos Fast Deals & Gadgets',
    heldAmountMinor: 125000000,
    currency: 'NGN',
    holdReason: 'High customer dispute volume (> 4.5% defect claim rate within 14 days).',
    chargebackCount: 3,
    status: 'held',
    placedAt: 'Oct 02, 2026',
  },
  {
    id: 'hld-2',
    vendorName: 'Mombasa Marine & Boat Spares',
    heldAmountMinor: 48000000,
    currency: 'NGN',
    holdReason: 'Pending physical delivery confirmation on high-value consignment.',
    chargebackCount: 1,
    status: 'held',
    placedAt: 'Sep 30, 2026',
  },
];

export const INITIAL_VENDOR_PAYOUTS: VendorPayoutRequest[] = [
  {
    id: 'vpo-1',
    vendorName: 'Nairobi Green Power Solutions',
    amountMinor: 320000000,
    currency: 'NGN',
    method: 'Direct Bank EFT',
    accountDetails: 'KCB Bank Kenya • Acct: 110928374',
    status: 'pending',
    requestedAt: 'Today, 06:10 AM',
  },
  {
    id: 'vpo-2',
    vendorName: 'Kigali Premium Gadgets',
    amountMinor: 215000000,
    currency: 'NGN',
    method: 'MTN MoMo Corporate',
    accountDetails: 'MTN Rwanda • 078 889 1234',
    status: 'approved',
    requestedAt: 'Yesterday, 17:20 PM',
  },
  {
    id: 'vpo-3',
    vendorName: 'Accra Agro-Mechanics Ltd',
    amountMinor: 145000000,
    currency: 'NGN',
    method: 'Paystack Automated Clearing',
    accountDetails: 'Ecobank Ghana • 0129384756',
    status: 'pending',
    requestedAt: 'Oct 02, 2026',
  },
];

// 3. Catalog and Inventory Oversight
export const INITIAL_CATALOG_POLICY: CatalogOversightPolicy = {
  skuMode: 'vendor_isolated',
  prohibitedKeywords: [
    'replica',
    'counterfeit',
    'unauthorized pharmaceutical',
    'forex bot',
    'stolen imei',
    'cracked software',
  ],
  flaggedItemsCount: 3,
  platformStockoutAlerts: 8,
};

export const INITIAL_PROHIBITED_SCANS: ProhibitedScanItem[] = [
  {
    id: 'pscan-1',
    listingTitle: 'Brand New Rolex Submariner 1:1 Replica Clone (Box & Papers)',
    vendorName: 'Lagos Fast Deals & Gadgets',
    detectedKeyword: 'replica',
    severity: 'counterfeit_flag',
    status: 'delisted',
    timestamp: '25 mins ago',
  },
  {
    id: 'pscan-2',
    listingTitle: 'Commercial Inverter Crack Firmware Unlock Dongle',
    vendorName: 'Nile Valley Tech Clearance',
    detectedKeyword: 'crack firmware',
    severity: 'restricted',
    status: 'under_review',
    timestamp: '2 hours ago',
  },
  {
    id: 'pscan-3',
    listingTitle: 'Unregistered Imported Antibiotics & Veterinary Tonics (Bulk 50kg)',
    vendorName: 'Sub-Saharan Vet Supplies',
    detectedKeyword: 'unregistered',
    severity: 'high_risk',
    status: 'delisted',
    timestamp: '1 day ago',
  },
];

// 4. Vendor Performance & Dispute Mediation
export const INITIAL_VENDOR_SCORECARDS: VendorScorecard[] = [
  {
    vendorId: 'v-01',
    vendorName: 'Nairobi Green Power Solutions',
    overallRating: 4.9,
    shippingSpeedHours: 14,
    cancellationRatePercent: 0.4,
    defectRatePercent: 0.2,
    defectThresholdPercent: 2.5,
    status: 'healthy',
  },
  {
    vendorId: 'v-02',
    vendorName: 'Accra Agro-Mechanics Ltd',
    overallRating: 4.8,
    shippingSpeedHours: 18,
    cancellationRatePercent: 0.9,
    defectRatePercent: 0.6,
    defectThresholdPercent: 2.5,
    status: 'healthy',
  },
  {
    vendorId: 'v-03',
    vendorName: 'Gauteng Industrial Parts Depot',
    overallRating: 4.7,
    shippingSpeedHours: 22,
    cancellationRatePercent: 1.2,
    defectRatePercent: 1.1,
    defectThresholdPercent: 2.5,
    status: 'healthy',
  },
  {
    vendorId: 'v-04',
    vendorName: 'Lagos Fast Deals & Gadgets',
    overallRating: 3.1,
    shippingSpeedHours: 82,
    cancellationRatePercent: 7.4,
    defectRatePercent: 4.8,
    defectThresholdPercent: 2.5,
    status: 'rights_suspended',
  },
];

export const INITIAL_DISPUTE_CASES: AdminDisputeCase[] = [
  {
    id: 'dsp-101',
    escrowOrderId: 'ESC-7729',
    buyerName: 'Tariq Hassan (Cairo)',
    sellerName: 'Joburg Hardware Exports',
    itemTitle: 'Bosch Professional Rotary Hammer Drill Set',
    amountMinor: 18500000,
    currency: 'NGN',
    disputeClaim:
      'Buyer claims courier box arrived opened with missing chuck adapter. Seller provided pre-shipping packaging photo.',
    status: 'investigating',
    openedAt: 'Oct 03, 2026',
  },
  {
    id: 'dsp-102',
    escrowOrderId: 'ESC-6610',
    buyerName: 'Grace Muthoni (Nairobi)',
    sellerName: 'Lagos Fabrics & Textiles Co.',
    itemTitle: '10 Bundles Premium Hollandaise Wax Prints',
    amountMinor: 34000000,
    currency: 'NGN',
    disputeClaim:
      'Color specification mismatch on 2 bundles. Parties agreed to partial refund of ₦6,800,000.',
    status: 'resolved_buyer',
    openedAt: 'Sep 29, 2026',
  },
];

// 5. System Settings & Security
export const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-1',
    staffName: 'John Doe',
    staffRole: 'Super Admin',
    action: 'Platform Commission Updated',
    target: 'Global Rate adjusted to 5.0% (Split Router Synchronized)',
    timestamp: 'Today, 08:00 AM',
  },
  {
    id: 'log-2',
    staffName: 'Sarah Osei',
    staffRole: 'Support Staff',
    action: 'Vendor KYC Compliance Approved',
    target: 'Gauteng Industrial Parts Depot (ZA-CIPC Verified)',
    timestamp: 'Sep 27, 2026, 11:20 AM',
  },
  {
    id: 'log-3',
    staffName: 'John Doe',
    staffRole: 'Super Admin',
    action: 'Automated Penalty Enforcement Triggered',
    target: 'Lagos Fast Deals (Publishing suspended: Defect rate 4.8% exceeded 2.5% threshold)',
    timestamp: 'Sep 15, 2026, 15:45 PM',
  },
];

export const INITIAL_ANNOUNCEMENTS: SystemAnnouncement[] = [
  {
    id: 'anc-1',
    title: 'Pan-African Holiday Trade Window & Escrow Protection Reminder',
    message:
      'All buyers and vendors are reminded to verify handover OTPs in designated safe commercial zones during peak market hours.',
    audience: 'all',
    sentAt: 'Oct 01, 2026',
  },
];
