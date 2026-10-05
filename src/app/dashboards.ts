/** Buyer, seller and admin hubs (demo mode) and their metrics. */
import { convertMinor, formatMoney } from '../money';
import { BuyerSubTab, SellerSubTab, AdminSubTab } from '../dashboards/types';
import type { ServilistApp } from '../main';

/** Orders the current member is buying; only the buyer may see the handover code. */
export function buyerOrders(app: ServilistApp) {
  const userId = app.authService.getCurrentUser().id;
  return app.escrowOrders.filter((order) => order.buyerId === userId);
}

export function sellerListings(app: ServilistApp) {
  const userId = app.authService.getCurrentUser().id;
  return app.listings.filter((listing) => listing.seller.id === userId);
}

export function openBuyerDashboard(app: ServilistApp, subTab: BuyerSubTab = 'orders') {
  // The hubs run on sample figures; live members get their real activity instead
  if (app.cloud) {
    app.openDrawer(subTab === 'wishlist' ? 'watchlist' : 'orders');
    return;
  }
  const body = document.getElementById('buyerDashboardBody');
  if (body) {
    app.dashboardManager.setBuyerSubTab(subTab);
    app.dashboardManager.renderBuyerDashboard(body, buyerOrders(app), app.activeCurrency);
  }
  app.dialogs['buyerDashboardModalOverlay']?.open();
}

export function openSellerDashboard(app: ServilistApp, subTab: SellerSubTab = 'analytics') {
  if (app.cloud) {
    app.openDrawer('my_listings');
    return;
  }
  const body = document.getElementById('sellerDashboardBody');
  if (body) {
    app.dashboardManager.setSellerSubTab(subTab);
    app.dashboardManager.renderSellerDashboard(body, sellerListings(app), app.activeCurrency);
  }
  app.dialogs['sellerDashboardModalOverlay']?.open();
}

export function openAdminDashboard(app: ServilistApp, subTab: AdminSubTab = 'analytics') {
  if (app.cloud) return;
  const body = document.getElementById('adminDashboardBody');
  if (body) {
    app.dashboardManager.setAdminSubTab(subTab);
    app.dashboardManager.renderAdminDashboard(body, app.activeCurrency);
  }
  app.dialogs['adminDashboardModalOverlay']?.open();
}

export function openDashboardsModal(app: ServilistApp, tab: string = 'overview') {
  if (tab === 'seller') {
    app.openSellerDashboard('analytics');
  } else if (tab === 'buyer' || tab === 'escrow') {
    app.openBuyerDashboard('orders');
  } else {
    app.openAdminDashboard('analytics');
  }
}

export function switchDashboardTab(app: ServilistApp, tab: string) {
  if (tab === 'seller') {
    app.openSellerDashboard('analytics');
  } else if (tab === 'buyer' || tab === 'escrow') {
    app.openBuyerDashboard('orders');
  } else {
    app.openAdminDashboard('analytics');
  }
}

export function renderEscrowOrders(app: ServilistApp) {
  const body = document.getElementById('buyerDashboardBody');
  if (body) {
    app.dashboardManager.renderBuyerDashboard(body, buyerOrders(app), app.activeCurrency);
  }
}

export function updateDashboardMetrics(app: ServilistApp) {
  const gmvEl = document.getElementById('dashMetricGMV');
  const aucEl = document.getElementById('dashMetricAuctions');
  const reqEl = document.getElementById('dashMetricRequests');
  const escEl = document.getElementById('dashMetricEscrow');

  if (aucEl) aucEl.textContent = String(app.listings.filter((l) => l.format === 'auction').length);
  if (reqEl) reqEl.textContent = String(app.requests.length);

  let totalGmvMinor = 0;
  app.listings.forEach((l) => {
    totalGmvMinor += convertMinor(l.amountMinor, l.currency, app.activeCurrency);
  });

  if (gmvEl) gmvEl.textContent = formatMoney(totalGmvMinor, app.activeCurrency);

  let totalEscrowMinor = 0;
  app.escrowOrders.forEach((o) => {
    totalEscrowMinor += convertMinor(o.amountMinor, o.currency, app.activeCurrency);
  });
  if (escEl) escEl.textContent = formatMoney(totalEscrowMinor, app.activeCurrency);
}
