import {
  SellerSalesMetrics,
  SellerFulfillmentOrder,
  CustomerInquiry,
  SellerFinanceSummary,
  SellerSubTab,
} from './types';
import { Listing, CurrencyCode } from '../types';
import { formatMoney } from '../money';
import { escapeHtml, safeImageUrl } from '../ui/html';

export interface SellerDashboardCallbacks {
  onOpenPostListing: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export class SellerDashboardView {
  private activeSubTab: SellerSubTab = 'analytics';
  private metrics: SellerSalesMetrics;
  private fulfillments: SellerFulfillmentOrder[];
  private inquiries: CustomerInquiry[];
  private finance: SellerFinanceSummary;
  private callbacks: SellerDashboardCallbacks;
  private inventoryFilter: string = 'all';

  constructor(
    initialData: {
      metrics: SellerSalesMetrics;
      fulfillments: SellerFulfillmentOrder[];
      inquiries: CustomerInquiry[];
      finance: SellerFinanceSummary;
    },
    callbacks: SellerDashboardCallbacks
  ) {
    this.metrics = { ...initialData.metrics };
    this.fulfillments = [...initialData.fulfillments];
    this.inquiries = [...initialData.inquiries];
    this.finance = {
      ...initialData.finance,
      payoutHistory: [...initialData.finance.payoutHistory],
    };
    this.callbacks = callbacks;
  }

  public setSubTab(tab: SellerSubTab) {
    this.activeSubTab = tab;
  }

  public getSubTab(): SellerSubTab {
    return this.activeSubTab;
  }

  public render(container: HTMLElement, sellerListings: Listing[], activeCurrency: CurrencyCode) {
    container.innerHTML = `
      <div class="dash-role-container seller-dash-theme">
        <!-- Sub-navigation tabs for Seller Dashboard -->
        <div class="dash-subnav-bar" role="tablist" aria-label="Seller Dashboard Navigation">
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'analytics' ? 'active' : ''}" data-seller-tab="analytics">
            <span>📈 Sales Analytics</span>
          </button>
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'inventory' ? 'active' : ''}" data-seller-tab="inventory">
            <span>📦 Inventory Management (${sellerListings.length})</span>
          </button>
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'fulfillment' ? 'active' : ''}" data-seller-tab="fulfillment">
            <span>🚚 Order Fulfillment (${this.fulfillments.filter((f) => f.status !== 'delivered').length} Active)</span>
          </button>
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'support' ? 'active' : ''}" data-seller-tab="support">
            <span>🎧 Customer Support (${this.inquiries.filter((i) => i.status === 'open').length} Open)</span>
          </button>
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'finance' ? 'active' : ''}" data-seller-tab="finance">
            <span>💳 Financial Summaries & Payouts</span>
          </button>
        </div>

        <div class="dash-subpanel-content">
          ${this.renderSubPanel(sellerListings, activeCurrency)}
        </div>
      </div>
    `;

    this.bindEvents(container, sellerListings, activeCurrency);
  }

  private renderSubPanel(sellerListings: Listing[], activeCurrency: CurrencyCode): string {
    switch (this.activeSubTab) {
      case 'analytics':
        return this.renderSalesAnalyticsSection(sellerListings, activeCurrency);
      case 'inventory':
        return this.renderInventorySection(sellerListings, activeCurrency);
      case 'fulfillment':
        return this.renderFulfillmentSection(activeCurrency);
      case 'support':
        return this.renderCustomerSupportSection();
      case 'finance':
        return this.renderFinancialSummariesSection(activeCurrency);
    }
  }

  // 1. Sales Analytics
  private renderSalesAnalyticsSection(
    sellerListings: Listing[],
    activeCurrency: CurrencyCode
  ): string {
    const grossRev = formatMoney(this.metrics.grossRevenueMinor, this.metrics.currency, {
      showSecondary: true,
      targetCurrency: activeCurrency,
    });
    const aov = formatMoney(this.metrics.avgOrderValueMinor, this.metrics.currency, {
      showSecondary: true,
      targetCurrency: activeCurrency,
    });

    return `
      <div class="seller-section-block">
        <div class="section-banner-callout">
          <div class="banner-icon">💰</div>
          <div class="banner-text">
            <h4>Seller Performance & Revenue Intelligence</h4>
            <p>
              Monitor your gross merchandise volume, average order values, and conversion velocity across African trade corridors.
            </p>
          </div>
        </div>

        <div class="dash-metrics-grid">
          <div class="dash-metric-card metric-gmv">
            <div class="metric-head">
              <span class="metric-title">Gross Sales Volume</span>
              <span class="metric-icon">💵</span>
            </div>
            <div class="metric-value">${grossRev}</div>
            <div class="metric-sub">+${this.metrics.periodGrowthPercent}% vs prior 30-day period</div>
          </div>

          <div class="dash-metric-card metric-auctions">
            <div class="metric-head">
              <span class="metric-title">Total Orders Fulfilled</span>
              <span class="metric-icon">📦</span>
            </div>
            <div class="metric-value">${this.metrics.totalOrdersCount}</div>
            <div class="metric-sub">${sellerListings.length} active catalog listings &bull; 8 hubs</div>
          </div>

          <div class="dash-metric-card metric-requests">
            <div class="metric-head">
              <span class="metric-title">Avg. Order Value (AOV)</span>
              <span class="metric-icon">📊</span>
            </div>
            <div class="metric-value">${aov}</div>
            <div class="metric-sub">Healthy commercial ticket size</div>
          </div>

          <div class="dash-metric-card metric-escrow">
            <div class="metric-head">
              <span class="metric-title">Store Conversion Rate</span>
              <span class="metric-icon">🎯</span>
            </div>
            <div class="metric-value">${this.metrics.conversionRatePercent}%</div>
            <div class="metric-sub">Return rate &lt; ${this.metrics.returnRatePercent}% (Excellent rating)</div>
          </div>
        </div>

        <!-- Sales Trend & Category Distribution Breakdown -->
        <div class="analytics-breakdown-row" style="margin-top: 24px;">
          <div class="breakdown-card">
            <h4>Regional Sales by African Hub</h4>
            <div class="distribution-bars">
              <div class="bar-group">
                <div class="bar-label"><span>🇳🇬 Lagos, Nigeria</span><strong>48%</strong></div>
                <div class="progress-track"><div class="progress-fill fill-green" style="width: 48%;"></div></div>
              </div>
              <div class="bar-group">
                <div class="bar-label"><span>🇰🇪 Nairobi, Kenya</span><strong>26%</strong></div>
                <div class="progress-track"><div class="progress-fill fill-blue" style="width: 26%;"></div></div>
              </div>
              <div class="bar-group">
                <div class="bar-label"><span>🇬🇭 Accra, Ghana</span><strong>14%</strong></div>
                <div class="progress-track"><div class="progress-fill fill-purple" style="width: 14%;"></div></div>
              </div>
              <div class="bar-group">
                <div class="bar-label"><span>🇿🇦 Johannesburg, South Africa</span><strong>12%</strong></div>
                <div class="progress-track"><div class="progress-fill fill-amber" style="width: 12%;"></div></div>
              </div>
            </div>
          </div>

          <div class="breakdown-card">
            <h4>Top-Grossing Categories</h4>
            <div class="distribution-bars">
              <div class="bar-group">
                <div class="bar-label"><span>☀️ Solar Inverters & Battery Storage</span><strong>42%</strong></div>
                <div class="progress-track"><div class="progress-fill fill-amber" style="width: 42%;"></div></div>
              </div>
              <div class="bar-group">
                <div class="bar-label"><span>🌾 Agricultural Machinery & Grinders</span><strong>31%</strong></div>
                <div class="progress-track"><div class="progress-fill fill-green" style="width: 31%;"></div></div>
              </div>
              <div class="bar-group">
                <div class="bar-label"><span>💻 Computers & Tech Electronics</span><strong>27%</strong></div>
                <div class="progress-track"><div class="progress-fill fill-blue" style="width: 27%;"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. Inventory Management
  private renderInventorySection(sellerListings: Listing[], activeCurrency: CurrencyCode): string {
    const filtered = sellerListings.filter((l) => {
      if (this.inventoryFilter === 'all') return true;
      if (this.inventoryFilter === 'auction') return l.format === 'auction';
      if (this.inventoryFilter === 'buy_now') return l.format === 'buy_now';
      if (this.inventoryFilter === 'sold') return l.isSold;
      return true;
    });

    return `
      <div class="seller-section-block">
        <div class="dash-panel-toolbar">
          <div class="panel-left">
            <h4>Catalog & Inventory Control (${sellerListings.length} Total SKUs)</h4>
            <p>Publish, update pricing, pause, or remove live auction and classified listings.</p>
          </div>
          <div class="panel-right">
            <button type="button" class="btn-dash-primary" id="btnSellerAddListing">
              <span>+ Post New Listing</span>
            </button>
          </div>
        </div>

        <div class="seller-sub-filters">
          <button type="button" class="seller-sub-pill ${this.inventoryFilter === 'all' ? 'active' : ''}" data-inv-filter="all">
            All Listings (${sellerListings.length})
          </button>
          <button type="button" class="seller-sub-pill ${this.inventoryFilter === 'auction' ? 'active' : ''}" data-inv-filter="auction">
            Live Auctions (${sellerListings.filter((l) => l.format === 'auction').length})
          </button>
          <button type="button" class="seller-sub-pill ${this.inventoryFilter === 'buy_now' ? 'active' : ''}" data-inv-filter="buy_now">
            Fixed Price Buy-Now (${sellerListings.filter((l) => l.format === 'buy_now').length})
          </button>
          <button type="button" class="seller-sub-pill ${this.inventoryFilter === 'sold' ? 'active' : ''}" data-inv-filter="sold">
            Sold / Completed (${sellerListings.filter((l) => l.isSold).length})
          </button>
        </div>

        <div class="inventory-table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>Item / SKU</th>
                <th>Category</th>
                <th>Format</th>
                <th>Price / Current Bid</th>
                <th>City Hub</th>
                <th>Bids / Interest</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
                filtered.length === 0
                  ? `<tr><td colspan="8" style="text-align: center; padding: 24px;">No listings found matching this filter.</td></tr>`
                  : filtered
                      .map((item) => {
                        const price = formatMoney(item.amountMinor, item.currency, {
                          showSecondary: true,
                          targetCurrency: activeCurrency,
                        });
                        return `
                        <tr>
                          <td>
                            <div class="inv-item-info">
                              <img src="${escapeHtml(safeImageUrl(item.imageUrl))}" alt="${escapeHtml(item.title)}" class="inv-thumb" />
                              <div>
                                <strong>${escapeHtml(item.title)}</strong>
                                <div class="inv-sku">ID: ${escapeHtml(item.id)}</div>
                              </div>
                            </div>
                          </td>
                          <td><span class="cat-chip">${escapeHtml(item.category)}</span></td>
                          <td><span class="fmt-chip ${escapeHtml(item.format)}">${escapeHtml(item.format.toUpperCase())}</span></td>
                          <td class="font-mono price-cell">${price}</td>
                          <td>${escapeHtml(item.city)}</td>
                          <td>${item.format === 'auction' ? `🔨 ${item.bidsCount || 0} bids` : '👁️ Active'}</td>
                          <td>
                            <span class="badge-status ${item.isSold ? 'badge-sold' : 'badge-active'}">
                              ${item.isSold ? 'Sold' : 'Active'}
                            </span>
                          </td>
                          <td>
                            <div class="inv-action-btns">
                              <button type="button" class="btn-inv-action btn-edit-listing" data-listing-id="${item.id}">Edit</button>
                              <button type="button" class="btn-inv-action btn-pause-listing" data-listing-id="${item.id}">Pause</button>
                            </div>
                          </td>
                        </tr>
                      `;
                      })
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 3. Order Fulfillment
  private renderFulfillmentSection(activeCurrency: CurrencyCode): string {
    return `
      <div class="seller-section-block">
        <div class="subpanel-header">
          <div>
            <h4>Order Fulfillment & Carrier Dispatch Queue</h4>
            <p>Generate courier waybills, dispatch items, and monitor delivery to trigger escrow payouts.</p>
          </div>
        </div>

        <div class="fulfillments-list">
          ${this.fulfillments
            .map((ful) => {
              const amount = formatMoney(ful.amountMinor, ful.currency, {
                showSecondary: true,
                targetCurrency: activeCurrency,
              });
              const isDispatched = ful.status === 'dispatched' || ful.status === 'delivered';
              return `
                <div class="fulfillment-card ${ful.status}">
                  <div class="ful-header">
                    <div>
                      <span class="ful-code">${ful.orderCode}</span>
                      <h4 class="ful-title">${ful.itemTitle}</h4>
                      <div class="ful-meta">
                        <span>Buyer: <strong>${ful.buyerName}</strong></span> &bull;
                        <span>Destination: <strong>📍 ${ful.destinationCity}</strong></span> &bull;
                        <span>Received: <strong>${ful.createdAt}</strong></span>
                      </div>
                    </div>
                    <div class="ful-amount-pill">${amount}</div>
                  </div>

                  <div class="ful-body">
                    <div class="ful-status-row">
                      <span class="ful-status-tag tag-${ful.status}">
                        ${ful.status === 'awaiting_dispatch' ? '⏳ Awaiting Carrier Dispatch' : ful.status === 'dispatched' ? '🚚 In Transit with Courier' : '✅ Delivered & Released'}
                      </span>
                      <span class="ful-courier-info">Courier: <strong>${ful.courier}</strong> &bull; Waybill: <strong class="font-mono">${ful.waybillNumber}</strong></span>
                    </div>

                    <div class="ful-actions-row">
                      <button type="button" class="btn-ful-btn btn-print-label" data-ful-id="${ful.id}">
                        📄 Generate Shipping Label
                      </button>
                      ${
                        !isDispatched
                          ? `<button type="button" class="btn-ful-btn btn-dispatch-order btn-primary-ful" data-ful-id="${ful.id}">
                              ✓ Mark Dispatched & Enter Waybill
                            </button>`
                          : `<button type="button" class="btn-ful-btn" disabled>
                              ✓ Dispatched (${ful.waybillNumber})
                            </button>`
                      }
                    </div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  // 4. Customer Support
  private renderCustomerSupportSection(): string {
    return `
      <div class="seller-section-block">
        <div class="subpanel-header">
          <div>
            <h4>Customer Inquiries & Return Requests</h4>
            <p>Maintain your 4.9-star vendor rating by responding swiftly to buyer inquiries and resolution tickets.</p>
          </div>
        </div>

        <div class="inquiries-list">
          ${this.inquiries
            .map(
              (inq) => `
              <div class="inquiry-card ${inq.status}">
                <div class="inq-top">
                  <div>
                    <span class="inq-badge inq-${inq.inquiryType.toLowerCase().replace(/\s+/g, '-')}">${inq.inquiryType}</span>
                    <h4 class="inq-subject">${inq.subject}</h4>
                    <span class="inq-meta">From: <strong>${inq.buyerName}</strong> &bull; Re: <strong>${inq.itemTitle}</strong> &bull; ${inq.date}</span>
                  </div>
                  <span class="inq-status-pill ${inq.status}">${inq.status.toUpperCase()}</span>
                </div>
                <p class="inq-message">"${inq.message}"</p>

                <div class="inq-actions-row">
                  ${
                    inq.status === 'open'
                      ? `
                      <input type="text" class="inq-reply-input" placeholder="Type your response to ${inq.buyerName}..." />
                      <button type="button" class="btn-inq-reply" data-inq-id="${inq.id}">Send Reply & Resolve</button>
                    `
                      : `<span class="inq-resolved-label">✅ Ticket resolved with customer</span>`
                  }
                </div>
              </div>
            `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  // 5. Financial Summaries
  private renderFinancialSummariesSection(activeCurrency: CurrencyCode): string {
    const avail = formatMoney(this.finance.availablePayoutMinor, this.finance.currency, {
      showSecondary: true,
      targetCurrency: activeCurrency,
    });
    const pending = formatMoney(this.finance.pendingEscrowMinor, this.finance.currency, {
      showSecondary: true,
      targetCurrency: activeCurrency,
    });
    const fees = formatMoney(this.finance.platformFeesMinor, this.finance.currency, {
      showSecondary: true,
      targetCurrency: activeCurrency,
    });
    const lifetime = formatMoney(this.finance.totalEarningsMinor, this.finance.currency, {
      showSecondary: true,
      targetCurrency: activeCurrency,
    });

    return `
      <div class="seller-section-block">
        <div class="subpanel-header">
          <div>
            <h4>Financial Summaries, Platform Fees & Payouts</h4>
            <p>Track your earnings, review platform commission deductions (5%), and request disbursements to your bank or mobile money.</p>
          </div>
        </div>

        <div class="dash-metrics-grid">
          <div class="dash-metric-card metric-gmv">
            <div class="metric-head">
              <span class="metric-title">Available for Payout</span>
              <span class="metric-icon">💵</span>
            </div>
            <div class="metric-value">${avail}</div>
            <div class="metric-sub">Ready for electronic transfer</div>
          </div>

          <div class="dash-metric-card metric-escrow">
            <div class="metric-head">
              <span class="metric-title">Pending in Escrow</span>
              <span class="metric-icon">🔒</span>
            </div>
            <div class="metric-value">${pending}</div>
            <div class="metric-sub">Awaiting handover OTP verification</div>
          </div>

          <div class="dash-metric-card metric-auctions">
            <div class="metric-head">
              <span class="metric-title">Platform Fees Deducted</span>
              <span class="metric-icon">📉</span>
            </div>
            <div class="metric-value">${fees}</div>
            <div class="metric-sub">5% standard African merchant fee</div>
          </div>

          <div class="dash-metric-card metric-requests">
            <div class="metric-head">
              <span class="metric-title">Lifetime Net Earnings</span>
              <span class="metric-icon">🏆</span>
            </div>
            <div class="metric-value">${lifetime}</div>
            <div class="metric-sub">All-time earnings via Servilist</div>
          </div>
        </div>

        <!-- Payout Action Box -->
        <div class="payout-action-card" style="margin-top: 24px;">
          <div class="payout-dest-info">
            <h4>Direct Disbursement Destination</h4>
            <div class="dest-badge">🏦 ${this.finance.payoutDestination}</div>
            <p>Automated EFT clears in 1-2 hours via NIBSS (Nigeria), KEPSS (Kenya), or GhIPSS (Ghana).</p>
          </div>
          <button type="button" class="btn-request-payout" id="btnRequestPayout">
            💸 Request Payout (${avail})
          </button>
        </div>

        <!-- Payout History Table -->
        <div class="payout-history-wrapper" style="margin-top: 24px;">
          <h4>Disbursement History</h4>
          <table class="receipts-table">
            <thead>
              <tr>
                <th>Reference #</th>
                <th>Date</th>
                <th>Amount Transferred</th>
                <th>Destination</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${this.finance.payoutHistory
                .map((po) => {
                  const amt = formatMoney(po.amountMinor, this.finance.currency, {
                    showSecondary: true,
                    targetCurrency: activeCurrency,
                  });
                  return `
                  <tr>
                    <td class="font-mono"><strong>${po.reference}</strong></td>
                    <td>${po.date}</td>
                    <td class="font-mono price-cell">${amt}</td>
                    <td>${po.destination}</td>
                    <td><span class="badge-success">✓ ${po.status.toUpperCase()}</span></td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  private bindEvents(
    container: HTMLElement,
    sellerListings: Listing[],
    activeCurrency: CurrencyCode
  ) {
    // Subnav tabs
    container.querySelectorAll('[data-seller-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.sellerTab as SellerSubTab;
        if (tab) {
          this.setSubTab(tab);
          this.render(container, sellerListings, activeCurrency);
        }
      });
    });

    // Inventory Filter Pills
    container.querySelectorAll('[data-inv-filter]').forEach((pill) => {
      pill.addEventListener('click', () => {
        this.inventoryFilter = (pill as HTMLElement).dataset.invFilter || 'all';
        this.render(container, sellerListings, activeCurrency);
      });
    });

    // Post New Listing CTA
    container.querySelector('#btnSellerAddListing')?.addEventListener('click', () => {
      this.callbacks.onOpenPostListing();
    });

    // Generate Shipping Label
    container.querySelectorAll('.btn-print-label').forEach((btn) => {
      btn.addEventListener('click', () => {
        const fulId = (btn as HTMLElement).dataset.fulId;
        this.callbacks.onToast(
          `Generating courier waybill & shipping barcode for order ${fulId}...`,
          'info'
        );
      });
    });

    // Dispatch Order
    container.querySelectorAll('.btn-dispatch-order').forEach((btn) => {
      btn.addEventListener('click', () => {
        const fulId = (btn as HTMLElement).dataset.fulId;
        const item = this.fulfillments.find((f) => f.id === fulId);
        if (item) {
          item.status = 'dispatched';
          item.waybillNumber = `WB-DISP-${Math.floor(100000 + Math.random() * 900000)}`;
          this.callbacks.onToast(
            `Order ${item.orderCode} marked as dispatched with courier waybill ${item.waybillNumber}!`,
            'success'
          );
          this.render(container, sellerListings, activeCurrency);
        }
      });
    });

    // Inquiries Reply & Resolve
    container.querySelectorAll('.btn-inq-reply').forEach((btn) => {
      btn.addEventListener('click', () => {
        const inqId = (btn as HTMLElement).dataset.inqId;
        const parent = btn.closest('.inquiry-card');
        const input = parent?.querySelector('.inq-reply-input') as HTMLInputElement | null;
        const replyText = input?.value.trim() || '';

        const inq = this.inquiries.find((i) => i.id === inqId);
        if (inq) {
          inq.status = 'resolved';
          this.callbacks.onToast(
            `Reply sent to ${inq.buyerName}: "${replyText || 'Resolved'}"`,
            'success'
          );
          this.render(container, sellerListings, activeCurrency);
        }
      });
    });

    // Request Payout
    container.querySelector('#btnRequestPayout')?.addEventListener('click', () => {
      const avail = this.finance.availablePayoutMinor;
      if (avail <= 0) {
        this.callbacks.onToast('No available payout balance at this time.', 'warning');
        return;
      }
      const ref = `PAYOUT-2026-10-${Math.floor(100 + Math.random() * 900)}`;
      this.finance.payoutHistory.unshift({
        id: `po-${Date.now()}`,
        reference: ref,
        date: 'Just now',
        amountMinor: avail,
        destination: this.finance.payoutDestination,
        status: 'processing',
      });
      this.finance.availablePayoutMinor = 0;
      this.callbacks.onToast(
        `Disbursement of ${formatMoney(avail, this.finance.currency)} requested! Ref: ${ref}`,
        'success'
      );
      this.render(container, sellerListings, activeCurrency);
    });

    // Edit/Pause Listing
    container.querySelectorAll('.btn-edit-listing').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.callbacks.onToast('Edit listing dialog opened.', 'info');
      });
    });
    container.querySelectorAll('.btn-pause-listing').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.callbacks.onToast('Listing paused from marketplace display.', 'warning');
      });
    });
  }
}
