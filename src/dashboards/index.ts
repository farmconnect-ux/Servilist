import { BuyerSubTab, SellerSubTab, AdminSubTab } from './types';
import { BuyerDashboardView } from './buyerDashboard';
import { SellerDashboardView } from './sellerDashboard';
import { AdminDashboardView } from './adminDashboard';
import {
  INITIAL_BUYER_SHIPMENTS,
  INITIAL_PURCHASE_RECEIPTS,
  INITIAL_WISHLIST,
  INITIAL_BUYER_MESSAGES,
  INITIAL_SHIPPING_ADDRESSES,
  INITIAL_PAYMENT_METHODS,
  INITIAL_SELLER_METRICS,
  INITIAL_SELLER_FULFILLMENTS,
  INITIAL_SELLER_INQUIRIES,
  INITIAL_SELLER_FINANCE,
  INITIAL_ADMIN_METRICS,
  INITIAL_ACTIVITY_FEEDS,
  INITIAL_VENDOR_COMPLIANCE,
  INITIAL_SPLIT_CONFIG,
  INITIAL_PAYOUT_HOLDS,
  INITIAL_VENDOR_PAYOUTS,
  INITIAL_CATALOG_POLICY,
  INITIAL_PROHIBITED_SCANS,
  INITIAL_VENDOR_SCORECARDS,
  INITIAL_DISPUTE_CASES,
  INITIAL_AUDIT_LOGS,
  INITIAL_ANNOUNCEMENTS,
} from './mockData';
import { Listing, CurrencyCode, EscrowOrder } from '../types';

export interface DashboardManagerCallbacks {
  onReleaseEscrowOtp: (orderId: string, otpInput: string) => void;
  onOpenPostListing: () => void;
  onOpenPostRequest: () => void;
  onTestSupabase: () => void;
  onSyncSupabase: () => void;
  onDownloadSchema: () => void;
  onResetSeedData: () => void;
  onClearConsole: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

/**
 * Manages the three separate, independent dashboards:
 * 1. Buyer Dashboard
 * 2. Seller Dashboard
 * 3. Multi-Vendor Admin Dashboard
 */
export class DashboardManager {
  private buyerView: BuyerDashboardView;
  private sellerView: SellerDashboardView;
  private adminView: AdminDashboardView;
  private callbacks: DashboardManagerCallbacks;

  constructor(callbacks: DashboardManagerCallbacks) {
    this.callbacks = callbacks;

    // 1. Separate Buyer Dashboard
    this.buyerView = new BuyerDashboardView(
      {
        shipments: INITIAL_BUYER_SHIPMENTS,
        receipts: INITIAL_PURCHASE_RECEIPTS,
        wishlist: INITIAL_WISHLIST,
        messages: INITIAL_BUYER_MESSAGES,
        addresses: INITIAL_SHIPPING_ADDRESSES,
        paymentMethods: INITIAL_PAYMENT_METHODS,
      },
      {
        onReleaseEscrowOtp: callbacks.onReleaseEscrowOtp,
        onOpenPostRequest: callbacks.onOpenPostRequest,
        onToast: callbacks.onToast,
      }
    );

    // 2. Separate Seller Dashboard
    this.sellerView = new SellerDashboardView(
      {
        metrics: INITIAL_SELLER_METRICS,
        fulfillments: INITIAL_SELLER_FULFILLMENTS,
        inquiries: INITIAL_SELLER_INQUIRIES,
        finance: INITIAL_SELLER_FINANCE,
      },
      {
        onOpenPostListing: callbacks.onOpenPostListing,
        onToast: callbacks.onToast,
      }
    );

    // 3. Separate Admin Dashboard
    this.adminView = new AdminDashboardView(
      {
        metrics: INITIAL_ADMIN_METRICS,
        feeds: INITIAL_ACTIVITY_FEEDS,
        complianceRecords: INITIAL_VENDOR_COMPLIANCE,
        splitConfig: INITIAL_SPLIT_CONFIG,
        payoutHolds: INITIAL_PAYOUT_HOLDS,
        payoutRequests: INITIAL_VENDOR_PAYOUTS,
        catalogPolicy: INITIAL_CATALOG_POLICY,
        prohibitedScans: INITIAL_PROHIBITED_SCANS,
        scorecards: INITIAL_VENDOR_SCORECARDS,
        disputes: INITIAL_DISPUTE_CASES,
        auditLogs: INITIAL_AUDIT_LOGS,
        announcements: INITIAL_ANNOUNCEMENTS,
      },
      {
        onTestSupabase: callbacks.onTestSupabase,
        onSyncSupabase: callbacks.onSyncSupabase,
        onDownloadSchema: callbacks.onDownloadSchema,
        onResetSeedData: callbacks.onResetSeedData,
        onClearConsole: callbacks.onClearConsole,
        onToast: callbacks.onToast,
      }
    );
  }

  // Render separate Buyer Dashboard
  public renderBuyerDashboard(
    container: HTMLElement,
    escrowOrders: EscrowOrder[],
    activeCurrency: CurrencyCode
  ) {
    this.buyerView.render(container, escrowOrders, activeCurrency);
  }

  // Render separate Seller Dashboard
  public renderSellerDashboard(
    container: HTMLElement,
    listings: Listing[],
    activeCurrency: CurrencyCode
  ) {
    this.sellerView.render(container, listings, activeCurrency);
  }

  // Render separate Admin Dashboard
  public renderAdminDashboard(container: HTMLElement, activeCurrency: CurrencyCode) {
    this.adminView.render(container, activeCurrency);
  }

  public setBuyerSubTab(tab: BuyerSubTab) {
    this.buyerView.setSubTab(tab);
  }

  public setSellerSubTab(tab: SellerSubTab) {
    this.sellerView.setSubTab(tab);
  }

  public setAdminSubTab(tab: AdminSubTab) {
    this.adminView.setSubTab(tab);
  }

  public getCallbacks(): DashboardManagerCallbacks {
    return this.callbacks;
  }
}
