/** Buyer, seller and admin hubs (demo mode) and their metrics. */
import { convertMinor, formatMoney } from '../money';
import { BuyerSubTab, SellerSubTab, AdminSubTab } from '../dashboards/types';
import { PolicyEvaluator } from '../auth/policies';
import type { ServilistApp } from '../main';

export function openBuyerDashboard(app: ServilistApp, subTab: BuyerSubTab = 'orders') {
  // The hubs run on sample figures; live members get their real activity instead
  if (app.cloud) {
    app.openDrawer(subTab === 'wishlist' ? 'watchlist' : 'orders');
    return;
  }
  const body = document.getElementById('buyerDashboardBody');
  if (body) {
    app.dashboardManager.setBuyerSubTab(subTab);
    const currentUser = app.authService.getCurrentUser();
    const visibleOrders = app.escrowOrders.filter((order) =>
      PolicyEvaluator.canReadEscrowOrder(currentUser, order)
    );
    app.dashboardManager.renderBuyerDashboard(body, visibleOrders, app.activeCurrency);
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
    app.dashboardManager.renderSellerDashboard(body, app.listings, app.activeCurrency);
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
    app.dashboardManager.renderBuyerDashboard(body, app.escrowOrders, app.activeCurrency);
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
