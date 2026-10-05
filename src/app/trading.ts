/** Bids, quotes and escrow orders. Cloud mode defers to the database functions. */
import { Listing } from '../types';
import { formatMoney } from '../money';
import { validateBid } from '../auctions';
import { listingActions } from '../domain/marketRules';
import { createQuote } from '../requests';
import { createEscrowOrder, transitionEscrow } from '../escrow';
import * as dashboards from './dashboards';
import type { ServilistApp } from '../main';

export function placeBid(app: ServilistApp, listingId: string, amountMinor: number) {
  const item = app.listings.find((l) => l.id === listingId);
  if (!item) return;

  const validation = validateBid(item, amountMinor);
  if (!validation.valid) {
    app.showToast(validation.error || 'Invalid bid', 'warning');
    return;
  }
  if (app.cloud) {
    void app.cloud.placeBid(item.id, amountMinor);
    return;
  }

  const currentUser = app.authService.getCurrentUser();
  const newBid = {
    id: `bid-${Date.now()}`,
    listingId: item.id,
    bidderId: currentUser.id,
    bidderName: currentUser.name,
    amountMinor,
    currency: item.currency,
    createdAt: Date.now(),
    timeFormatted: 'Just now',
  };

  item.amountMinor = amountMinor;
  item.bidsCount = (item.bidsCount || 0) + 1;
  if (!item.bidHistory) item.bidHistory = [];
  item.bidHistory.unshift(newBid);

  app.storage.saveListings(app.listings);
  app.syncManager.broadcast(
    'BID_PLACED',
    { listingId: item.id, bid: newBid, amountMinor },
    currentUser.id
  );
  app.renderListings();
  app.openDetailModal(item.id);

  app.showToast(
    `🎉 Highest Bid placed! You are currently winning at ${formatMoney(amountMinor, item.currency)}`,
    'success'
  );
}

export function submitQuote(
  app: ServilistApp,
  requestId: string,
  amountMinor: number,
  timeline: string,
  message: string
) {
  const req = app.requests.find((r) => r.id === requestId);
  if (!req) return;
  if (app.cloud) {
    void app.cloud.submitQuote(req, amountMinor, timeline, message);
    return;
  }

  const currentUser = app.authService.getCurrentUser();
  const newQuote = createQuote({
    requestId: req.id,
    providerName: currentUser.name,
    amountMinor,
    currency: req.currency,
    timeline,
    message,
  });
  newQuote.providerId = currentUser.id;

  if (!req.offers) req.offers = [];
  req.offers.unshift(newQuote);

  app.storage.saveRequests(app.requests);
  app.syncManager.broadcast('QUOTE_PLACED', { requestId: req.id, quote: newQuote }, currentUser.id);
  app.renderListings();
  app.renderQuotesList(req);
  app.showToast(`🚀 Quote sent to buyer!`, 'success');
}

export function acceptQuote(app: ServilistApp, requestId: string, quoteId: string) {
  const req = app.requests.find((r) => r.id === requestId);
  const offer = req?.offers?.find((o) => o.id === quoteId);
  if (!req || !offer) return;
  if (app.cloud) {
    void app.cloud.acceptQuote(req, offer.id);
    return;
  }

  const currentUser = app.authService.getCurrentUser();
  const order = createEscrowOrder({
    requestId: req.id,
    quoteId: offer.id,
    title: req.title,
    buyerName: currentUser.name,
    buyerId: currentUser.id,
    sellerName: offer.providerName,
    sellerId: offer.providerId,
    amountMinor: offer.amountMinor,
    currency: offer.currency,
    targetCurrency: app.activeCurrency,
    safeZone: `${req.city} Safe Commercial Zone`,
  });

  app.escrowOrders.unshift(order);
  offer.status = 'accepted';
  req.status = 'matched';

  app.storage.saveRequests(app.requests);
  app.storage.saveEscrowOrders(app.escrowOrders);

  app.dialogs['detailModalOverlay']?.close();
  app.showToast(`🎉 Offer accepted! Funds secured in Escrow!`, 'success');
  app.openBuyerDashboard('orders');
}

export function createEscrowFromListing(app: ServilistApp, item: Listing) {
  if (app.cloud) {
    void app.cloud.buyListing(item);
    return;
  }
  const currentUser = app.authService.getCurrentUser();
  const order = createEscrowOrder({
    listingId: item.id,
    title: item.title,
    buyerName: currentUser.name,
    buyerId: currentUser.id,
    sellerName: item.seller.name,
    sellerId: item.seller.id,
    amountMinor: item.amountMinor,
    currency: item.currency,
    targetCurrency: app.activeCurrency,
    safeZone: `${item.city} Safe Meetup Zone`,
  });

  item.isSold = true;
  item.status = 'sold';
  app.escrowOrders.unshift(order);

  app.storage.saveListings(app.listings);
  app.storage.saveEscrowOrders(app.escrowOrders);

  app.dialogs['detailModalOverlay']?.close();
  app.renderListings();
  app.showToast(`🎉 Order Placed! Payment secured in Escrow.`, 'success');
  app.openBuyerDashboard('orders');
}

export function verifyAndReleaseEscrow(app: ServilistApp, orderId: string, otpInput: string) {
  const order = app.escrowOrders.find((o) => o.id === orderId);
  if (!order) {
    app.showToast('Escrow order not found', 'warning');
    return;
  }
  if (app.cloud) {
    void app.cloud.confirmHandover(order, otpInput.trim());
    return;
  }
  const res = transitionEscrow(order, 'otp_verified', { otpAttempt: otpInput.trim() });
  if (res.success && res.order) {
    const released = transitionEscrow(res.order, 'released');
    if (released.success && released.order) {
      const idx = app.escrowOrders.findIndex((o) => o.id === orderId);
      if (idx !== -1) app.escrowOrders[idx] = released.order;
      app.storage.saveEscrowOrders(app.escrowOrders);
      app.showToast('🎉 Escrow payout released!', 'success');
      app.updateDashboardMetrics();
      app.updateActivityBadges();
      const buyerBody = document.getElementById('buyerDashboardBody');
      if (buyerBody) {
        app.dashboardManager.renderBuyerDashboard(
          buyerBody,
          dashboards.buyerOrders(app),
          app.activeCurrency
        );
      }
    }
  } else {
    app.showToast(res.error || 'Incorrect OTP code', 'warning');
  }
}

/** Closes an auction whose time has run out: a sale to the top bidder, or no sale. */
export function settleAuction(app: ServilistApp, listingId: string) {
  const item = app.listings.find((l) => l.id === listingId);
  if (!item) return;
  if (app.cloud) {
    void app.cloud.settleAuction(item);
    return;
  }

  const sale = listingActions(item, app.authService.getCurrentUser().id).settlement === 'sale';
  item.status = sale ? 'sold' : 'ended';
  item.isSold = sale;
  app.storage.saveListings(app.listings);
  app.refreshMarketplaceUI();
  app.openDetailModal(item.id);
  app.showToast(sale ? 'Auction closed with a sale' : 'Auction closed without a sale', 'info');
}

export function withdrawListing(app: ServilistApp, listingId: string) {
  const item = app.listings.find((l) => l.id === listingId);
  if (!item) return;
  if (app.cloud) {
    void app.cloud.withdrawListing(item);
    return;
  }

  item.status = 'cancelled';
  app.storage.saveListings(app.listings);
  app.closeModal('detailModalOverlay');
  app.refreshMarketplaceUI();
  app.showToast('Listing withdrawn', 'info');
}

export function cancelRequest(app: ServilistApp, requestId: string) {
  const req = app.requests.find((r) => r.id === requestId);
  if (!req) return;
  if (app.cloud) {
    void app.cloud.cancelRequest(req);
    return;
  }

  req.status = 'cancelled';
  app.storage.saveRequests(app.requests);
  app.closeModal('detailModalOverlay');
  app.refreshMarketplaceUI();
  app.showToast('Request cancelled', 'info');
}
