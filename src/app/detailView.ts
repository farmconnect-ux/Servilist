/** Listing and buyer-request detail modals: action boxes, bid history and quotes. */
import { Listing, BuyerRequest } from '../types';
import { toMinorUnits, fromMinorUnits, formatMoney, CURRENCY_CONFIGS } from '../money';
import { calculateMinimumNextBid } from '../auctions';
import { AppRouter } from '../routing/router';
import type { ServilistApp } from '../main';

export function openDetailModal(app: ServilistApp, listingId: string) {
  const item = app.listings.find((l) => l.id === listingId);
  if (!item) return;

  app.currentListingDetail = item;
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

  const sellerName = document.getElementById('detailSellerName');
  if (sellerName) sellerName.textContent = item.seller.name;

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

  app.renderRequestActionBox(req);
  app.renderQuotesList(req);

  AppRouter.setRequestUrl(req.id);
  app.dialogs['detailModalOverlay']?.open();
}

export function renderDetailActionBox(app: ServilistApp, item: Listing) {
  const box = document.getElementById('detailActionBox');
  if (!box) return;

  const isSold = item.isSold || item.status === 'sold';
  const isEnded = item.endTime && item.endTime <= Date.now();
  const formattedPrice = formatMoney(item.amountMinor, item.currency, {
    showSecondary: true,
    targetCurrency: app.activeCurrency,
  });

  if (item.format === 'auction') {
    const minNext = calculateMinimumNextBid(item.amountMinor, item.currency, item.bidsCount > 0);
    const minMajor = minNext.minimumNextBidMajor;

    box.innerHTML = `
      <div class="action-card">
        <div class="action-head">
          <div>
            <span class="action-price-label">${isSold ? 'Sold Price' : 'Current Bid'} (${item.bidsCount} bids)</span>
            <div class="action-current-bid">${formattedPrice}</div>
          </div>
          <div class="modal-timer-badge">
            <span>⏱️ Status:</span>
            <strong id="modalTimerClock">${isSold ? 'Item Sold' : isEnded ? 'Auction Ended' : 'Active'}</strong>
          </div>
        </div>
        ${
          !isSold && !isEnded
            ? `
          <form id="detailBidForm" class="bid-action-form">
            <div class="bid-input-group">
              <span class="bid-prefix">${CURRENCY_CONFIGS[item.currency].symbol.trim()}</span>
              <input type="number" id="detailBidInput" value="${minMajor}" min="${minMajor}" step="any" required>
            </div>
            <button type="submit" class="btn-place-bid">🔨 Place Bid Now</button>
          </form>
          <div class="bid-hint">Minimum next bid: ${formatMoney(minNext.minimumNextBidMinor, item.currency)}</div>
        `
            : `
          <div class="alert-box-ended">
            ${isSold ? '✅ This item has been sold.' : '⏱️ Auction has ended. Bidding closed.'}
          </div>
        `
        }
      </div>
    `;

    box.querySelector('#detailBidForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = (box.querySelector('#detailBidInput') as HTMLInputElement)?.value;
      const majorVal = parseFloat(inp);
      if (majorVal > 0) {
        const minorVal = toMinorUnits(majorVal, item.currency);
        app.placeBid(item.id, minorVal);
      }
    });
  } else {
    // Buy It Now or Service
    box.innerHTML = `
      <div class="action-card">
        <div class="action-head">
          <div>
            <span class="action-price-label">Price</span>
            <div class="action-current-bid">${formattedPrice}</div>
          </div>
        </div>
        <button type="button" class="btn-buy-now" id="detailBuyNowBtn">
          ⚡ Buy Now with Escrow Protection
        </button>
      </div>
    `;

    box.querySelector('#detailBuyNowBtn')?.addEventListener('click', () => {
      app.createEscrowFromListing(item);
    });
  }
}

export function renderRequestActionBox(app: ServilistApp, req: BuyerRequest) {
  const box = document.getElementById('detailActionBox');
  if (!box) return;

  const formattedBudget = formatMoney(req.budgetAmountMinor, req.currency, {
    showSecondary: true,
    targetCurrency: app.activeCurrency,
  });
  const budgetMajor = fromMinorUnits(req.budgetAmountMinor, req.currency);

  box.innerHTML = `
    <div class="action-card action-card-request">
      <div class="action-head">
        <div>
          <span class="action-price-label">Buyer's Target Budget</span>
          <div class="action-current-bid">${formattedBudget}</div>
        </div>
        <div class="urgency-badge">
          <span>⏱️ ${app.escapeHtml(req.urgency)}</span>
        </div>
      </div>
      <div class="quote-form-container">
        <h4 class="quote-form-title">Submit a Proposal / Quote to Buyer:</h4>
        <form id="detailQuoteForm" class="detail-quote-form">
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Proposed Price (${CURRENCY_CONFIGS[req.currency].symbol.trim()})</label>
              <input type="number" id="quotePriceInput" value="${budgetMajor}" min="1" step="any" required>
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Availability / Timeline</label>
              <input type="text" id="quoteTimelineInput" placeholder="e.g. Can deliver today in Ikeja" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Message / Details</label>
            <textarea id="quoteMessageInput" rows="2" placeholder="Detail condition, warranty, or scope..." required></textarea>
          </div>
          <button type="submit" class="btn-submit-quote">
            🚀 Send Quote to Buyer
          </button>
        </form>
      </div>
    </div>
  `;

  box.querySelector('#detailQuoteForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const priceVal = parseFloat((box.querySelector('#quotePriceInput') as HTMLInputElement).value);
    const timeline = (box.querySelector('#quoteTimelineInput') as HTMLInputElement).value;
    const message = (box.querySelector('#quoteMessageInput') as HTMLTextAreaElement).value;

    const minorPrice = toMinorUnits(priceVal, req.currency);
    app.submitQuote(req.id, minorPrice, timeline, message);
  });
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

  const allOffers = req.offers || [];
  const visibleOffers = allOffers.filter(
    (off) =>
      isRequester ||
      off.providerName === currentUser.name ||
      (off as any).providerId === currentUser.id
  );

  if (count) count.textContent = String(visibleOffers.length);

  if (visibleOffers.length === 0) {
    list.innerHTML = isRequester
      ? `<div class="empty-hint">No quotes submitted yet. Verified vendors will submit quotes here.</div>`
      : `<div class="empty-hint">Quotes on app request are private between the requester and vendor. Use the form above to submit your proposal!</div>`;
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
          isRequester
            ? `
        <div class="quote-footer">
          <button type="button" class="btn-detail-accept-quote" data-req-id="${req.id}" data-off-id="${off.id}">
            🤝 Accept Offer & Escrow
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
