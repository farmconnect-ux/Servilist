import { CurrencyCode } from '../types';

export type DashboardRole = 'buyer' | 'seller' | 'admin';

export type BuyerSubTab = 'orders' | 'history' | 'wishlist' | 'communication' | 'settings';

export type SellerSubTab = 'analytics' | 'inventory' | 'fulfillment' | 'support' | 'finance';

export type AdminSubTab =
  'analytics' | 'compliance' | 'finance' | 'catalog' | 'performance' | 'settings';

// -------------------------------------------------------------
// Buyer Dashboard Models
// -------------------------------------------------------------
export interface BuyerShipment {
  id: string;
  orderNumber: string;
  itemTitle: string;
  sellerName: string;
  courier: string;
  trackingNumber: string;
  originCity: string;
  destinationCity: string;
  amountMinor: number;
  currency: CurrencyCode;
  estimatedDelivery: string;
  currentStep: 1 | 2 | 3 | 4; // 1: Confirmed & Escrow, 2: Dispatched, 3: In Transit, 4: Delivered
  statusText: string;
  otpCode?: string;
}

export interface PurchaseReceipt {
  id: string;
  receiptNumber: string;
  date: string;
  itemTitle: string;
  sellerName: string;
  amountMinor: number;
  currency: CurrencyCode;
  paymentMethod: string;
  status: 'completed' | 'refunded';
}

export interface WishlistItem {
  id: string;
  listingId: string;
  title: string;
  category: string;
  city: string;
  priceMinor: number;
  currency: CurrencyCode;
  targetAlertPriceMinor: number;
  priceAlertEnabled: boolean;
  inStock: boolean;
  imageUrl: string;
}

export interface BuyerMessage {
  id: string;
  sellerName: string;
  sellerAvatar: string;
  itemTitle: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

export interface ShippingAddress {
  id: string;
  label: string; // e.g. "Home (Lagos)", "Office (Nairobi)"
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  country: string;
  isDefault: boolean;
}

export interface SavedPaymentMethod {
  id: string;
  type: 'mobile_money' | 'card' | 'bank_transfer';
  provider: string; // "M-Pesa", "MTN MoMo", "Visa", "Mastercard"
  accountIdentifier: string; // "+254 712 *** 890", "**** 4129"
  isDefault: boolean;
}

// -------------------------------------------------------------
// Seller Dashboard Models
// -------------------------------------------------------------
export interface SellerSalesMetrics {
  grossRevenueMinor: number;
  currency: CurrencyCode;
  totalOrdersCount: number;
  avgOrderValueMinor: number;
  conversionRatePercent: number;
  returnRatePercent: number;
  periodGrowthPercent: number;
}

export interface SellerFulfillmentOrder {
  id: string;
  orderCode: string;
  buyerName: string;
  itemTitle: string;
  destinationCity: string;
  amountMinor: number;
  currency: CurrencyCode;
  status: 'awaiting_dispatch' | 'dispatched' | 'delivered';
  courier: string;
  waybillNumber: string;
  createdAt: string;
}

export interface CustomerInquiry {
  id: string;
  buyerName: string;
  itemTitle: string;
  inquiryType: 'Pre-sale' | 'Delivery Status' | 'Return Request';
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  date: string;
}

export interface SellerFinanceSummary {
  availablePayoutMinor: number;
  pendingEscrowMinor: number;
  platformFeesMinor: number;
  totalEarningsMinor: number;
  currency: CurrencyCode;
  payoutDestination: string;
  payoutHistory: Array<{
    id: string;
    reference: string;
    date: string;
    amountMinor: number;
    destination: string;
    status: 'completed' | 'processing';
  }>;
}

// -------------------------------------------------------------
// Admin Multi-Vendor Dashboard Models
// -------------------------------------------------------------
export interface PlatformAnalyticsMetrics {
  gmvMinor: number;
  currency: CurrencyCode;
  netCommissionEarnedMinor: number;
  commissionRatePercent: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  newBuyersThisMonth: number;
  newSellersThisMonth: number;
  conversionRatePercent: number;
}

export interface ActivityFeedItem {
  id: string;
  type: 'transaction' | 'system_alert' | 'error_log';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

// 1. Vendor Onboarding & Compliance
export interface VendorComplianceRecord {
  id: string;
  vendorName: string;
  businessName: string;
  country: string;
  city: string;
  businessLicenseNo: string;
  taxId: string;
  kycStatus: 'verified' | 'pending_review' | 'rejected';
  commissionTier: 'Standard (5.0%)' | 'Growth (3.5%)' | 'Artisan / Community (2.0%)';
  storefrontApproval: 'approved' | 'pending' | 'restricted';
  customReturnPolicy: string;
  storeBio: string;
  submittedAt: string;
}

// 2. Financial Automation & Split Payouts
export interface SplitPayoutConfig {
  routerEngine: 'Stripe Connect' | 'Paystack Split' | 'Flutterwave Subaccounts';
  automatedSplitActive: boolean;
  defaultCommissionPercent: number;
  autoVatWithholding: boolean;
  regionalVatRules: Array<{ region: string; vatRatePercent: number }>;
}

export interface VendorPayoutHold {
  id: string;
  vendorName: string;
  heldAmountMinor: number;
  currency: CurrencyCode;
  holdReason: string;
  chargebackCount: number;
  status: 'held' | 'released';
  placedAt: string;
}

export interface VendorPayoutRequest {
  id: string;
  vendorName: string;
  amountMinor: number;
  currency: CurrencyCode;
  method: string;
  accountDetails: string;
  status: 'pending' | 'approved' | 'manual_override';
  requestedAt: string;
}

// 3. Catalog and Inventory Oversight
export interface CatalogOversightPolicy {
  skuMode: 'global_shared' | 'vendor_isolated';
  prohibitedKeywords: string[];
  flaggedItemsCount: number;
  platformStockoutAlerts: number;
}

export interface ProhibitedScanItem {
  id: string;
  listingTitle: string;
  vendorName: string;
  detectedKeyword: string;
  severity: 'high_risk' | 'restricted' | 'counterfeit_flag';
  status: 'under_review' | 'delisted' | 'cleared';
  timestamp: string;
}

// 4. Vendor Performance & Dispute Mediation
export interface VendorScorecard {
  vendorId: string;
  vendorName: string;
  overallRating: number;
  shippingSpeedHours: number;
  cancellationRatePercent: number;
  defectRatePercent: number;
  defectThresholdPercent: number;
  status: 'healthy' | 'at_risk' | 'rights_suspended';
}

export interface AdminDisputeCase {
  id: string;
  escrowOrderId: string;
  buyerName: string;
  sellerName: string;
  itemTitle: string;
  amountMinor: number;
  currency: CurrencyCode;
  disputeClaim: string;
  status: 'open' | 'investigating' | 'resolved_seller' | 'resolved_buyer';
  openedAt: string;
}

// 5. System Settings & Security
export interface AdminAuditLog {
  id: string;
  staffName: string;
  staffRole: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  audience: 'all' | 'sellers' | 'buyers';
  sentAt: string;
}
