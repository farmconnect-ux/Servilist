import { formatMoney } from '../money';
import { Conversation, buildConversations, renderConversationList } from './chat';
import type { BuyerRequest, EscrowOrder, Listing, Message } from '../types';

export type ActivityTab =
  'watchlist' | 'my_listings' | 'my_bids' | 'my_requests' | 'my_quotes' | 'orders' | 'messages';

export const ACTIVITY_TABS: { id: ActivityTab; label: string }[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'my_listings', label: 'My listings' },
  { id: 'my_bids', label: 'My bids' },
  { id: 'my_requests', label: 'My requests' },
  { id: 'my_quotes', label: 'My quotes' },
  { id: 'messages', label: 'Messages' },
  { id: 'watchlist', label: 'Saved' },
];

export interface ActivityData {
  userId: string;
  listings: Listing[];
  requests: BuyerRequest[];
  escrowOrders: EscrowOrder[];
  watchlistIds: Set<string>;
  messages: Message[];
}

export interface ActivityHandlers {
  onOpenListing(id: string): void;
  onOpenRequest(id: string): void;
  onConfirmHandover(orderId: string, code: string): void;
  onSelectTab(tab: ActivityTab): void;
  onOpenConversation(conversation: Conversation): void;
}

export interface ActivityView {
  watchlist: Listing[];
  myListings: Listing[];
  myBids: { listing: Listing; myBidMinor: number; leading: boolean }[];
  myRequests: BuyerRequest[];
  myQuotes: { request: BuyerRequest; amountMinor: number; status: string }[];
  orders: EscrowOrder[];
  conversations: Conversation[];
}

/** Everything the signed-in member owns or takes part in, derived from the loaded data. */
export function buildActivityView(data: ActivityData): ActivityView {
  const { userId, listings, requests, escrowOrders, watchlistIds } = data;

  const myBids = listings.flatMap((listing) => {
    const mine = (listing.bidHistory || []).filter((b) => b.bidderId === userId);
    if (!mine.length) return [];
    const myBidMinor = Math.max(...mine.map((b) => b.amountMinor));
    const topMinor = Math.max(...listing.bidHistory.map((b) => b.amountMinor));
    return [{ listing, myBidMinor, leading: myBidMinor >= topMinor }];
  });

  const myQuotes = requests.flatMap((request) =>
    (request.offers || [])
      .filter((o) => o.providerId === userId)
      .map((o) => ({ request, amountMinor: o.amountMinor, status: o.status }))
  );

  return {
    watchlist: listings.filter((l) => watchlistIds.has(l.id)),
    myListings: listings.filter((l) => l.seller.id === userId),
    myBids,
    myRequests: requests.filter((r) => r.buyer.id === userId),
    myQuotes,
    orders: escrowOrders.filter((o) => o.buyerId === userId || o.sellerId === userId),
    conversations: buildConversations(data.messages, userId, listings, requests),
  };
}

export function activityCounts(view: ActivityView): Record<ActivityTab, number> {
  return {
    watchlist: view.watchlist.length,
    my_listings: view.myListings.length,
    my_bids: view.myBids.length,
    my_requests: view.myRequests.length,
    my_quotes: view.myQuotes.length,
    orders: view.orders.length,
    messages: view.conversations.length,
  };
}

function esc(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMPTY: Record<ActivityTab, string> = {
  watchlist: 'Nothing saved yet. Open a listing and choose "Add to Watchlist".',
  my_listings: 'You have not posted a listing yet.',
  my_bids: 'You have not placed any bids yet.',
  my_requests: 'You have not posted a buyer request yet.',
  my_quotes: 'You have not sent any quotes yet.',
  orders: 'No orders yet. Purchases and sales appear here.',
  messages: 'No messages yet.',
};

function listingRow(listing: Listing, meta: string, badge = ''): string {
  return `
    <div class="drawer-item-card" data-listing-id="${esc(listing.id)}" role="button" tabindex="0">
      <img class="drawer-thumb" src="${esc(listing.imageUrl)}" alt="" loading="lazy" />
      <div class="drawer-item-info">
        <div class="drawer-item-title">${esc(listing.title)}</div>
        <div class="drawer-item-meta"><span>${meta}</span>${badge}</div>
      </div>
    </div>`;
}

function requestRow(request: BuyerRequest, meta: string, badge = ''): string {
  return `
    <div class="drawer-item-card" data-request-id="${esc(request.id)}" role="button" tabindex="0">
      <div class="drawer-item-info">
        <div class="drawer-item-title">${esc(request.title)}</div>
        <div class="drawer-item-meta"><span>${meta}</span>${badge}</div>
      </div>
    </div>`;
}

const ORDER_STATUS: Record<string, string> = {
  funded: 'Handover pending',
  inspection: 'Being inspected',
  otp_verified: 'Code verified',
  released: 'Completed',
  disputed: 'In dispute',
  refunded: 'Refunded',
};

function orderRow(order: EscrowOrder, userId: string): string {
  const buying = order.buyerId === userId;
  const open = order.status === 'funded' || order.status === 'inspection';
  const amount = formatMoney(order.amountMinor, order.currency);
  const badgeClass = order.status === 'released' ? 'status-winning' : 'status-pending';

  let action = '';
  if (open && buying) {
    action = `
      <div class="order-handover">
        <span class="order-handover-label">Your handover code</span>
        <strong class="order-handover-code">${esc(order.otpCode || '••••••')}</strong>
        <span class="order-handover-hint">Read it to the seller only after you have received and checked the item.</span>
      </div>`;
  } else if (open) {
    action = `
      <form class="order-handover order-handover-form" data-order-id="${esc(order.id)}">
        <label class="order-handover-label" for="otp-${esc(order.id)}">Enter the buyer's handover code</label>
        <div class="order-handover-row">
          <input id="otp-${esc(order.id)}" class="order-handover-input" inputmode="numeric" maxlength="7" placeholder="6-digit code" required />
          <button type="submit" class="btn-primary">Confirm handover</button>
        </div>
      </form>`;
  }

  return `
    <div class="drawer-order-card">
      <div class="drawer-item-meta">
        <span>${buying ? 'Buying from' : 'Selling to'} ${esc(buying ? order.sellerName : order.buyerName)} · ${esc(order.orderCode)}</span>
        <span class="drawer-status-badge ${badgeClass}">${ORDER_STATUS[order.status] || esc(order.status)}</span>
      </div>
      <div class="drawer-item-title">${esc(order.title)}</div>
      <div class="drawer-item-meta"><span>${amount} · ${esc(order.safeZone)}</span></div>
      ${action}
    </div>`;
}

export function renderActivityBody(tab: ActivityTab, view: ActivityView, userId: string): string {
  if (tab === 'messages') return renderConversationList(view.conversations);
  let rows: string[] = [];
  switch (tab) {
    case 'watchlist':
      rows = view.watchlist.map((l) => listingRow(l, formatMoney(l.amountMinor, l.currency)));
      break;
    case 'my_listings':
      rows = view.myListings.map((l) =>
        listingRow(
          l,
          `${formatMoney(l.amountMinor, l.currency)} · ${l.bidsCount} bids`,
          `<span class="drawer-status-badge ${l.status === 'active' ? 'status-winning' : 'status-pending'}">${esc(l.status)}</span>`
        )
      );
      break;
    case 'my_bids':
      rows = view.myBids.map(({ listing, myBidMinor, leading }) =>
        listingRow(
          listing,
          `Your bid ${formatMoney(myBidMinor, listing.currency)}`,
          `<span class="drawer-status-badge ${leading ? 'status-winning' : 'status-outbid'}">${leading ? 'Leading' : 'Outbid'}</span>`
        )
      );
      break;
    case 'my_requests':
      rows = view.myRequests.map((r) =>
        requestRow(
          r,
          `Budget ${formatMoney(r.budgetAmountMinor, r.currency)}`,
          `<span class="drawer-status-badge status-pending">${r.offers.length} ${r.offers.length === 1 ? 'quote' : 'quotes'}</span>`
        )
      );
      break;
    case 'my_quotes':
      rows = view.myQuotes.map(({ request, amountMinor, status }) =>
        requestRow(
          request,
          `Your quote ${formatMoney(amountMinor, request.currency)}`,
          `<span class="drawer-status-badge ${status === 'accepted' ? 'status-winning' : status === 'rejected' ? 'status-outbid' : 'status-pending'}">${esc(status)}</span>`
        )
      );
      break;
    case 'orders':
      rows = view.orders.map((o) => orderRow(o, userId));
      break;
  }
  return rows.length ? rows.join('') : `<p class="drawer-empty">${EMPTY[tab]}</p>`;
}

/** Renders the drawer (tabs and body) into `panel` and wires its controls. */
export function renderActivityDrawer(
  panel: HTMLElement,
  tab: ActivityTab,
  data: ActivityData,
  handlers: ActivityHandlers
) {
  const view = buildActivityView(data);
  const counts = activityCounts(view);

  const tabs = panel.querySelector('.drawer-tabs');
  if (tabs) {
    tabs.innerHTML = ACTIVITY_TABS.map(
      (t) =>
        `<button type="button" class="drawer-tab ${t.id === tab ? 'active' : ''}" data-activity-tab="${t.id}">${t.label} (${counts[t.id]})</button>`
    ).join('');
    tabs.querySelectorAll<HTMLElement>('[data-activity-tab]').forEach((btn) => {
      btn.addEventListener('click', () =>
        handlers.onSelectTab(btn.dataset.activityTab as ActivityTab)
      );
    });
  }

  const body = panel.querySelector<HTMLElement>('.drawer-body');
  if (!body) return;
  body.innerHTML = renderActivityBody(tab, view, data.userId);

  const open = (el: HTMLElement) => {
    if (el.dataset.listingId) handlers.onOpenListing(el.dataset.listingId);
    else if (el.dataset.requestId) handlers.onOpenRequest(el.dataset.requestId);
    else if (el.dataset.conversation) {
      const conversation = view.conversations.find((c) => c.key === el.dataset.conversation);
      if (conversation) handlers.onOpenConversation(conversation);
    }
  };
  body.querySelectorAll<HTMLElement>('.drawer-item-card').forEach((card) => {
    card.addEventListener('click', () => open(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(card);
      }
    });
  });
  body.querySelectorAll<HTMLFormElement>('.order-handover-form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector<HTMLInputElement>('.order-handover-input');
      handlers.onConfirmHandover(form.dataset.orderId || '', input?.value.trim() || '');
    });
  });
}
