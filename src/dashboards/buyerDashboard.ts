import { escapeHtml } from '../ui/html';
import {
  BuyerShipment,
  PurchaseReceipt,
  WishlistItem,
  BuyerMessage,
  ShippingAddress,
  SavedPaymentMethod,
  BuyerSubTab,
} from './types';
import { formatMoney } from '../money';
import { CurrencyCode, EscrowOrder } from '../types';

export interface BuyerDashboardCallbacks {
  onReleaseEscrowOtp: (orderId: string, otpInput: string) => void;
  onOpenPostRequest: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export class BuyerDashboardView {
  private activeSubTab: BuyerSubTab = 'orders';
  private shipments: BuyerShipment[];
  private receipts: PurchaseReceipt[];
  private wishlist: WishlistItem[];
  private messages: BuyerMessage[];
  private addresses: ShippingAddress[];
  private paymentMethods: SavedPaymentMethod[];
  private callbacks: BuyerDashboardCallbacks;

  constructor(
    initialData: {
      shipments: BuyerShipment[];
      receipts: PurchaseReceipt[];
      wishlist: WishlistItem[];
      messages: BuyerMessage[];
      addresses: ShippingAddress[];
      paymentMethods: SavedPaymentMethod[];
    },
    callbacks: BuyerDashboardCallbacks
  ) {
    this.shipments = [...initialData.shipments];
    this.receipts = [...initialData.receipts];
    this.wishlist = [...initialData.wishlist];
    this.messages = [...initialData.messages];
    this.addresses = [...initialData.addresses];
    this.paymentMethods = [...initialData.paymentMethods];
    this.callbacks = callbacks;
  }

  public setSubTab(tab: BuyerSubTab) {
    this.activeSubTab = tab;
  }

  public getSubTab(): BuyerSubTab {
    return this.activeSubTab;
  }

  public render(container: HTMLElement, escrowOrders: EscrowOrder[], activeCurrency: CurrencyCode) {
    container.innerHTML = `
      <div class="dash-role-container buyer-dash-theme">
        <!-- Sub-navigation tabs for Buyer Dashboard -->
        <div class="dash-subnav-bar" role="tablist" aria-label="Buyer Dashboard Navigation">
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'orders' ? 'active' : ''}" data-buyer-tab="orders">
            <span>📦 Order Tracking & Escrow</span>
          </button>
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'history' ? 'active' : ''}" data-buyer-tab="history">
            <span>🧾 Purchase History (${this.receipts.length})</span>
          </button>
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'wishlist' ? 'active' : ''}" data-buyer-tab="wishlist">
            <span>❤️ Wishlists & Price Alerts (${this.wishlist.length})</span>
          </button>
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'communication' ? 'active' : ''}" data-buyer-tab="communication">
            <span>💬 Communication (${this.messages.length})</span>
          </button>
          <button type="button" class="dash-subnav-btn ${this.activeSubTab === 'settings' ? 'active' : ''}" data-buyer-tab="settings">
            <span>⚙️ Account Settings</span>
          </button>
        </div>

        <div class="dash-subpanel-content">
          ${this.renderSubPanel(escrowOrders, activeCurrency)}
        </div>
      </div>
    `;

    this.bindEvents(container, escrowOrders, activeCurrency);
  }

  private renderSubPanel(escrowOrders: EscrowOrder[], activeCurrency: CurrencyCode): string {
    switch (this.activeSubTab) {
      case 'orders':
        return this.renderOrderTrackingSection(escrowOrders, activeCurrency);
      case 'history':
        return this.renderPurchaseHistorySection(activeCurrency);
      case 'wishlist':
        return this.renderWishlistSection(activeCurrency);
      case 'communication':
        return this.renderCommunicationSection();
      case 'settings':
        return this.renderAccountSettingsSection();
    }
  }

  // 1. Order Tracking & Escrow
  private renderOrderTrackingSection(
    escrowOrders: EscrowOrder[],
    activeCurrency: CurrencyCode
  ): string {
    return `
      <div class="buyer-section-block">
        <div class="section-banner-callout">
          <div class="banner-icon">🛡️</div>
          <div class="banner-text">
            <h4>Active Order Tracking & Escrow Handover Protection</h4>
            <p>
              Your funds are held securely until physical inspection. Never share your secret 6-digit Handover OTP until you inspect and accept your goods in person.
            </p>
          </div>
        </div>

        <!-- ESCROW ORDERS CONTAINER (Maintains backward compatibility with test selectors) -->
        <div class="escrow-orders-subpanel" id="dashPanelEscrow">
          <div class="subpanel-header">
            <h4>Live Escrow Vault Orders (${escrowOrders.length})</h4>
            <span class="subpanel-badge">Protected by Licensed Payment Gateways</span>
          </div>

          <div class="escrow-orders-container" id="escrowOrdersContainer">
            ${
              escrowOrders.length === 0
                ? `<div class="empty-escrow-card">
                    <span style="font-size: 2rem;">🛡️</span>
                    <h4>No active escrow orders</h4>
                    <p>Orders appear here when you accept a vendor quote or win a live timed auction.</p>
                  </div>`
                : escrowOrders
                    .map((order) => this.renderEscrowCardHtml(order, activeCurrency))
                    .join('')
            }
          </div>
        </div>

        <!-- ACTIVE CARRIER SHIPMENTS (Pan-African Couriers) -->
        <div class="shipments-subpanel" style="margin-top: 24px;">
          <div class="subpanel-header">
            <h4>Active Dispatch & Courier Shipments (${this.shipments.length})</h4>
            <span class="subpanel-badge">Real-Time Waybill Monitoring</span>
          </div>

          <div class="shipment-cards-grid">
            ${this.shipments.map((ship) => this.renderShipmentCardHtml(ship, activeCurrency)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  private renderEscrowCardHtml(order: EscrowOrder, activeCurrency: CurrencyCode): string {
    const isReleased = order.status === 'released';
    const formattedAmount = formatMoney(order.amountMinor, order.currency, {
      showSecondary: true,
      targetCurrency: activeCurrency,
    });

    return `
      <div class="escrow-order-card ${isReleased ? 'order-completed' : 'order-locked'}">
        <div class="escrow-card-top">
          <div class="escrow-meta-left">
            <span class="escrow-code">${escapeHtml(order.orderCode)}</span>
            <span class="escrow-date">Funded ${new Date(order.fundedAt).toLocaleDateString()}</span>
          </div>
          <div class="escrow-status-pill ${isReleased ? 'status-released' : 'status-held'}">
            ${isReleased ? '✓ Payout Released' : '🔒 Funds Locked in Escrow'}
          </div>
        </div>

        <div class="escrow-card-body">
          <h4 class="escrow-item-title">${escapeHtml(order.title)}</h4>
          <div class="escrow-parties-row">
            <span><strong>Seller:</strong> ${escapeHtml(order.sellerName)}</span>
            <span>&bull;</span>
            <span><strong>Buyer:</strong> ${escapeHtml(order.buyerName)}</span>
            <span>&bull;</span>
            <span><strong>Safe Zone:</strong> 📍 ${escapeHtml(order.safeZone)}</span>
          </div>
          <div class="escrow-amount-display">${formattedAmount}</div>
        </div>

        <div class="escrow-card-otp-box">
          ${
            isReleased
              ? `<div class="otp-released-notice">
                  <span>✅ Handover Confirmed: Escrow funds of ${formattedAmount} have been successfully released to ${escapeHtml(order.sellerName)}.</span>
                </div>`
              : `<div class="otp-input-flow">
                  <div class="otp-info">
                    <span class="otp-label">Secret Handover OTP (Buyer Key):</span>
                    <strong class="otp-display-badge">${escapeHtml(order.otpCode)}</strong>
                    <span class="otp-sub">Provide this 6-digit code to the courier or seller upon physical handover inspection.</span>
                  </div>
                  <div class="otp-action-row">
                    <input type="text" class="otp-input-field" placeholder="Enter OTP code" data-order-id="${escapeHtml(order.id)}" />
                    <button type="button" class="btn-release-escrow" data-order-id="${escapeHtml(order.id)}">
                      Confirm Handover & Release Escrow
                    </button>
                  </div>
                </div>`
          }
        </div>
      </div>
    `;
  }

  private renderShipmentCardHtml(ship: BuyerShipment, activeCurrency: CurrencyCode): string {
    const formattedAmount = formatMoney(ship.amountMinor, ship.currency, {
      showSecondary: true,
      targetCurrency: activeCurrency,
    });

    return `
      <div class="shipment-track-card">
        <div class="shipment-track-top">
          <div>
            <span class="shipment-number">${ship.orderNumber}</span>
            <h4 class="shipment-title">${ship.itemTitle}</h4>
            <div class="shipment-meta">
              <span>Sold by <strong>${ship.sellerName}</strong></span> &bull;
              <span>Courier: <strong>${ship.courier}</strong> (${ship.trackingNumber})</span>
            </div>
          </div>
          <div class="shipment-amount-badge">${formattedAmount}</div>
        </div>

        <!-- 4-Stage Stepper -->
        <div class="shipment-stepper">
          <div class="stepper-step ${ship.currentStep >= 1 ? 'step-done' : ''} ${ship.currentStep === 1 ? 'step-active' : ''}">
            <div class="step-circle">1</div>
            <span class="step-name">Escrow Funded</span>
          </div>
          <div class="stepper-line ${ship.currentStep >= 2 ? 'line-done' : ''}"></div>
          <div class="stepper-step ${ship.currentStep >= 2 ? 'step-done' : ''} ${ship.currentStep === 2 ? 'step-active' : ''}">
            <div class="step-circle">2</div>
            <span class="step-name">Dispatched</span>
          </div>
          <div class="stepper-line ${ship.currentStep >= 3 ? 'line-done' : ''}"></div>
          <div class="stepper-step ${ship.currentStep >= 3 ? 'step-done' : ''} ${ship.currentStep === 3 ? 'step-active' : ''}">
            <div class="step-circle">3</div>
            <span class="step-name">In Transit</span>
          </div>
          <div class="stepper-line ${ship.currentStep >= 4 ? 'line-done' : ''}"></div>
          <div class="stepper-step ${ship.currentStep >= 4 ? 'step-done' : ''} ${ship.currentStep === 4 ? 'step-active' : ''}">
            <div class="step-circle">4</div>
            <span class="step-name">Delivered & Released</span>
          </div>
        </div>

        <div class="shipment-footer">
          <div class="shipment-status-line">
            <span class="pulse-indicator"></span>
            <span>${ship.statusText}</span>
          </div>
          <div class="shipment-eta">
            <span>Est. Arrival: <strong>${ship.estimatedDelivery}</strong> &bull; Corridor: <strong>${ship.originCity} ➔ ${ship.destinationCity}</strong></span>
          </div>
        </div>
      </div>
    `;
  }

  // 2. Purchase History
  private renderPurchaseHistorySection(activeCurrency: CurrencyCode): string {
    return `
      <div class="buyer-section-block">
        <div class="subpanel-header">
          <div>
            <h4>Purchase History & Tax Receipts</h4>
            <p>Access your past commercial receipts, export digital invoices, or quickly reorder recurring supplies.</p>
          </div>
        </div>

        <div class="receipts-table-wrapper">
          <table class="receipts-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Date</th>
                <th>Item / Consignment</th>
                <th>Merchant</th>
                <th>Amount Paid</th>
                <th>Payment Rail</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.receipts
                .map((rcp) => {
                  const amt = formatMoney(rcp.amountMinor, rcp.currency, {
                    showSecondary: true,
                    targetCurrency: activeCurrency,
                  });
                  return `
                    <tr>
                      <td class="font-mono"><strong>${rcp.receiptNumber}</strong></td>
                      <td>${rcp.date}</td>
                      <td><strong>${rcp.itemTitle}</strong></td>
                      <td>${rcp.sellerName}</td>
                      <td class="font-mono price-cell">${amt}</td>
                      <td><span class="pay-chip">${rcp.paymentMethod}</span></td>
                      <td><span class="badge-success">✓ ${rcp.status.toUpperCase()}</span></td>
                      <td>
                        <button type="button" class="btn-receipt-action btn-download-receipt" data-receipt-id="${rcp.id}">
                          Download PDF
                        </button>
                      </td>
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

  // 3. Wishlists & Price Alerts
  private renderWishlistSection(activeCurrency: CurrencyCode): string {
    return `
      <div class="buyer-section-block">
        <div class="subpanel-header">
          <div>
            <h4>Saved Products & Price Drop Alerts</h4>
            <p>Set automated notification thresholds. You'll receive real-time SMS / WhatsApp alerts when sellers reduce their prices.</p>
          </div>
        </div>

        <div class="wishlist-grid">
          ${this.wishlist
            .map((item) => {
              const currentPrice = formatMoney(item.priceMinor, item.currency, {
                showSecondary: true,
                targetCurrency: activeCurrency,
              });
              const alertPrice = formatMoney(item.targetAlertPriceMinor, item.currency, {
                showSecondary: true,
                targetCurrency: activeCurrency,
              });
              return `
                <div class="wishlist-item-card">
                  <img src="${item.imageUrl}" alt="${item.title}" class="wishlist-thumb" />
                  <div class="wishlist-info">
                    <span class="wishlist-cat">${item.category.toUpperCase()} &bull; 📍 ${item.city}</span>
                    <h4 class="wishlist-title">${item.title}</h4>
                    <div class="wishlist-prices">
                      <span class="current-price">${currentPrice}</span>
                      <span class="alert-trigger">Alert at: <strong>${alertPrice}</strong></span>
                    </div>

                    <div class="wishlist-controls">
                      <label class="toggle-switch">
                        <input type="checkbox" class="wishlist-alert-toggle" data-wishlist-id="${item.id}" ${item.priceAlertEnabled ? 'checked' : ''} />
                        <span class="slider"></span>
                      </label>
                      <span class="toggle-label">${item.priceAlertEnabled ? '🔔 Alert Active' : '🔕 Alert Off'}</span>
                    </div>

                    <div class="wishlist-actions-row">
                      <button type="button" class="btn-wishlist-buy" data-listing-id="${item.listingId}">
                        Buy Now
                      </button>
                      <button type="button" class="btn-wishlist-remove" data-wishlist-id="${item.id}">
                        Remove
                      </button>
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

  // 4. Communication
  private renderCommunicationSection(): string {
    return `
      <div class="buyer-section-block">
        <div class="subpanel-header">
          <div>
            <h4>Seller Conversations & Direct Support</h4>
            <p>Direct encrypted messaging with African merchants regarding item specs, courier options, and quotes.</p>
          </div>
        </div>

        <div class="communication-layout">
          <div class="threads-list">
            ${this.messages
              .map(
                (msg, idx) => `
                <div class="msg-thread-item ${idx === 0 ? 'selected' : ''}" data-msg-id="${msg.id}">
                  <div class="thread-avatar">${msg.sellerAvatar}</div>
                  <div class="thread-content">
                    <div class="thread-top">
                      <strong>${msg.sellerName}</strong>
                      <span class="thread-time">${msg.timestamp}</span>
                    </div>
                    <div class="thread-re">Re: ${msg.itemTitle}</div>
                    <p class="thread-snippet">${msg.lastMessage}</p>
                  </div>
                  ${msg.unreadCount > 0 ? `<span class="unread-pill">${msg.unreadCount}</span>` : ''}
                </div>
              `
              )
              .join('')}
          </div>

          <div class="thread-conversation-view">
            <div class="conv-header">
              <div class="conv-seller">
                <strong>Nairobi Green Power Solutions</strong>
                <span class="verified-tag">✓ Verified African Merchant</span>
              </div>
              <span class="conv-listing">Re: 5kVA Solar Hybrid Inverter</span>
            </div>

            <div class="conv-body">
              <div class="chat-bubble received">
                <p>Hello John! The Sendy freight driver has verified the serial numbers against your escrow deposit.</p>
                <span class="bubble-time">10:45 AM</span>
              </div>
              <div class="chat-bubble sent">
                <p>Excellent. I've instructed my logistics agent to inspect the battery voltage before I enter the handover OTP.</p>
                <span class="bubble-time">11:02 AM</span>
              </div>
              <div class="chat-bubble received">
                <p>The Sendy courier has picked up the unit. Tracking ID attached: SND-KE-992384.</p>
                <span class="bubble-time">11:15 AM</span>
              </div>
            </div>

            <form class="conv-input-form" id="buyerReplyForm">
              <input type="text" placeholder="Type your reply to the seller..." required id="buyerReplyInput" />
              <button type="submit" class="btn-send-reply">Send Reply</button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  // 5. Account Settings
  private renderAccountSettingsSection(): string {
    return `
      <div class="buyer-section-block">
        <div class="subpanel-header">
          <div>
            <h4>Account Settings, Shipping Addresses & Payment Methods</h4>
            <p>Manage your saved Pan-African delivery hubs, regional tax identifiers, and mobile money accounts.</p>
          </div>
        </div>

        <div class="settings-two-col">
          <!-- Shipping Addresses -->
          <div class="settings-card">
            <div class="settings-card-head">
              <h4>📍 Saved Delivery Addresses</h4>
              <button type="button" class="btn-settings-add" id="btnAddAddressBtn">+ Add Address</button>
            </div>
            <div class="address-list">
              ${this.addresses
                .map(
                  (addr) => `
                  <div class="address-item address-card ${addr.isDefault ? 'default-address' : ''}">
                    <div class="addr-top">
                      <strong>${addr.label}</strong>
                      ${addr.isDefault ? '<span class="default-badge">Default</span>' : ''}
                    </div>
                    <div class="addr-name">${addr.recipientName} &bull; ${addr.phone}</div>
                    <div class="addr-street">${addr.street}, ${addr.city}, ${addr.country}</div>
                  </div>
                `
                )
                .join('')}
            </div>
          </div>

          <!-- Payment Methods -->
          <div class="settings-card">
            <div class="settings-card-head">
              <h4>💳 Payment Methods & Mobile Wallets</h4>
              <button type="button" class="btn-settings-add" id="btnAddPaymentBtn">+ Add Method</button>
            </div>
            <div class="payment-method-list">
              ${this.paymentMethods
                .map(
                  (pm) => `
                  <div class="pm-item ${pm.isDefault ? 'default-pm' : ''}">
                    <div class="pm-left">
                      <span class="pm-icon">${pm.type === 'mobile_money' ? '📱' : '💳'}</span>
                      <div>
                        <strong>${pm.provider}</strong>
                        <div class="pm-id">${pm.accountIdentifier}</div>
                      </div>
                    </div>
                    ${pm.isDefault ? '<span class="default-badge">Primary</span>' : ''}
                  </div>
                `
                )
                .join('')}
            </div>
            <div class="security-note">
              <span>🔒 Card transactions processed with bank-grade 3D Secure via Paystack and Flutterwave. Mobile Money authenticated via instant USSD prompt.</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(
    container: HTMLElement,
    escrowOrders: EscrowOrder[],
    activeCurrency: CurrencyCode
  ) {
    // Subnav tabs
    container.querySelectorAll('[data-buyer-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.buyerTab as BuyerSubTab;
        if (tab) {
          this.setSubTab(tab);
          this.render(container, escrowOrders, activeCurrency);
        }
      });
    });

    // Escrow Release Buttons
    container.querySelectorAll('.btn-release-escrow').forEach((btn) => {
      btn.addEventListener('click', () => {
        const orderId = (btn as HTMLElement).dataset.orderId;
        const parent = btn.closest('.escrow-order-card');
        const input = parent?.querySelector('.otp-input-field') as HTMLInputElement | null;
        const enteredOtp = input?.value.trim() || '';

        if (!orderId) return;
        this.callbacks.onReleaseEscrowOtp(orderId, enteredOtp);
      });
    });

    // Wishlist Alert Toggle
    container.querySelectorAll('.wishlist-alert-toggle').forEach((chk) => {
      chk.addEventListener('change', () => {
        const id = (chk as HTMLElement).dataset.wishlistId;
        const item = this.wishlist.find((w) => w.id === id);
        if (item) {
          item.priceAlertEnabled = (chk as HTMLInputElement).checked;
          this.callbacks.onToast(
            item.priceAlertEnabled
              ? `🔔 Price alert activated for "${item.title}"!`
              : `🔕 Price alert deactivated for "${item.title}".`,
            'info'
          );
          this.render(container, escrowOrders, activeCurrency);
        }
      });
    });

    // Wishlist Remove
    container.querySelectorAll('.btn-wishlist-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.wishlistId;
        this.wishlist = this.wishlist.filter((w) => w.id !== id);
        this.callbacks.onToast('Item removed from wishlist.', 'info');
        this.render(container, escrowOrders, activeCurrency);
      });
    });

    // Download Receipt
    container.querySelectorAll('.btn-download-receipt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.receiptId;
        this.callbacks.onToast(`Generating digital tax receipt PDF for ${id}...`, 'success');
      });
    });

    // Buyer Reply Form
    const replyForm = container.querySelector('#buyerReplyForm') as HTMLFormElement | null;
    replyForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = container.querySelector('#buyerReplyInput') as HTMLInputElement | null;
      if (input && input.value.trim()) {
        this.callbacks.onToast(`Message sent to seller: "${input.value.trim()}"`, 'success');
        input.value = '';
      }
    });

    // Add Address
    container.querySelector('#btnAddAddressBtn')?.addEventListener('click', () => {
      this.callbacks.onToast('Address creation form opened.', 'info');
    });

    // Add Payment Method
    container.querySelector('#btnAddPaymentBtn')?.addEventListener('click', () => {
      this.callbacks.onToast('Mobile Money / Card setup modal opened.', 'info');
    });
  }
}
