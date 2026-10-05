import {
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
  AdminSubTab,
} from './types';
import { CurrencyCode } from '../types';
import { formatMoney } from '../money';

export interface AdminDashboardCallbacks {
  onTestSupabase: () => void;
  onSyncSupabase: () => void;
  onDownloadSchema: () => void;
  onResetSeedData: () => void;
  onClearConsole: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export class AdminDashboardView {
  private activeSubTab: AdminSubTab = 'analytics';
  private metrics: PlatformAnalyticsMetrics;
  private feeds: ActivityFeedItem[];
  private complianceRecords: VendorComplianceRecord[];
  private splitConfig: SplitPayoutConfig;
  private payoutHolds: VendorPayoutHold[];
  private payoutRequests: VendorPayoutRequest[];
  private catalogPolicy: CatalogOversightPolicy;
  private prohibitedScans: ProhibitedScanItem[];
  private scorecards: VendorScorecard[];
  private disputes: AdminDisputeCase[];
  private auditLogs: AdminAuditLog[];
  private announcements: SystemAnnouncement[];
  private callbacks: AdminDashboardCallbacks;

  constructor(
    initialData: {
      metrics: PlatformAnalyticsMetrics;
      feeds: ActivityFeedItem[];
      complianceRecords: VendorComplianceRecord[];
      splitConfig: SplitPayoutConfig;
      payoutHolds: VendorPayoutHold[];
      payoutRequests: VendorPayoutRequest[];
      catalogPolicy: CatalogOversightPolicy;
      prohibitedScans: ProhibitedScanItem[];
      scorecards: VendorScorecard[];
      disputes: AdminDisputeCase[];
      auditLogs: AdminAuditLog[];
      announcements: SystemAnnouncement[];
    },
    callbacks: AdminDashboardCallbacks
  ) {
    this.metrics = { ...initialData.metrics };
    this.feeds = [...initialData.feeds];
    this.complianceRecords = [...initialData.complianceRecords];
    this.splitConfig = {
      ...initialData.splitConfig,
      regionalVatRules: [...initialData.splitConfig.regionalVatRules],
    };
    this.payoutHolds = [...initialData.payoutHolds];
    this.payoutRequests = [...initialData.payoutRequests];
    this.catalogPolicy = {
      ...initialData.catalogPolicy,
      prohibitedKeywords: [...initialData.catalogPolicy.prohibitedKeywords],
    };
    this.prohibitedScans = [...initialData.prohibitedScans];
    this.scorecards = [...initialData.scorecards];
    this.disputes = [...initialData.disputes];
    this.auditLogs = [...initialData.auditLogs];
    this.announcements = [...initialData.announcements];
    this.callbacks = callbacks;
  }

  public setSubTab(tab: AdminSubTab) {
    this.activeSubTab = tab;
  }

  public getSubTab(): AdminSubTab {
    return this.activeSubTab;
  }

  public render(container: HTMLElement, activeCurrency: CurrencyCode) {
    container.innerHTML = `
      <div class="dash-role-container admin-dash-theme">
        <!-- Sub-navigation tabs for Multi-Vendor Admin Dashboard -->
        <div class="dash-subnav-bar" role="tablist" aria-label="Admin Marketplace Navigation">
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'analytics' ? 'active' : ''}" data-admin-tab="analytics">
            <span>📊 Platform Analytics</span>
          </button>
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'compliance' ? 'active' : ''}" data-admin-tab="compliance">
            <span>👥 Vendor Onboarding & KYC (${this.complianceRecords.filter((r) => r.kycStatus === 'pending_review').length} Pending)</span>
          </button>
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'finance' ? 'active' : ''}" data-admin-tab="finance">
            <span>💳 Split Payouts & VAT (${this.payoutHolds.filter((h) => h.status === 'held').length} Holds)</span>
          </button>
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'catalog' ? 'active' : ''}" data-admin-tab="catalog">
            <span>📦 Catalog & Prohibited Items (${this.prohibitedScans.filter((s) => s.status === 'under_review').length} Scans)</span>
          </button>
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'performance' ? 'active' : ''}" data-admin-tab="performance">
            <span>⚖️ Scorecards & Disputes (${this.disputes.filter((d) => d.status === 'investigating' || d.status === 'open').length} Active)</span>
          </button>
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'settings' ? 'active' : ''}" data-admin-tab="settings">
            <span>⚙️ System Settings & Security</span>
          </button>
        </div>

        <div class="dash-subpanel-content">
          ${this.renderSubPanel(activeCurrency)}
        </div>
      </div>
    `;

    this.bindEvents(container, activeCurrency);
  }

  private renderSubPanel(activeCurrency: CurrencyCode): string {
    switch (this.activeSubTab) {
      case 'analytics':
        return this.renderPlatformAnalyticsSection(activeCurrency);
      case 'compliance':
        return this.renderVendorComplianceSection();
      case 'finance':
        return this.renderFinancialAutomationSection(activeCurrency);
      case 'catalog':
        return this.renderCatalogOversightSection();
      case 'performance':
        return this.renderVendorPerformanceSection(activeCurrency);
      case 'settings':
        return this.renderSystemSettingsSection();
    }
  }

  // 1. 📊 Platform Analytics & Overview
  private renderPlatformAnalyticsSection(activeCurrency: CurrencyCode): string {
    const gmv = formatMoney(this.metrics.gmvMinor, this.metrics.currency, {
      showSecondary: true,
      targetCurrency: activeCurrency,
    });
    const commission = formatMoney(this.metrics.netCommissionEarnedMinor, this.metrics.currency, {
      showSecondary: true,
      targetCurrency: activeCurrency,
    });

    return `
      <div class="admin-section-block">
        <div class="section-banner-callout admin-banner">
          <div class="banner-icon">📊</div>
          <div class="banner-text">
            <h4>Pan-African Marketplace Command Center</h4>
            <p>
              An admin dashboard must include platform-wide analytics, user and vendor management controls, dispute resolution tools, and system configuration settings to oversee the entire marketplace.
            </p>
          </div>
        </div>

        <div class="dash-metrics-grid">
          <div class="dash-metric-card metric-gmv">
            <div class="metric-head">
              <span class="metric-title">Gross Marketplace Volume (GMV)</span>
              <span class="metric-icon">💰</span>
            </div>
            <div class="metric-value font-mono" id="dashMetricGMV">${gmv}</div>
            <div class="metric-sub">Total traded volume across 8 African hubs</div>
          </div>

          <div class="dash-metric-card metric-auctions">
            <div class="metric-head">
              <span class="metric-title">Net Commission Earned</span>
              <span class="metric-icon">📈</span>
            </div>
            <div class="metric-value font-mono">${commission}</div>
            <div class="metric-sub">${this.metrics.commissionRatePercent}% automated split take rate</div>
          </div>

          <div class="dash-metric-card metric-requests">
            <div class="metric-head">
              <span class="metric-title">Monthly Active Users (MAU)</span>
              <span class="metric-icon">👥</span>
            </div>
            <div class="metric-value font-mono">${this.metrics.monthlyActiveUsers.toLocaleString()}</div>
            <div class="metric-sub">${this.metrics.dailyActiveUsers.toLocaleString()} Daily Active Users (DAU)</div>
          </div>

          <div class="dash-metric-card metric-escrow">
            <div class="metric-head">
              <span class="metric-title">Monthly Registrations</span>
              <span class="metric-icon">🚀</span>
            </div>
            <div class="metric-value font-mono">+${this.metrics.newBuyersThisMonth + this.metrics.newSellersThisMonth}</div>
            <div class="metric-sub">+${this.metrics.newBuyersThisMonth} buyers &bull; +${this.metrics.newSellersThisMonth} merchants</div>
          </div>
        </div>

        <!-- Live Platform Activity & Error Stream -->
        <div class="activity-stream-box" style="margin-top: 24px;">
          <div class="subpanel-header">
            <h4>Live Transaction & System Telemetry Feeds</h4>
            <span class="subpanel-badge">Real-Time Event Stream</span>
          </div>

          <div class="activity-feed-list">
            ${this.feeds
              .map(
                (feed) => `
                <div class="feed-item-row ${feed.severity}">
                  <span class="feed-dot"></span>
                  <div class="feed-content">
                    <p class="feed-msg">${feed.message}</p>
                    <span class="feed-time">${feed.timestamp} &bull; Type: [${feed.type.toUpperCase()}]</span>
                  </div>
                </div>
              `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  // 2. 👥 Vendor Onboarding & Compliance
  private renderVendorComplianceSection(): string {
    return `
      <div class="admin-section-block">
        <div class="subpanel-header">
          <div>
            <h4>Vendor Onboarding, KYC/AML Verification & Tier Management</h4>
            <p>Review business registrations (CAC Nigeria, KRA Kenya, CIPC South Africa, RDB Rwanda), assign commission tiers, and audit storefront customization.</p>
          </div>
        </div>

        <div class="compliance-table-wrapper">
          <table class="receipts-table compliance-table">
            <thead>
              <tr>
                <th>Vendor / Business</th>
                <th>Country Hub</th>
                <th>License & Tax ID</th>
                <th>KYC / AML Status</th>
                <th>Commission Tier</th>
                <th>Storefront Policy</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.complianceRecords
                .map(
                  (rec) => `
                  <tr>
                    <td>
                      <strong>${rec.businessName}</strong>
                      <div class="inv-sku">Rep: ${rec.vendorName}</div>
                    </td>
                    <td>📍 ${rec.city}, ${rec.country}</td>
                    <td>
                      <div class="font-mono text-sm">${rec.businessLicenseNo}</div>
                      <div class="font-mono text-xs text-muted">Tax: ${rec.taxId}</div>
                    </td>
                    <td>
                      <span class="badge-status ${rec.kycStatus === 'verified' ? 'badge-active' : rec.kycStatus === 'rejected' ? 'badge-sold' : 'badge-pending'}">
                        ${rec.kycStatus === 'verified' ? '✓ Verified' : rec.kycStatus === 'rejected' ? '✗ Rejected' : '⏳ Pending Review'}
                      </span>
                    </td>
                    <td>
                      <select class="tier-select" data-rec-id="${rec.id}">
                        <option value="Standard (5.0%)" ${rec.commissionTier.includes('5.0') ? 'selected' : ''}>Standard (5.0%)</option>
                        <option value="Growth (3.5%)" ${rec.commissionTier.includes('3.5') ? 'selected' : ''}>Growth (3.5%)</option>
                        <option value="Artisan / Community (2.0%)" ${rec.commissionTier.includes('2.0') ? 'selected' : ''}>Artisan (2.0%)</option>
                      </select>
                    </td>
                    <td>
                      <span class="badge-status ${rec.storefrontApproval === 'approved' ? 'badge-active' : 'badge-sold'}">
                        ${rec.storefrontApproval.toUpperCase()}
                      </span>
                      <div class="text-xs text-muted" style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        "${rec.customReturnPolicy}"
                      </div>
                    </td>
                    <td>
                      <div class="inv-action-btns">
                        ${
                          rec.kycStatus === 'pending_review'
                            ? `<button type="button" class="btn-inv-action btn-approve-kyc" data-rec-id="${rec.id}">Approve KYC</button>
                               <button type="button" class="btn-inv-action btn-reject-kyc" data-rec-id="${rec.id}">Reject</button>`
                            : `<button type="button" class="btn-inv-action btn-audit-store" data-rec-id="${rec.id}">Audit Store</button>`
                        }
                      </div>
                    </td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 3. 💳 Financial Automation & Split Payouts
  private renderFinancialAutomationSection(activeCurrency: CurrencyCode): string {
    return `
      <div class="admin-section-block">
        <div class="subpanel-header">
          <div>
            <h4>Financial Automation, Revenue Splitting & Disbursement Holds</h4>
            <p>Configure automated payment routers (Stripe Connect / Paystack Split), enforce payout freezes during dispute surges, and automate regional VAT/tax withholding.</p>
          </div>
        </div>

        <div class="settings-two-col">
          <!-- Automated Split Router Configuration -->
          <div class="settings-card">
            <div class="settings-card-head">
              <h4>🔄 Payment Router & Automated Splitting</h4>
              <span class="badge-active">Active</span>
            </div>
            <div class="split-config-form">
              <div class="form-group">
                <label>Split Infrastructure Provider</label>
                <select id="splitRouterSelect" class="form-control">
                  <option value="Stripe Connect" ${this.splitConfig.routerEngine === 'Stripe Connect' ? 'selected' : ''}>Stripe Connect (Custom Accounts)</option>
                  <option value="Paystack Split" ${this.splitConfig.routerEngine === 'Paystack Split' ? 'selected' : ''}>Paystack Multi-Split API</option>
                  <option value="Flutterwave Subaccounts" ${this.splitConfig.routerEngine === 'Flutterwave Subaccounts' ? 'selected' : ''}>Flutterwave Subaccounts & Barter</option>
                </select>
              </div>

              <div class="split-toggle-row" style="margin-top: 14px;">
                <label class="toggle-switch">
                  <input type="checkbox" id="chkAutoSplit" ${this.splitConfig.automatedSplitActive ? 'checked' : ''} />
                  <span class="slider"></span>
                </label>
                <div>
                  <strong>Automated Split at Checkout</strong>
                  <div class="text-xs text-muted">Automatically separates ${this.splitConfig.defaultCommissionPercent}% platform fee into Servilist treasury wallet.</div>
                </div>
              </div>

              <div class="split-toggle-row" style="margin-top: 14px;">
                <label class="toggle-switch">
                  <input type="checkbox" id="chkAutoVat" ${this.splitConfig.autoVatWithholding ? 'checked' : ''} />
                  <span class="slider"></span>
                </label>
                <div>
                  <strong>Marketplace Facilitator Tax & VAT Withholding</strong>
                  <div class="text-xs text-muted">Automatically calculate and withhold statutory VAT on commissions by operating region.</div>
                </div>
              </div>

              <div class="regional-vat-pills" style="margin-top: 16px;">
                <label style="font-size: 0.75rem; font-weight: 700;">Regional Withholding Rates:</label>
                <div class="vat-chips-grid">
                  ${this.splitConfig.regionalVatRules
                    .map(
                      (r) =>
                        `<span class="vat-chip"><strong>${r.region}:</strong> ${r.vatRatePercent}%</span>`
                    )
                    .join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Manual Payout Holds -->
          <div class="settings-card">
            <div class="settings-card-head">
              <h4>🛑 Manual Payout Holds & Freeze Controls</h4>
              <span class="badge-sold">${this.payoutHolds.filter((h) => h.status === 'held').length} Active Holds</span>
            </div>
            <p class="text-xs text-muted">Disbursements are frozen when vendors experience high chargeback rates or multiple open delivery disputes.</p>

            <div class="payout-holds-list">
              ${this.payoutHolds
                .map((hold) => {
                  const amt = formatMoney(hold.heldAmountMinor, hold.currency, {
                    showSecondary: true,
                    targetCurrency: activeCurrency,
                  });
                  return `
                  <div class="hold-item-card ${hold.status}">
                    <div class="hold-top">
                      <div>
                        <strong>${hold.vendorName}</strong>
                        <div class="text-xs text-muted">Placed: ${hold.placedAt} &bull; Chargebacks: ${hold.chargebackCount}</div>
                      </div>
                      <span class="font-mono price-cell">${amt}</span>
                    </div>
                    <div class="hold-reason">"${hold.holdReason}"</div>
                    <div class="hold-actions">
                      ${
                        hold.status === 'held'
                          ? `<button type="button" class="btn-inv-action btn-release-hold" data-hold-id="${hold.id}">Release Payout</button>`
                          : `<span class="badge-active">✓ Hold Released</span>`
                      }
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>

          <!-- Vendor Electronic Disbursements & Payout Requests -->
          <div class="settings-card" style="margin-top: 20px;">
            <div class="settings-card-head">
              <h4>💸 Electronic Disbursements & Payout Requests</h4>
              <span class="badge-active">${this.payoutRequests.length} Total Requests</span>
            </div>
            <p class="text-xs text-muted">Monitor and approve automated Paystack / M-Pesa / EFT disbursements to verified merchant bank accounts.</p>

            <div class="payout-requests-list" style="margin-top: 14px;">
              ${this.payoutRequests
                .map((req) => {
                  const amt = formatMoney(req.amountMinor, req.currency, {
                    showSecondary: true,
                    targetCurrency: activeCurrency,
                  });
                  return `
                  <div class="hold-item-card ${req.status}" style="margin-bottom: 10px;">
                    <div class="hold-top">
                      <div>
                        <strong>${req.vendorName}</strong> &bull; <span class="text-xs">${req.method}</span>
                        <div class="text-xs text-muted">Requested: ${req.requestedAt} &bull; Account: ${req.accountDetails}</div>
                      </div>
                      <span class="font-mono price-cell">${amt}</span>
                    </div>
                    <div class="hold-actions" style="margin-top: 8px;">
                      <span class="badge-active">${req.status === 'approved' ? '✓ Auto-Approved' : req.status === 'manual_override' ? '⚠️ Manual Override' : '⏳ Pending'}</span>
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 4. 📦 Catalog and Inventory Oversight
  private renderCatalogOversightSection(): string {
    return `
      <div class="admin-section-block">
        <div class="subpanel-header">
          <div>
            <h4>Multi-Store Catalog Oversight & Prohibited Item Scanning</h4>
            <p>Enforce global vs vendor-specific SKU isolation, scan listings for counterfeit/prohibited keywords, and monitor stockout health.</p>
          </div>
        </div>

        <div class="catalog-policy-toolbar">
          <div class="sku-mode-selector">
            <label><strong>SKU Architecture Mode:</strong></label>
            <div class="radio-pill-group">
              <label class="radio-pill">
                <input type="radio" name="skuModeRadio" value="vendor_isolated" ${this.catalogPolicy.skuMode === 'vendor_isolated' ? 'checked' : ''} />
                <span>Vendor-Isolated Catalogs (Recommended for Africa)</span>
              </label>
              <label class="radio-pill">
                <input type="radio" name="skuModeRadio" value="global_shared" ${this.catalogPolicy.skuMode === 'global_shared' ? 'checked' : ''} />
                <span>Global Shared Catalog (Amazon/ASIN style)</span>
              </label>
            </div>
          </div>

          <div class="catalog-health-badge">
            <span>🛡️ Automated Scanner: Active</span> &bull;
            <span>${this.catalogPolicy.prohibitedKeywords.length} Restricted Keywords Monitored</span>
          </div>
        </div>

        <!-- Prohibited Item Scanner Queue -->
        <div class="prohibited-scan-queue" style="margin-top: 20px;">
          <h4>Automated Prohibited & High-Risk Item Scan Queue</h4>
          <table class="receipts-table">
            <thead>
              <tr>
                <th>Listing Title</th>
                <th>Merchant</th>
                <th>Triggered Keyword</th>
                <th>Threat Severity</th>
                <th>Detection Time</th>
                <th>Moderation Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.prohibitedScans
                .map(
                  (scan) => `
                <tr>
                  <td><strong>${scan.listingTitle}</strong></td>
                  <td>${scan.vendorName}</td>
                  <td><span class="pay-chip font-mono">"${scan.detectedKeyword}"</span></td>
                  <td>
                    <span class="badge-status ${scan.severity === 'counterfeit_flag' ? 'badge-sold' : 'badge-pending'}">
                      ${scan.severity.toUpperCase()}
                    </span>
                  </td>
                  <td>${scan.timestamp}</td>
                  <td>
                    <span class="badge-status ${scan.status === 'delisted' ? 'badge-sold' : scan.status === 'cleared' ? 'badge-active' : 'badge-pending'}">
                      ${scan.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div class="inv-action-btns">
                      ${
                        scan.status === 'under_review'
                          ? `<button type="button" class="btn-inv-action btn-delist-scan" data-scan-id="${scan.id}">Delist</button>
                             <button type="button" class="btn-inv-action btn-clear-scan" data-scan-id="${scan.id}">Clear</button>`
                          : `<button type="button" class="btn-inv-action" disabled>Processed</button>`
                      }
                    </div>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 5. ⚖️ Vendor Performance & Dispute Mediation
  private renderVendorPerformanceSection(activeCurrency: CurrencyCode): string {
    return `
      <div class="admin-section-block">
        <div class="subpanel-header">
          <div>
            <h4>Vendor Performance Scorecards & Escalated Dispute Arbitration</h4>
            <p>Monitor vendor defect rates, enforce automated publishing suspensions, and issue final binding arbitration on disputed escrow transactions.</p>
          </div>
        </div>

        <!-- Scorecards Table -->
        <div class="scorecards-section scorecards-grid">
          <h4>Merchant Performance Scorecards & Automated Penalty Rules</h4>
          <table class="receipts-table">
            <thead>
              <tr>
                <th>Merchant Name</th>
                <th>Avg Rating</th>
                <th>Avg Dispatch Speed</th>
                <th>Cancellation Rate</th>
                <th>Order Defect Rate (ODR)</th>
                <th>Compliance Status</th>
                <th>Enforcement Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.scorecards
                .map((sc) => {
                  const isSuspended = sc.status === 'rights_suspended';
                  return `
                  <tr class="${isSuspended ? 'row-suspended' : ''}">
                    <td><strong>${sc.vendorName}</strong></td>
                    <td>⭐ ${sc.overallRating.toFixed(1)} / 5.0</td>
                    <td>⚡ ${sc.shippingSpeedHours} hours</td>
                    <td>${sc.cancellationRatePercent}%</td>
                    <td>
                      <strong class="${sc.defectRatePercent > sc.defectThresholdPercent ? 'text-danger' : 'text-success'}">
                        ${sc.defectRatePercent}%
                      </strong>
                      <span class="text-xs text-muted">(Threshold: &lt; ${sc.defectThresholdPercent}%)</span>
                    </td>
                    <td>
                      <span class="badge-status ${sc.status === 'healthy' ? 'badge-active' : 'badge-sold'}">
                        ${sc.status === 'healthy' ? '✓ Healthy Standing' : '🚫 Rights Suspended'}
                      </span>
                    </td>
                    <td>
                      ${
                        isSuspended
                          ? `<button type="button" class="btn-inv-action btn-reinstate-vendor" data-vendor-id="${sc.vendorId}">Reinstate Publishing</button>`
                          : `<button type="button" class="btn-inv-action btn-warn-vendor" data-vendor-id="${sc.vendorId}">Audit Scorecard</button>`
                      }
                    </td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- Escalated Escrow Dispute Mediation -->
        <div class="disputes-section" style="margin-top: 28px;">
          <h4>Escalated Escrow Dispute Arbitration (Binding Administrative Rulings)</h4>
          <div class="disputes-list">
            ${this.disputes
              .map((dsp) => {
                const amt = formatMoney(dsp.amountMinor, dsp.currency, {
                  showSecondary: true,
                  targetCurrency: activeCurrency,
                });
                const isInvestigating = dsp.status === 'investigating' || dsp.status === 'open';
                return `
                <div class="dispute-case-card ${dsp.status}">
                  <div class="dsp-header">
                    <div>
                      <span class="ful-code">Case: ${dsp.id} &bull; Escrow: ${dsp.escrowOrderId}</span>
                      <h4 class="ful-title">${dsp.itemTitle}</h4>
                      <div class="ful-meta">
                        <span>Buyer: <strong>${dsp.buyerName}</strong></span> &bull;
                        <span>Merchant: <strong>${dsp.sellerName}</strong></span> &bull;
                        <span>Opened: <strong>${dsp.openedAt}</strong></span>
                      </div>
                    </div>
                    <div class="dsp-amount-badge">${amt} Locked</div>
                  </div>

                  <div class="dsp-body">
                    <p class="dsp-claim"><strong>Dispute Claim:</strong> "${dsp.disputeClaim}"</p>

                    <div class="dsp-actions-row">
                      ${
                        isInvestigating
                          ? `
                          <button type="button" class="btn-dsp-ruling btn-ruling-seller" data-dsp-id="${dsp.id}">
                            Arbiter Ruling: Release Escrow to Seller
                          </button>
                          <button type="button" class="btn-dsp-ruling btn-ruling-buyer" data-dsp-id="${dsp.id}">
                            Arbiter Ruling: Full Refund to Buyer
                          </button>
                        `
                          : `<span class="dsp-resolved-pill">⚖️ Binding Ruling Executed: ${dsp.status.toUpperCase()}</span>`
                      }
                    </div>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  // 6. ⚙️ System Settings & Security
  private renderSystemSettingsSection(): string {
    return `
      <div class="admin-section-block">
        <div class="subpanel-header">
          <div>
            <h4>System Configuration, Broadcast Center & Supabase Integration</h4>
            <p>Manage platform-wide communication broadcasts, configure database sync with Git, and inspect staff audit trail logs.</p>
          </div>
        </div>

        <div class="settings-two-col">
          <!-- Announcement Broadcast Center -->
          <div class="settings-card">
            <div class="settings-card-head">
              <h4>📢 Broadcast Notification Center</h4>
            </div>
            <form id="adminBroadcastForm" class="broadcast-form">
              <div class="form-group">
                <label>Announcement Headline</label>
                <input type="text" id="broadcastTitleInput" placeholder="e.g. Scheduled Gateway Maintenance Notice" required />
              </div>
              <div class="form-group">
                <label>Target Audience</label>
                <select id="broadcastAudienceSelect">
                  <option value="all">All Platform Users (Buyers + Merchants)</option>
                  <option value="sellers">Verified Merchants Only</option>
                  <option value="buyers">Active Buyers Only</option>
                </select>
              </div>
              <div class="form-group">
                <label>Announcement Body</label>
                <textarea id="broadcastMessageInput" rows="3" placeholder="Enter broadcast text for push / banner delivery..." required></textarea>
              </div>
              <button type="submit" class="btn-dash-primary" style="margin-top: 10px;">
                🚀 Dispatch Broadcast Alert
              </button>
            </form>
          </div>

          <!-- Supabase Database Cloud Integration -->
          <div class="settings-card">
            <div class="settings-card-head">
              <h4>⚡ Supabase Database Cloud Sync</h4>
              <span class="badge-active">Connected</span>
            </div>
            <p class="text-xs text-muted">
              Database access is configured on the application server. Synchronize listings, bids, requests, proposals, and escrow states.
            </p>
            <div class="supa-actions-row" style="margin-top: 14px;">
              <button type="button" id="btnTestSupabase" class="btn-dash-primary">
                <span>⚡ Test Connection</span>
              </button>
              <button type="button" id="btnSyncSupabase" class="btn-dash-secondary">
                <span>🔄 Sync All to Cloud</span>
              </button>
              <button type="button" id="btnDownloadSchema" class="btn-dash-secondary">
                <span>📜 Download Schema</span>
              </button>
              <button type="button" id="btnResetSeedData" class="btn-dash-link">
                <span>↺ Restore Seeds</span>
              </button>
            </div>

            <!-- Console Log Box -->
            <div class="supa-console-box" style="margin-top: 16px;">
              <div class="console-head">
                <span>Audit Activity Log</span>
                <button type="button" id="btnClearConsole" class="btn-clear-console">Clear</button>
              </div>
              <div class="console-logs" id="supaConsoleLogs">
                <div class="log-line info">[System] Multi-Vendor Admin Console ready.</div>
                <div class="log-line success">[Audit] Automated Split Router connected to payment gateway.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Administrative Audit Trail -->
        <div class="audit-trail-section" style="margin-top: 24px;">
          <h4>Administrative Audit Trail (Immutable Log)</h4>
          <table class="receipts-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Administrative Action</th>
                <th>Target Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${this.auditLogs
                .map(
                  (log) => `
                <tr>
                  <td><strong>${log.staffName}</strong></td>
                  <td><span class="cat-chip">${log.staffRole}</span></td>
                  <td><strong>${log.action}</strong></td>
                  <td>${log.target}</td>
                  <td>${log.timestamp}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  private bindEvents(container: HTMLElement, activeCurrency: CurrencyCode) {
    // Admin Subnav
    container.querySelectorAll('[data-admin-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.adminTab as AdminSubTab;
        if (tab) {
          this.setSubTab(tab);
          this.render(container, activeCurrency);
        }
      });
    });

    // KYC Approval
    container.querySelectorAll('.btn-approve-kyc').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.recId;
        const rec = this.complianceRecords.find((r) => r.id === id);
        if (rec) {
          rec.kycStatus = 'verified';
          rec.storefrontApproval = 'approved';
          this.callbacks.onToast(
            `KYC Approved for ${rec.businessName}! Storefront activated.`,
            'success'
          );
          this.auditLogs.unshift({
            id: `log-${Date.now()}`,
            staffName: 'Admin',
            staffRole: 'Super Admin',
            action: 'KYC Verified',
            target: `${rec.businessName} (${rec.businessLicenseNo})`,
            timestamp: 'Just now',
          });
          this.render(container, activeCurrency);
        }
      });
    });

    // KYC Rejection
    container.querySelectorAll('.btn-reject-kyc').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.recId;
        const rec = this.complianceRecords.find((r) => r.id === id);
        if (rec) {
          rec.kycStatus = 'rejected';
          rec.storefrontApproval = 'restricted';
          this.callbacks.onToast(
            `KYC rejected for ${rec.businessName}. Merchant notified.`,
            'warning'
          );
          this.render(container, activeCurrency);
        }
      });
    });

    // Commission Tier Update
    container.querySelectorAll('.tier-select').forEach((sel) => {
      sel.addEventListener('change', () => {
        const id = (sel as HTMLElement).dataset.recId;
        const val = (sel as HTMLSelectElement).value as any;
        const rec = this.complianceRecords.find((r) => r.id === id);
        if (rec) {
          rec.commissionTier = val;
          this.callbacks.onToast(
            `Commission tier for ${rec.businessName} updated to ${val}.`,
            'info'
          );
        }
      });
    });

    // Release Hold
    container.querySelectorAll('.btn-release-hold').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.holdId;
        const hold = this.payoutHolds.find((h) => h.id === id);
        if (hold) {
          hold.status = 'released';
          this.callbacks.onToast(
            `Payout hold released for ${hold.vendorName}. Funds scheduled for transfer.`,
            'success'
          );
          this.render(container, activeCurrency);
        }
      });
    });

    // Prohibited Item Delist
    container.querySelectorAll('.btn-delist-scan').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.scanId;
        const scan = this.prohibitedScans.find((s) => s.id === id);
        if (scan) {
          scan.status = 'delisted';
          this.callbacks.onToast(
            `Listing "${scan.listingTitle}" delisted due to restricted keyword policy.`,
            'warning'
          );
          this.render(container, activeCurrency);
        }
      });
    });

    // Prohibited Item Clear
    container.querySelectorAll('.btn-clear-scan').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.scanId;
        const scan = this.prohibitedScans.find((s) => s.id === id);
        if (scan) {
          scan.status = 'cleared';
          this.callbacks.onToast(
            `Listing "${scan.listingTitle}" cleared false positive flag.`,
            'success'
          );
          this.render(container, activeCurrency);
        }
      });
    });

    // Scorecard Reinstate
    container.querySelectorAll('.btn-reinstate-vendor').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.vendorId;
        const sc = this.scorecards.find((s) => s.vendorId === id);
        if (sc) {
          sc.status = 'healthy';
          this.callbacks.onToast(`Publishing rights reinstated for ${sc.vendorName}.`, 'success');
          this.render(container, activeCurrency);
        }
      });
    });

    // Dispute Arbiter Ruling: Seller
    container.querySelectorAll('.btn-ruling-seller').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.dspId;
        const dsp = this.disputes.find((d) => d.id === id);
        if (dsp) {
          dsp.status = 'resolved_seller';
          this.callbacks.onToast(
            `Binding Arbiter Ruling: Escrow released to Seller (${dsp.sellerName})!`,
            'success'
          );
          this.render(container, activeCurrency);
        }
      });
    });

    // Dispute Arbiter Ruling: Buyer
    container.querySelectorAll('.btn-ruling-buyer').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.dspId;
        const dsp = this.disputes.find((d) => d.id === id);
        if (dsp) {
          dsp.status = 'resolved_buyer';
          this.callbacks.onToast(
            `Binding Arbiter Ruling: Escrow refunded to Buyer (${dsp.buyerName})!`,
            'success'
          );
          this.render(container, activeCurrency);
        }
      });
    });

    // Broadcast Announcement Form
    const bcForm = container.querySelector('#adminBroadcastForm') as HTMLFormElement | null;
    bcForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = (container.querySelector('#broadcastTitleInput') as HTMLInputElement)?.value;
      const msg = (container.querySelector('#broadcastMessageInput') as HTMLTextAreaElement)?.value;
      const aud = (container.querySelector('#broadcastAudienceSelect') as HTMLSelectElement)
        ?.value as any;

      if (title && msg) {
        this.announcements.unshift({
          id: `anc-${Date.now()}`,
          title,
          message: msg,
          audience: aud,
          sentAt: 'Just now',
        });
        this.callbacks.onToast(
          `📢 Broadcast sent to ${aud.toUpperCase()} users: "${title}"`,
          'success'
        );
        bcForm.reset();
      }
    });

    // Supabase buttons
    container.querySelector('#btnTestSupabase')?.addEventListener('click', () => {
      this.callbacks.onTestSupabase();
    });
    container.querySelector('#btnSyncSupabase')?.addEventListener('click', () => {
      this.callbacks.onSyncSupabase();
    });
    container.querySelector('#btnDownloadSchema')?.addEventListener('click', () => {
      this.callbacks.onDownloadSchema();
    });
    container.querySelector('#btnResetSeedData')?.addEventListener('click', () => {
      this.callbacks.onResetSeedData();
    });
    container.querySelector('#btnClearConsole')?.addEventListener('click', () => {
      this.callbacks.onClearConsole();
    });
  }
}
