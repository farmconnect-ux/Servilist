/** Demo-mode Supabase console actions and seed reset. */
import { SEED_LISTINGS, SEED_REQUESTS } from '../data/seeds';
import type { ServilistApp } from '../main';

export async function testSupabaseConnection(app: ServilistApp) {
  const supa = (window as any).servilistSupabase || (window as any).servlistSupabase;
  if (supa && typeof supa.testConnection === 'function') {
    const res = await supa.testConnection();
    if (res?.success) {
      app.showToast('🟢 Supabase cloud ping successful!', 'success');
    } else {
      app.showToast('Supabase ping failed: ' + (res?.error || 'Backend unavailable'), 'info');
    }
  } else {
    app.showToast('Supabase client not loaded', 'warning');
  }
}

export async function syncWithSupabase(app: ServilistApp) {
  const supa = (window as any).servilistSupabase || (window as any).servlistSupabase;
  if (supa && typeof supa.syncToCloud === 'function') {
    const res = await supa.syncToCloud({
      listings: app.listings,
      requests: app.requests,
      escrow: app.escrowOrders,
    });
    if (res?.success) {
      app.showToast('🎉 All local data synced to Supabase!', 'success');
    } else {
      app.showToast('Saved locally. Backend Supabase sync is unavailable.', 'info');
    }
  } else {
    app.showToast('Saved locally. Backend Supabase sync is unavailable.', 'info');
  }
}

export function downloadSchema(app: ServilistApp) {
  window.open('supabase_schema.sql', '_blank');
  app.showToast('Opening supabase_schema.sql', 'info');
}

export function resetToSeedData(app: ServilistApp) {
  if (app.cloud) return;
  if (confirm('Reset marketplace to authentic African seed listings & requests?')) {
    app.listings = JSON.parse(JSON.stringify(SEED_LISTINGS));
    app.requests = JSON.parse(JSON.stringify(SEED_REQUESTS));
    app.storage.saveListings(app.listings);
    app.storage.saveRequests(app.requests);
    app.renderListings();
    app.renderCategoryCounts();
    app.updateTopBarStats();
    app.updateDashboardMetrics();
    app.showToast('African marketplace seed data restored', 'success');
  }
}
