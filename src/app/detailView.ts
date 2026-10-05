/** Listing and buyer-request detail modals: action boxes, bid history and quotes. */
import { Listing, BuyerRequest } from '../types';
import { toMinorUnits, fromMinorUnits, formatMoney, CURRENCY_CONFIGS } from '../money';
import { calculateMinimumNextBid } from '../auctions';
import { listingActions, requestActions } from '../domain/marketRules';
import type { UserProfile } from '../types';
import { AppRouter } from '../routing/router';
import type { ServilistApp } from '../main';

export function openDetailModal(app: ServilistApp, listingId: string) {
  const item = app.listings.find((l) => l.id === listingId);
  if (!item) return;

  app.currentListingDetail = item;
  app.currentRequestDetail = null;
  const modal = document.getElementById('detailModalOverlay');
  if (!modal) return;

  const img = document.getElementById('detailMainImg') as HTMLImageElement | null;
  if (img) img.src = item.imageUrl;

  const title = document.getElementById('detailTitle');
  if (title) title.textContent = item.title;

  const locationText = document.getElementById('detailLocationText');
  if (locationText) locationText.textContent = `📍 ${item.city}, ${item.country}`;

  const descText = document.getElementById('detailDescriptionText');
  if (descText) descText.textContent = item.description;

  renderOwnerStrip(
    item.seller,
    listingActions(item, app.authService.getCurrentUser().id).canMessage
  );

  const quotesSection = document.getElementById('detailQuotesSection');
  if (quotesSection) quotesSection.style.display = 'none';

  app.renderDetailActionBox(item);
  app.renderBidHistory(item);
  app.syncWatchlistButton(item.id);

  AppRouter.setListingUrl(item.id);
  app.dialogs['detailModalOverlay']?.open();
}

export function openRequestDetailModal(app: ServilistApp, requestId: string) {
  const req = app.requests.find((r) => r.id === requestId);
  if (!req) return;

  app.currentRequestDetail = req;
  app.currentListingDetail = null;
  const modal = document.getElementById('detailModalOverlay');
  if (!modal) return;

  const img = document.getElementById('detailMainImg') as HTMLImageElement | null;
  if (img)
    img.src =
      req.imageUrl ||
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

  const title = document.getElementById('detailTitle');
  if (title) title.textContent = req.title;

  const locationText = document.getElementById('detailLocationText');
  if (locationText) locationText.textContent = `📍 ${req.city}, ${req.country}`;

  const descText = document.getElementById('detailDescriptionText');
  if (descText) descText.textContent = req.description;

  renderOwnerStrip(req.buyer, requestActions(req, app.authService.getCurrentUser().id).canMessage);
  const bidSection = document.getElementById('detailBidHistorySection');
  if (bidSection) bidSection.style.display = 'none';

  app.renderRequestActionBox(req);
  app.renderQuotesList(req);

  AppRouter.setRequestUrl(req.id);
  app.dialogs['detailModalOverlay']?.open();
}

/** Shows who posted the item, with only what the data actually says about them. */
function renderOwnerStrip(owner: UserProfile, canMessage: boolean) {
  const set = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set('detailSellerName', owner.name);
  set('detailSellerAvatar', owner.avatar);
  set(
    'detailSellerRating',
    owner.reviewsCount > 0
      ? `${owner.rating.toFixed(1)} from ${owner.reviewsCount} reviews`
      : 'New member, no reviews yet'
  );
  const stars = document.querySelector<HTMLElement>('.seller-rating-row .stars');
  if (stars) stars.style.display = owner.reviewsCount > 0 ? '' : 'none';
  const badge = document.getElementById('detailSellerBadge');
  if (badge) badge.style.display = owner.verified ? '' : 'none';
  const contact = document.getElementById('btnContactSeller');
  if (contact) contact.style.display = canMessage ? '' : 'none';
}

const note = (text: string) => `<div class="action-note">${text}</div>`;

export function renderDetailActionBox(app: ServilistApp, item: Listing) {
  const box = document.getElementById('detailActionBox');
  if (!box) return;

  const actions = listingActions(item, app.authService.getCurrentUser().id);
  const price = formatMoney(item.amountMinor, item.currency, {
    showSecondary: true,
    targetCurrency: app.activeCurrency,
  });
  const isAuction = item.format === 'auction';
  const stateLabel: Record<string, string> = {
    active: isAuction ? 'Bidding open' : 'Available',
    ended: 'Auction ended',
    sold: 'Sold',
    cancelled: 'Withdrawn',
  };
  const priceLabel = isAuction
    ? `${actions.state === 'active' ? 'Current bid' : 'Final bid'} (${item.bidsCount} bids)`
    : item.amountMinor > 0
      ? 'Price'
      : 'Free or swap';

  let body = '';
  if (actions.canBid) {
    const minNext = calculateMinimumNextBid(item.amountMinor, item.currency, item.bidsCount > 0);
    body = `
      <form id="detailBidForm" class="bid-action-form">
        <div class="bid-input-group">
          <span class="bid-prefix">${CURRENCY_CONFIGS[item.currency].symbol.trim()}</span>
          <input type="number" id="detailBidInput" value="${minNext.minimumNextBidMajor}" min="${minNext.minimumNextBidMajor}" step="any" required>
        </div>
        <button type="submit" class="btn-place-bid">Place bid</button>
      </form>
      <div class="bid-hint">Minimum next bid: ${formatMoney(minNext.minimumNextBidMinor, item.currency)}${actions.isTopBidder ? ' · You are the highest bidder' : ''}</div>`;
  } else if (actions.canBuy) {
    body = `
      <button type="button" class="btn-buy-now" id="detailBuyNowBtn">Buy now</button>
      ${note('This opens an order with a private handover code. Payment is arranged with the seller at handover; online payment is not available yet.')}`;
  } else if (actions.canSettle) {
    body =
      actions.settlement === 'sale'
        ? `<button type="button" class="btn-buy-now" id="detailSettleBtn">${actions.isOwner ? 'Close auction and open the order' : 'You won. Open your order'}</button>`
        : `<button type="button" class="btn-secondary" id="detailSettleBtn">Close auction (no sale)</button>
           ${note(item.bidsCount ? 'The highest bid did not reach the reserve price.' : 'This auction received no bids.')}`;
  } else if (actions.state === 'ended') {
    body = note('This auction has ended. Bidding is closed.');
  } else if (actions.state === 'sold') {
    body = note('This item has been sold.');
  } else if (actions.state === 'cancelled') {
    body = note('The seller withdrew this listing.');
  } else if (actions.isOwner) {
    body = note(
      isAuction
        ? 'This is your auction. You can close it when the time runs out.'
        : 'This is your listing. Orders and messages appear in your activity.'
    );
  } else {
    body = note('Message the owner to arrange a swap or pickup.');
  }

  if (actions.canWithdraw) {
    body +=
      '<button type="button" class="btn-secondary" id="detailWithdrawBtn">Withdraw listing</button>';
  }

  box.innerHTML = `
    <div class="action-card">
      <div class="action-head">
        <div>
          <span class="action-price-label">${priceLabel}</span>
          <div class="action-current-bid">${price}</div>
        </div>
        <div class="modal-timer-badge">
          <span>Status:</span>
          <strong id="modalTimerClock">${stateLabel[actions.state]}</strong>
        </div>
      </div>
      ${body}
    </div>`;

  box.querySelector('#detailBidForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const majorVal = parseFloat((box.querySelector('#detailBidInput') as HTMLInputElement)?.value);
    if (majorVal > 0) app.placeBid(item.id, toMinorUnits(majorVal, item.currency));
  });
  box
    .querySelector('#detailBuyNowBtn')
    ?.addEventListener('click', () => app.createEscrowFromListing(item));
  box
    .querySelector('#detailSettleBtn')
    ?.addEventListener('click', () => app.settleAuction(item.id));
  box
    .querySelector('#detailWithdrawBtn')
    ?.addEventListener('click', () => app.withdrawListing(item.id));
}

export function renderRequestActionBox(app: ServilistApp, req: BuyerRequest) {
  const box = document.getElementById('detailActionBox');
  if (!box) return;

  const actions = requestActions(req, app.authService.getCurrentUser().id);
  const formattedBudget = formatMoney(req.budgetAmountMinor, req.currency, {
    showSecondary: true,
    targetCurrency: app.activeCurrency,
  });
  const budgetMajor = fromMinorUnits(req.budgetAmountMinor, req.currency);

  let body: string;
  if (actions.canQuote) {
    body = `
      <div class="quote-form-container">
        <h4 class="quote-form-title">Send the buyer a quote</h4>
        <form id="detailQuoteForm" class="detail-quote-form">
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label" for="quotePriceInput">Your price (${CURRENCY_CONFIGS[req.currency].symbol.trim()})</label>
              <input type="number" id="quotePriceInput" value="${budgetMajor}" min="1" step="any" required>
            </div>
            <div class="form-group flex-1">
              <label class="form-label" for="quoteTimelineInput">When you can deliver</label>
              <input type="text" id="quoteTimelineInput" placeholder="e.g. Today in Ikeja" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="quoteMessageInput">Details</label>
            <textarea id="quoteMessageInput" rows="2" placeholder="Condition, warranty or scope of work" required></textarea>
          </div>
          <button type="submit" class="btn-submit-quote">Send quote</button>
        </form>
      </div>`;
  } else if (actions.isOwner) {
    body =
      note(
        actions.isOpen
          ? 'This is your request. Quotes from sellers appear below; accept one to open an order.'
          : 'This request is closed.'
      ) +
      (actions.canCancel
        ? '<button type="button" class="btn-secondary" id="detailCancelRequestBtn">Cancel request</button>'
        : '');
  } else if (actions.hasQuoted) {
    body = note('Your quote is with the buyer. You will see it below, and in your activity.');
  } else {
    body = note('This request is no longer accepting quotes.');
  }

  box.innerHTML = `
    <div class="action-card action-card-request">
      <div class="action-head">
        <div>
          <span class="action-price-label">Buyer's target budget</span>
          <div class="action-current-bid">${formattedBudget}</div>
        </div>
        <div class="urgency-badge">
          <span>${app.escapeHtml(req.urgency)}</span>
        </div>
      </div>
      ${body}
    </div>`;

  box.querySelector('#detailQuoteForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const priceVal = parseFloat((box.querySelector('#quotePriceInput') as HTMLInputElement).value);
    const timeline = (box.querySelector('#quoteTimelineInput') as HTMLInputElement).value;
    const message = (box.querySelector('#quoteMessageInput') as HTMLTextAreaElement).value;
    app.submitQuote(req.id, toMinorUnits(priceVal, req.currency), timeline, message);
  });
  box
    .querySelector('#detailCancelRequestBtn')
    ?.addEventListener('click', () => app.cancelRequest(req.id));
}

export function renderBidHistory(app: ServilistApp, item: Listing) {
  const list = document.getElementById('detailBidHistoryList');
  const sec = document.getElementById('detailBidHistorySection');
  const count = document.getElementById('detailHistoryCount');
  if (!list || !sec) return;

  if (item.format !== 'auction') {
    sec.style.display = 'none';
    return;
  }

  sec.style.display = 'block';
  if (count) count.textContent = String(item.bidsCount || 0);

  const history = item.bidHistory || [];
  if (history.length === 0) {
    list.innerHTML = `<div class="empty-hint">No bids placed yet. Be the first!</div>`;
    return;
  }

  list.innerHTML = history
    .map(
      (b) => `
      <div class="bid-history-item">
        <div>
          <strong>${app.escapeHtml(b.bidderName)}</strong>
          <span class="bid-time">${b.timeFormatted || 'Just now'}</span>
        </div>
        <div class="bid-val">${formatMoney(b.amountMinor, b.currency)}</div>
      </div>
    `
    )
    .join('');
}

export function renderQuotesList(app: ServilistApp, req: BuyerRequest) {
  const list = document.getElementById('detailQuotesList');
  const sec = document.getElementById('detailQuotesSection');
  const count = document.getElementById('detailQuotesCount');
  if (!list || !sec) return;

  sec.style.display = 'block';
  const currentUser = app.authService.getCurrentUser();
  // Enforce RLS policy: Quotes on a request are readable only by the requester and quoting vendor
  const isRequester = req.buyer?.id === currentUser.id || currentUser.role === 'admin';
  const canAccept = requestActions(req, currentUser.id).canAcceptQuotes;

  const allOffers = req.offers || [];
  const visibleOffers = allOffers.filter((off) => isRequester || off.providerId === currentUser.id);

  if (count) count.textContent = String(visibleOffers.length);

  if (visibleOffers.length === 0) {
    list.innerHTML = isRequester
      ? `<div class="empty-hint">No quotes yet. Sellers who can help will send theirs here.</div>`
      : `<div class="empty-hint">Quotes on this request are private between the buyer and each seller.</div>`;
    return;
  }

  list.innerHTML = visibleOffers
    .map(
      (off) => `
      <div class="quote-item-card">
        <div class="quote-item-head">
          <div>
            <strong>${app.escapeHtml(off.providerName)}</strong>
            <span class="rating">(${off.providerRating} ★)</span>
          </div>
          <div class="quote-price">${formatMoney(off.amountMinor, off.currency)}</div>
        </div>
        <div class="quote-body">
          <div><strong>Timeline:</strong> ${app.escapeHtml(off.timeline)}</div>
          <p>"${app.escapeHtml(off.message)}"</p>
        </div>
        ${
          canAccept
            ? `
        <div class="quote-footer">
          <button type="button" class="btn-detail-accept-quote" data-req-id="${req.id}" data-off-id="${off.id}">
            Accept this quote
          </button>
        </div>
        `
            : ''
        }
      </div>
    `
    )
    .join('');

  list.querySelectorAll('.btn-detail-accept-quote').forEach((b) => {
    b.addEventListener('click', () => {
      const reqId = (b as HTMLElement).dataset.reqId;
      const offId = (b as HTMLElement).dataset.offId;
      app.acceptQuote(reqId!, offId!);
    });
  });
}
