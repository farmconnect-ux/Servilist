/** Demo-mode live updates between tabs and browsers. */
import { Listing, BuyerRequest } from '../types';
import type { ServilistApp } from '../main';

export function initSyncListener(app: ServilistApp) {
  app.syncManager.subscribe((msg) => {
    if (msg.type === 'LISTING_CREATED' && msg.payload) {
      const newListing: Listing = msg.payload;
      if (!app.listings.some((l) => l.id === newListing.id)) {
        app.listings.unshift(newListing);
        app.storage.saveListings(app.listings);
        app.renderListings();
        app.renderCategoryCounts();
        app.updateTopBarStats();
        app.updateDashboardMetrics();
        app.showToast(`✨ Live update: New listing "${newListing.title}"`, 'info');
      }
    } else if (msg.type === 'REQUEST_CREATED' && msg.payload) {
      const newReq: BuyerRequest = msg.payload;
      if (!app.requests.some((r) => r.id === newReq.id)) {
        app.requests.unshift(newReq);
        app.storage.saveRequests(app.requests);
        app.renderListings();
        app.renderCategoryCounts();
        app.updateTopBarStats();
        app.updateDashboardMetrics();
        app.showToast(`✨ Live update: New request "${newReq.title}"`, 'info');
      }
    } else if (msg.type === 'BID_PLACED' && msg.payload) {
      const { listingId, bid, amountMinor } = msg.payload;
      const item = app.listings.find((l) => l.id === listingId);
      if (item) {
        item.amountMinor = amountMinor;
        item.bidsCount = (item.bidsCount || 0) + 1;
        if (!item.bidHistory) item.bidHistory = [];
        if (!item.bidHistory.some((b) => b.id === bid.id)) {
          item.bidHistory.unshift(bid);
        }
        app.storage.saveListings(app.listings);
        app.renderListings();
        if (app.currentListingDetail?.id === listingId) {
          app.openDetailModal(listingId);
        }
      }
    } else if (msg.type === 'QUOTE_PLACED' && msg.payload) {
      const { requestId, quote } = msg.payload;
      const req = app.requests.find((r) => r.id === requestId);
      if (req) {
        if (!req.offers) req.offers = [];
        if (!req.offers.some((o) => o.id === quote.id)) {
          req.offers.unshift(quote);
        }
        app.storage.saveRequests(app.requests);
        if (app.currentRequestDetail?.id === requestId) {
          app.openRequestDetailModal(requestId);
        }
      }
    }
  });

  if (!app.cloud && typeof window !== 'undefined' && (window as any).supabase) {
    app.syncManager.initSupabaseRealtime((window as any).supabase, (newListing) => {
      if (!app.listings.some((l) => l.id === newListing.id)) {
        app.listings.unshift(newListing);
        app.storage.saveListings(app.listings);
        app.renderListings();
        app.renderCategoryCounts();
        app.updateTopBarStats();
      }
    });
  }
}
