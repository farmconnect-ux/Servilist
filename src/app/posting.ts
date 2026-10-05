/** Post-a-listing and post-a-request forms. */
import { Listing, ListingFormat } from '../types';
import { getCurrencyForCity } from '../data/locations';
import { toMinorUnits, CURRENCY_CONFIGS } from '../money';
import { createBuyerRequest } from '../requests';
import type { ServilistApp } from '../main';

/** Prices are stored in the currency of the chosen city, so the form shows that symbol. */
export function syncPostCurrencySymbols() {
  const symbolFor = (selectId: string) => {
    const city = (document.getElementById(selectId) as HTMLSelectElement | null)?.value;
    return CURRENCY_CONFIGS[getCurrencyForCity(city || 'Lagos, Nigeria')]?.symbol.trim() || '';
  };
  const set = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set('postStartPriceSym', symbolFor('postCity'));
  set('postReservePriceSym', symbolFor('postCity'));
  set('reqBudgetSym', symbolFor('reqCity'));
}

export function openPostModal(app: ServilistApp, mode: 'sell' | 'request' = 'sell') {
  syncPostCurrencySymbols();
  app.switchPostTab(mode);
  app.dialogs['postModalOverlay']?.open();
}

export function switchPostTab(_app: ServilistApp, mode: 'sell' | 'request') {
  const tabSell = document.getElementById('modalTabSell');
  const tabReq = document.getElementById('modalTabRequest');
  const postForm = document.getElementById('postListingForm');
  const reqForm = document.getElementById('postRequestForm');

  if (mode === 'sell') {
    tabSell?.classList.add('active');
    tabReq?.classList.remove('active');
    if (postForm) postForm.style.display = 'block';
    if (reqForm) reqForm.style.display = 'none';
  } else {
    tabReq?.classList.add('active');
    tabSell?.classList.remove('active');
    if (postForm) postForm.style.display = 'none';
    if (reqForm) reqForm.style.display = 'block';
  }
}

export function updatePostFormatFields(_app: ServilistApp, format: ListingFormat) {
  const durGroup = document.getElementById('auctionDurationGroup');
  const resGroup = document.getElementById('reservePriceGroup');
  if (durGroup) durGroup.style.display = format === 'auction' ? 'block' : 'none';
  if (resGroup) resGroup.style.display = format === 'auction' ? 'block' : 'none';
}

export function handleCreateListing(app: ServilistApp) {
  const title = (document.getElementById('postTitle') as HTMLInputElement)?.value.trim();
  const category = (document.getElementById('postCategory') as HTMLSelectElement)?.value as any;
  const formatRadio = document.querySelector(
    "input[name='postFormat']:checked"
  ) as HTMLInputElement | null;
  const format = (formatRadio?.value || 'buy_now') as ListingFormat;
  const priceMajor =
    parseFloat((document.getElementById('postStartPrice') as HTMLInputElement)?.value) || 0;
  const reserveMajor =
    parseFloat((document.getElementById('postReservePrice') as HTMLInputElement)?.value) || 0;
  const durationHours =
    parseFloat((document.getElementById('postDuration') as HTMLSelectElement)?.value) || 24;
  const city =
    (document.getElementById('postCity') as HTMLSelectElement)?.value || 'Lagos, Nigeria';
  const imageUrl =
    (document.getElementById('postImageUrl') as HTMLInputElement)?.value.trim() ||
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
  const description = (
    document.getElementById('postDescription') as HTMLTextAreaElement
  )?.value.trim();

  const currency = getCurrencyForCity(city);
  const amountMinor = toMinorUnits(priceMajor, currency);
  const reserveMinor = reserveMajor > 0 ? toMinorUnits(reserveMajor, currency) : null;
  const currentUser = app.authService.getCurrentUser();

  const newListing: Listing = {
    id: `serv-${Date.now()}`,
    title,
    category,
    format,
    status: 'active',
    amountMinor,
    currency,
    reserveAmountMinor: reserveMinor,
    buyItNowAmountMinor: format === 'buy_now' ? amountMinor : null,
    bidsCount: 0,
    endTime: format === 'auction' ? Date.now() + 1000 * 60 * 60 * durationHours : null,
    city,
    country: 'Africa',
    fulfillment: 'both',
    imageUrl,
    description,
    seller: {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      rating: currentUser.rating,
      reviewsCount: currentUser.reviewsCount,
      verified: currentUser.verified,
      city: currentUser.city,
      country: currentUser.country,
    },
    bidHistory: [],
    createdAt: Date.now(),
  };

  if (app.cloud) {
    void app.cloud.createListing(newListing).then((ok) => {
      if (!ok) return;
      app.dialogs['postModalOverlay']?.close();
      (document.getElementById('postListingForm') as HTMLFormElement)?.reset();
    });
    return;
  }

  app.listings.unshift(newListing);
  app.storage.saveListings(app.listings);
  app.syncManager.broadcast('LISTING_CREATED', newListing, currentUser.id);

  app.dialogs['postModalOverlay']?.close();
  (document.getElementById('postListingForm') as HTMLFormElement)?.reset();

  app.showToast('🚀 Listing published across African commerce hubs!', 'success');
  app.renderListings();
  app.renderCategoryCounts();
  app.updateTopBarStats();
  app.updateDashboardMetrics();
}

export function handleCreateRequest(app: ServilistApp) {
  const title = (document.getElementById('reqTitle') as HTMLInputElement)?.value.trim();
  const category = (document.getElementById('reqCategory') as HTMLSelectElement)?.value as any;
  const typeRadio = document.querySelector(
    "input[name='requestType']:checked"
  ) as HTMLInputElement | null;
  const requestType = (typeRadio?.value || 'good') as any;
  const budgetMajor =
    parseFloat((document.getElementById('reqBudget') as HTMLInputElement)?.value) || 0;
  const rateType = ((document.getElementById('reqRateType') as HTMLSelectElement)?.value ||
    'flat') as any;
  const city = (document.getElementById('reqCity') as HTMLSelectElement)?.value || 'Lagos, Nigeria';
  const description = (
    document.getElementById('reqDescription') as HTMLTextAreaElement
  )?.value.trim();

  const currency = getCurrencyForCity(city);
  const budgetAmountMinor = toMinorUnits(budgetMajor, currency);
  const currentUser = app.authService.getCurrentUser();

  const newReq = createBuyerRequest({
    title,
    category,
    requestType,
    budgetAmountMinor,
    currency,
    rateType,
    city,
    country: 'Africa',
    description,
    buyer: {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      rating: currentUser.rating,
      reviewsCount: currentUser.reviewsCount,
      verified: currentUser.verified,
      city: currentUser.city,
      country: currentUser.country,
    },
  });

  if (app.cloud) {
    void app.cloud.createRequest(newReq).then((ok) => {
      if (!ok) return;
      app.dialogs['postModalOverlay']?.close();
      (document.getElementById('postRequestForm') as HTMLFormElement)?.reset();
      app.setFormatPill('requests');
    });
    return;
  }

  app.requests.unshift(newReq);
  app.storage.saveRequests(app.requests);
  app.syncManager.broadcast('REQUEST_CREATED', newReq, currentUser.id);

  app.dialogs['postModalOverlay']?.close();
  (document.getElementById('postRequestForm') as HTMLFormElement)?.reset();

  app.showToast('🙋 Buyer request published!', 'success');
  app.filters.formatPill = 'requests';
  app.renderListings();
  app.updateTopBarStats();
  app.updateDashboardMetrics();
}
