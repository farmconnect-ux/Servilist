/** Feed cards for listings and buyer requests. */
import { Listing, BuyerRequest } from '../types';
import { formatMoney } from '../money';
import { ICONS } from '../ui/icons';
import { escapeHtml, safeImageUrl } from '../ui/html';
import type { ServilistApp } from '../main';

const FORMAT_LABELS: Record<string, string> = {
  auction: 'Auction',
  buy_now: 'Buy now',
  service: 'Service',
  free_barter: 'Free or swap',
};

export function buildListingCardHtml(app: ServilistApp, item: Listing): string {
  const isSold = item.isSold || item.status === 'sold';
  const isEnded = Boolean(item.endTime && item.endTime <= Date.now());
  const formattedPrice = formatMoney(item.amountMinor, item.currency, {
    showSecondary: true,
    targetCurrency: app.activeCurrency,
  });

  return `
    <article class="listing-card ${isSold ? 'card-sold' : ''} ${isEnded ? 'card-ended' : ''}" data-id="${escapeHtml(item.id)}">
      <div class="card-image-wrap">
        <img src="${escapeHtml(safeImageUrl(item.imageUrl))}" alt="${app.escapeHtml(item.title)}" loading="lazy" decoding="async">
        <span class="card-badge badge-${escapeHtml(item.format)}">${escapeHtml(FORMAT_LABELS[item.format] || item.format)}</span>
        ${isSold ? '<span class="sold-banner">Sold</span>' : isEnded ? '<span class="ended-banner">Ended</span>' : ''}
      </div>
      <div class="card-content">
        <div class="card-meta">
          <span class="card-location">${ICONS.location} ${app.escapeHtml(item.city)}</span>
          <span class="card-category">${escapeHtml(item.category)}</span>
        </div>
        <h3 class="card-title">${app.escapeHtml(item.title)}</h3>
        <div class="card-price-row">
          <div>
            <span class="price-label">${item.format === 'auction' ? 'Current bid' : item.amountMinor > 0 ? 'Price' : 'Free or swap'}</span>
            <div class="price-value">${formattedPrice}</div>
          </div>
          ${item.format === 'auction' ? `<div class="card-bids-count">${item.bidsCount} bids</div>` : ''}
        </div>
        <div class="card-footer">
          <span class="seller-name">${app.escapeHtml(item.seller.name)}</span>
          <span class="verified-tag">${item.seller.verified ? 'Verified' : ''}</span>
        </div>
      </div>
    </article>
  `;
}

export function buildRequestCardHtml(app: ServilistApp, req: BuyerRequest): string {
  const budgetFormatted = formatMoney(req.budgetAmountMinor, req.currency, {
    showSecondary: true,
    targetCurrency: app.activeCurrency,
  });

  return `
    <article class="listing-card card-request" data-req-id="${escapeHtml(req.id)}">
      <div class="card-image-wrap">
        <img src="${escapeHtml(safeImageUrl(req.imageUrl))}" alt="${app.escapeHtml(req.title)}" loading="lazy" decoding="async">
        <span class="card-badge badge-request">${req.requestType === 'service' ? 'Service wanted' : 'Item wanted'}</span>
      </div>
      <div class="card-content">
        <div class="card-meta">
          <span class="card-location">${ICONS.location} ${app.escapeHtml(req.city)}</span>
          <span class="card-urgency">${app.escapeHtml(req.urgency)}</span>
        </div>
        <h3 class="card-title">${app.escapeHtml(req.title)}</h3>
        <div class="card-price-row">
          <div>
            <span class="price-label">Target Budget</span>
            <div class="price-value">${budgetFormatted}</div>
          </div>
          <div class="card-offers-count">${req.offers?.length || 0} quotes</div>
        </div>
        <div class="card-footer">
          <span class="buyer-name">${app.escapeHtml(req.buyer.name)}</span>
          <span class="action-hint">Send a quote &rarr;</span>
        </div>
      </div>
    </article>
  `;
}

export function bindCardEvents(app: ServilistApp, container: HTMLElement) {
  container.querySelectorAll('.listing-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = (card as HTMLElement).dataset.id;
      const reqId = (card as HTMLElement).dataset.reqId;
      if (id) {
        app.openDetailModal(id);
      } else if (reqId) {
        app.openRequestDetailModal(reqId);
      }
    });
  });
}
