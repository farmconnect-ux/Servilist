import { Listing, BuyerRequest, EscrowOrder, CurrencyCode, ListingFormat } from './types';
import { AFRICAN_LOCATIONS, getCurrencyForCity } from './data/locations';
import { LocalStorageManager } from './data/storage';
import { toMinorUnits, fromMinorUnits, convertMinor, formatMoney, CURRENCY_CONFIGS } from './money';
import { filterListings, sortListings, SortMode, ListingFilterCriteria } from './listings';
import { calculateMinimumNextBid, validateBid } from './auctions';
import { createBuyerRequest, createQuote } from './requests';
import { createEscrowOrder, transitionEscrow } from './escrow';
import { AccessibleDialog } from './ui/dialog';
import { BottomNav } from './ui/bottomNav';
import { initMemberNav } from './ui/memberNav';
import { setupMobileSheetEnhancements } from './ui/bottomSheet';
import { ICONS } from './ui/icons';
import { DashboardManager } from './dashboards';
import { BuyerSubTab, SellerSubTab, AdminSubTab } from './dashboards/types';
import { AuthService, TEST_USERS } from './auth/authService';
import { SEED_LISTINGS, SEED_REQUESTS } from './data/seeds';
import { PolicyEvaluator } from './auth/policies';
import { processAndUploadImage } from './storage/imageUpload';
import { AppRouter } from './routing/router';
import { SyncChannelManager } from './data/syncChannel';
import { supabase } from './data/supabase';
import { CloudStore } from './data/cloudStore';
import { CloudController } from './cloud/cloudController';

export class ServilistApp {
  public storage: LocalStorageManager;
  public authService: AuthService;
  public syncManager: SyncChannelManager;
  public dashboardManager!: DashboardManager;
  /** Set when the build is connected to Supabase; null means local demo mode. */
  public cloud: CloudController | null = null;
  public listings: Listing[] = [];
  public requests: BuyerRequest[] = [];
  public escrowOrders: EscrowOrder[] = [];
  public activeCurrency: CurrencyCode = 'NGN';
  public sortMode: SortMode = 'ending_soon';
  public marketMode: 'all' | 'requests' | 'supply' = 'all';
  public activeCategory: string = 'all';
  public currentCity: string = 'Lagos, Nigeria';
  public currentListingDetail: Listing | null = null;
  public currentRequestDetail: BuyerRequest | null = null;
  public activeDashboardTab: string = 'overview';
  public activeDrawerTab: string = 'watchlist';
  public watchlistIds: Set<string> = new Set();
  public myBidIds: Map<string, number> = new Map(); // listingId -> highestBidMinor

  public filters: ListingFilterCriteria = {
    city: 'Lagos, Nigeria',
    category: 'all',
    formatPill: 'all',
    formatCheckboxes: ['auction', 'buy_now', 'service', 'free_barter'],
    fulfillmentCheckboxes: ['pickup', 'shipping', 'both'],
    minPriceMinor: null,
    maxPriceMinor: null,
    searchQuery: '',
    maxRadiusKm: null,
  };

  // Accessible dialog controllers
  public dialogs: Record<string, AccessibleDialog> = {};
  public bottomNav!: BottomNav;

  constructor() {
    this.storage = new LocalStorageManager();
    this.authService = new AuthService();
    this.syncManager = new SyncChannelManager();
    if (supabase) {
      this.cloud = new CloudController(supabase, new CloudStore(supabase), this);
    }
  }

  public openAuthModal() {
    this.dialogs['authModalOverlay']?.open();
  }

  public closeModal(id: string) {
    this.dialogs[id]?.close();
  }

  public isModalOpen(id: string): boolean {
    return this.dialogs[id]?.isOpen() ?? false;
  }

  public refreshMarketplaceUI() {
    this.renderListings();
    this.renderCategoryCounts();
    this.updateTopBarStats();
    this.updateDashboardMetrics();
  }

  public init() {
    this.activeCurrency = this.storage.getActiveCurrency();
    // In cloud mode the database is the source of truth; no seeds, no local cache
    if (!this.cloud) {
      this.listings = this.storage.getListings();
      this.requests = this.storage.getRequests();
      this.escrowOrders = this.storage.getEscrowOrders();
    }

    this.populateLocationSelects();
    this.initDashboardManager();
    this.initDialogs();
    this.initBottomNav();
    initMemberNav({
      saved: () => this.openBuyerDashboard('wishlist'),
      listings: () => this.openSellerDashboard('inventory'),
      purchases: () => this.openBuyerDashboard('orders'),
      sales: () => this.openSellerDashboard('finance'),
      messages: () => this.openBuyerDashboard('communication'),
      account: () => document.getElementById('userProfilePill')?.click(),
    });
    this.bindEvents();
    this.syncCurrencyUI();
    this.initSyncListener();
    this.initAuthUI();
    this.renderCategoryCounts();
    this.renderListings();
    this.updateTopBarStats();
    this.updateDashboardMetrics();
    this.startTimerTicker();
    if (this.cloud) {
      void this.cloud.start().then(() => this.checkUrlRoute());
    } else {
      this.checkUrlRoute();
    }
  }

  /**
   * Single Source of Truth: populates all city selectors dynamically from AFRICAN_LOCATIONS
   * eliminating the 3 hardcoded copies across HTML and JS.
   */
  private populateLocationSelects() {
    const citySelector = document.getElementById('citySelector') as HTMLSelectElement | null;
    const postCity = document.getElementById('postCity') as HTMLSelectElement | null;
    const reqCity = document.getElementById('reqCity') as HTMLSelectElement | null;

    const buildOptionsHtml = (includeAllAfrica = true) => {
      return AFRICAN_LOCATIONS.map((group) => {
        if (!includeAllAfrica && group.countryCode === 'ALL') return '';
        const opts = group.cities
          .map(
            (c) =>
              `<option value="${c.city}, ${c.country}">${c.label || `${c.city}, ${c.country}`}</option>`
          )
          .join('\n');
        return `<optgroup label="${group.flag} ${group.country}">${opts}</optgroup>`;
      }).join('\n');
    };

    if (citySelector) {
      citySelector.innerHTML = buildOptionsHtml(true);
      citySelector.value = 'Lagos, Nigeria';
    }
    if (postCity) {
      postCity.innerHTML = buildOptionsHtml(false);
      postCity.value = 'Lagos, Nigeria';
    }
    if (reqCity) {
      reqCity.innerHTML = buildOptionsHtml(true);
      reqCity.value = 'Lagos, Nigeria';
    }
  }

  private initDashboardManager() {
    this.dashboardManager = new DashboardManager({
      onReleaseEscrowOtp: (orderId: string, otpInput: string) => {
        this.verifyAndReleaseEscrow(orderId, otpInput);
      },
      onOpenPostListing: () => {
        this.openPostModal('sell');
      },
      onOpenPostRequest: () => {
        this.openPostModal('request');
      },
      onTestSupabase: () => {
        this.testSupabaseConnection();
      },
      onSyncSupabase: () => {
        this.syncWithSupabase();
      },
      onDownloadSchema: () => {
        this.downloadSchema();
      },
      onResetSeedData: () => {
        this.resetToSeedData();
      },
      onClearConsole: () => {
        const c = document.getElementById('supaConsoleLogs');
        if (c) c.innerHTML = '';
      },
      onToast: (msg: string, type?: 'info' | 'success' | 'warning') => {
        this.showToast(msg, type);
      },
    });
  }

  private initDialogs() {
    const dialogConfigs = [
      { id: 'detailModalOverlay', closeBtn: '#closeDetailModalBtn' },
      { id: 'postModalOverlay', closeBtn: '#closePostModalBtn' },
      { id: 'drawerModalOverlay', closeBtn: '#closeDrawerBtn' },
      { id: 'chatModalOverlay', closeBtn: '#closeChatBtn' },
      { id: 'converterModalOverlay', closeBtn: '#closeConverterModalBtn' },
      { id: 'buyerDashboardModalOverlay', closeBtn: '#closeBuyerDashboardModalBtn' },
      { id: 'sellerDashboardModalOverlay', closeBtn: '#closeSellerDashboardModalBtn' },
      { id: 'adminDashboardModalOverlay', closeBtn: '#closeAdminDashboardModalBtn' },
      { id: 'dashboardsModalOverlay', closeBtn: '#closeDashboardModalBtn' },
      { id: 'authModalOverlay', closeBtn: '#closeAuthModalBtn' },
    ];

    dialogConfigs.forEach((cfg) => {
      const el = document.getElementById(cfg.id);
      if (el) {
        setupMobileSheetEnhancements(el);
        this.dialogs[cfg.id] = new AccessibleDialog(el, {
          closeBtnSelector: cfg.closeBtn,
        });

        // Close button click
        el.querySelector(cfg.closeBtn)?.addEventListener('click', () => {
          this.dialogs[cfg.id].close();
          if (cfg.id === 'detailModalOverlay') {
            AppRouter.clearDetailUrl();
            this.currentListingDetail = null;
            this.currentRequestDetail = null;
          }
        });

        // Backdrop click
        el.addEventListener('click', (e) => {
          if (e.target === el) {
            this.dialogs[cfg.id].close();
            if (cfg.id === 'detailModalOverlay') {
              AppRouter.clearDetailUrl();
              this.currentListingDetail = null;
              this.currentRequestDetail = null;
            }
          }
        });
      }
    });
  }

  public setFormatPill(format: string) {
    this.filters.formatPill = format;
    document.querySelectorAll('#formatPills .pill-btn').forEach((b) => {
      const btn = b as HTMLElement;
      if (btn.dataset.format === format) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    this.renderListings();
  }

  private initBottomNav() {
    this.bottomNav = new BottomNav({
      onBrowse: () => {
        this.setFormatPill('all');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onRequests: () => {
        this.setFormatPill('requests');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onPost: () => {
        this.openPostModal('sell');
      },
      onBids: () => {
        this.openDrawer('my_bids');
      },
      onDashboards: () => {
        this.openBuyerDashboard('orders');
      },
    });
    this.bottomNav.render();
  }

  private bindEvents() {
    // City Selector
    const citySelector = document.getElementById('citySelector') as HTMLSelectElement | null;
    citySelector?.addEventListener('change', () => {
      const val = citySelector.value;
      this.currentCity = val;
      this.filters.city = val;
      const suggestedCurrency = getCurrencyForCity(val);
      if (suggestedCurrency && suggestedCurrency !== this.activeCurrency) {
        this.setCurrency(suggestedCurrency);
      }
      this.renderListings();
      this.renderCategoryCounts();
    });

    // Currency Selector
    const currSelector = document.getElementById('currencySelector') as HTMLSelectElement | null;
    currSelector?.addEventListener('change', () => {
      this.setCurrency(currSelector.value as CurrencyCode);
    });

    // Sort Selector
    const sortSelector = document.getElementById('sortSelector') as HTMLSelectElement | null;
    sortSelector?.addEventListener('change', () => {
      this.sortMode = sortSelector.value as SortMode;
      this.renderListings();
    });

    // Grid / List toggle
    const viewGridBtn = document.getElementById('viewGridBtn');
    const viewListBtn = document.getElementById('viewListBtn');
    const container = document.getElementById('listingsContainer');

    viewGridBtn?.addEventListener('click', () => {
      viewGridBtn.classList.add('active');
      viewListBtn?.classList.remove('active');
      container?.classList.add('grid-mode');
      container?.classList.remove('list-mode');
    });

    viewListBtn?.addEventListener('click', () => {
      viewListBtn.classList.add('active');
      viewGridBtn?.classList.remove('active');
      container?.classList.add('list-mode');
      container?.classList.remove('grid-mode');
    });

    // Omnibar Search
    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
    const searchSubmitBtn = document.getElementById('searchSubmitBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    const handleSearch = () => {
      const val = searchInput?.value.trim() || '';
      this.filters.searchQuery = val;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = val ? 'block' : 'none';
      }
      this.renderListings();
    };

    searchSubmitBtn?.addEventListener('click', handleSearch);
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
    clearSearchBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      this.filters.searchQuery = '';
      this.renderListings();
    });

    // Reset Filters
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    resetFiltersBtn?.addEventListener('click', () => {
      this.resetFilters();
    });

    const logoReset = document.getElementById('logoReset');
    logoReset?.addEventListener('click', (e) => {
      e.preventDefault();
      this.resetFilters();
    });

    // Format Pills (Lead with Requests)
    document.querySelectorAll('#formatPills .pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const fmt = (btn as HTMLElement).dataset.format;
        if (fmt) {
          this.setFormatPill(fmt);
        }
      });
    });

    // Category sidebar
    document.querySelectorAll('.category-item').forEach((item) => {
      item.addEventListener('click', () => {
        const cat = (item as HTMLElement).dataset.cat;
        if (cat) {
          this.setCategory(cat);
        }
      });
    });

    // Post Listing & Request CTA
    document.getElementById('openPostModalBtn')?.addEventListener('click', () => {
      this.openPostModal('sell');
    });
    document.getElementById('openRequestModalBtn')?.addEventListener('click', () => {
      this.openPostModal('request');
    });

    // Currency Converter Modal CTA
    document.getElementById('openConverterBtn')?.addEventListener('click', () => {
      this.openConverterModal();
    });
    document.getElementById('pillConverterBtn')?.addEventListener('click', () => {
      this.openConverterModal();
    });

    // Separate Non-Unified Dashboards CTAs
    document.getElementById('openBuyerDashBtn')?.addEventListener('click', () => {
      this.openBuyerDashboard('orders');
    });
    document.getElementById('openSellerDashBtn')?.addEventListener('click', () => {
      this.openSellerDashboard('analytics');
    });
    document.getElementById('openAdminDashBtn')?.addEventListener('click', () => {
      this.openAdminDashboard('analytics');
    });

    // Fallback/Legacy Dashboards CTA
    document.getElementById('openDashboardsBtn')?.addEventListener('click', () => {
      this.openAdminDashboard('analytics');
    });
    document.getElementById('topDashboardsBtn')?.addEventListener('click', () => {
      this.openAdminDashboard('analytics');
    });

    // Post modal tab switcher
    const tabSell = document.getElementById('modalTabSell');
    const tabReq = document.getElementById('modalTabRequest');
    tabSell?.addEventListener('click', () => this.switchPostTab('sell'));
    tabReq?.addEventListener('click', () => this.switchPostTab('request'));

    // Post form format radio changes
    document.querySelectorAll("input[name='postFormat']").forEach((radio) => {
      radio.addEventListener('change', () => {
        const val = (radio as HTMLInputElement).value as ListingFormat;
        this.updatePostFormatFields(val);
      });
    });

    // Request form type radio changes
    document.querySelectorAll("input[name='requestType']").forEach((radio) => {
      radio.addEventListener('change', () => {
        const isService = (radio as HTMLInputElement).value === 'service';
        const rateGroup = document.getElementById('reqRateTypeGroup');
        if (rateGroup) {
          rateGroup.style.display = isService ? 'block' : 'none';
        }
      });
    });

    // Post Listing Form Submit
    const postForm = document.getElementById('postListingForm') as HTMLFormElement | null;
    postForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateListing();
    });

    // Post Request Form Submit
    const reqForm = document.getElementById('postRequestForm') as HTMLFormElement | null;
    reqForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateRequest();
    });

    // Dashboards Nav Buttons
    document.querySelectorAll('.dash-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.tab;
        if (tab) {
          this.switchDashboardTab(tab);
        }
      });
    });

    // Distance Radius Filter
    const radiusSelect = document.getElementById('radiusFilterSelect') as HTMLSelectElement | null;
    radiusSelect?.addEventListener('change', () => {
      const val = radiusSelect.value;
      this.filters.maxRadiusKm = val === 'any' ? null : parseInt(val, 10);
      this.renderListings();
    });

    // Photo Upload Picker for Listing (with 200x200 canvas thumbnail)
    const postChooseBtn = document.getElementById('postImageChooseBtn');
    const postFileInput = document.getElementById('postImageFileInput') as HTMLInputElement | null;
    const postUrlInput = document.getElementById('postImageUrl') as HTMLInputElement | null;
    const postThumbPreview = document.getElementById('postThumbnailPreview');
    const postThumbImg = document.getElementById('postThumbnailImg') as HTMLImageElement | null;

    postChooseBtn?.addEventListener('click', () => {
      postFileInput?.click();
    });

    postFileInput?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (postChooseBtn) postChooseBtn.textContent = '⏳ Processing photo...';
      try {
        const result = await processAndUploadImage(
          file,
          supabase ?? (window as any).supabase,
          this.cloud?.uploadFolder() ?? undefined
        );
        if (postUrlInput) postUrlInput.value = result.url;
        if (postThumbImg) postThumbImg.src = result.thumbnailUrl;
        if (postThumbPreview) postThumbPreview.style.display = 'flex';
        this.showToast('📷 Photo processed with 200x200 client thumbnail!', 'success');
      } catch (err: any) {
        this.showToast(err.message || 'Failed to process image file', 'warning');
      } finally {
        if (postChooseBtn) postChooseBtn.textContent = '📷 Choose Image File (Max 5MB)';
      }
    });

    // Photo Upload Picker for Request
    const reqChooseBtn = document.getElementById('reqImageChooseBtn');
    const reqFileInput = document.getElementById('reqImageFileInput') as HTMLInputElement | null;
    const reqUrlInput = document.getElementById('reqImageUrl') as HTMLInputElement | null;
    const reqThumbPreview = document.getElementById('reqThumbnailPreview');
    const reqThumbImg = document.getElementById('reqThumbnailImg') as HTMLImageElement | null;

    reqChooseBtn?.addEventListener('click', () => {
      reqFileInput?.click();
    });

    reqFileInput?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (reqChooseBtn) reqChooseBtn.textContent = '⏳ Processing photo...';
      try {
        const result = await processAndUploadImage(
          file,
          supabase ?? (window as any).supabase,
          this.cloud?.uploadFolder() ?? undefined
        );
        if (reqUrlInput) reqUrlInput.value = result.url;
        if (reqThumbImg) reqThumbImg.src = result.thumbnailUrl;
        if (reqThumbPreview) reqThumbPreview.style.display = 'flex';
        this.showToast('📷 Reference photo thumbnail generated!', 'success');
      } catch (err: any) {
        this.showToast(err.message || 'Failed to process image file', 'warning');
      } finally {
        if (reqChooseBtn) reqChooseBtn.textContent = '📷 Choose Reference Photo (Max 5MB)';
      }
    });

    // WhatsApp Share Button in Detail Modal
    const shareWhatsAppBtn = document.getElementById('detailShareWhatsAppBtn');
    shareWhatsAppBtn?.addEventListener('click', () => {
      if (this.currentListingDetail) {
        const item = this.currentListingDetail;
        const formatted = formatMoney(item.amountMinor, item.currency);
        const url = AppRouter.generateWhatsAppShareUrl({
          title: item.title,
          priceFormatted: formatted,
          city: item.city,
          itemId: item.id,
          type: 'listing',
        });
        window.open(url, '_blank');
      } else if (this.currentRequestDetail) {
        const req = this.currentRequestDetail;
        const formatted = formatMoney(req.budgetAmountMinor, req.currency);
        const url = AppRouter.generateWhatsAppShareUrl({
          title: req.title,
          priceFormatted: formatted,
          city: req.city,
          itemId: req.id,
          type: 'request',
        });
        window.open(url, '_blank');
      }
    });

    // Copy Link Button in Detail Modal
    const shareBtn = document.getElementById('detailShareBtn');
    shareBtn?.addEventListener('click', async () => {
      const itemId = this.currentListingDetail?.id || this.currentRequestDetail?.id;
      const itemType = this.currentListingDetail ? 'listing' : 'request';
      if (itemId) {
        await AppRouter.copyLinkToClipboard(itemId, itemType);
        this.showToast('🔗 Direct link copied to clipboard!', 'success');
      }
    });
  }

  public setCurrency(curr: CurrencyCode) {
    this.activeCurrency = curr;
    this.storage.saveActiveCurrency(curr);
    this.syncCurrencyUI();
    this.renderListings();
    this.updateTopBarStats();
    this.updateDashboardMetrics();
    if (this.currentListingDetail) {
      this.renderDetailActionBox(this.currentListingDetail);
    }
    const buyerBody = document.getElementById('buyerDashboardBody');
    if (
      buyerBody &&
      document.getElementById('buyerDashboardModalOverlay')?.style.display !== 'none'
    ) {
      this.dashboardManager.renderBuyerDashboard(buyerBody, this.escrowOrders, this.activeCurrency);
    }
    const sellerBody = document.getElementById('sellerDashboardBody');
    if (
      sellerBody &&
      document.getElementById('sellerDashboardModalOverlay')?.style.display !== 'none'
    ) {
      this.dashboardManager.renderSellerDashboard(sellerBody, this.listings, this.activeCurrency);
    }
    const adminBody = document.getElementById('adminDashboardBody');
    if (
      adminBody &&
      document.getElementById('adminDashboardModalOverlay')?.style.display !== 'none'
    ) {
      this.dashboardManager.renderAdminDashboard(adminBody, this.activeCurrency);
    }
  }

  private syncCurrencyUI() {
    const sel = document.getElementById('currencySelector') as HTMLSelectElement | null;
    if (sel && sel.value !== this.activeCurrency) {
      sel.value = this.activeCurrency;
    }
    const sym = CURRENCY_CONFIGS[this.activeCurrency]?.symbol.trim() || '₦';
    const startSym = document.getElementById('postStartPriceSym');
    const resSym = document.getElementById('postReservePriceSym');
    const reqSym = document.getElementById('reqBudgetSym');
    if (startSym) startSym.textContent = sym;
    if (resSym) resSym.textContent = sym;
    if (reqSym) reqSym.textContent = sym;
  }

  public setCategory(cat: string) {
    this.filters.category = cat;
    document.querySelectorAll('.category-item').forEach((item) => {
      if ((item as HTMLElement).dataset.cat === cat) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    this.renderListings();
  }

  public resetFilters() {
    this.filters = {
      city: 'Lagos, Nigeria',
      category: 'all',
      formatPill: 'all',
      formatCheckboxes: ['auction', 'buy_now', 'service', 'free_barter'],
      fulfillmentCheckboxes: ['pickup', 'shipping', 'both'],
      minPriceMinor: null,
      maxPriceMinor: null,
      searchQuery: '',
    };
    const cSel = document.getElementById('citySelector') as HTMLSelectElement | null;
    if (cSel) cSel.value = 'Lagos, Nigeria';
    const sInp = document.getElementById('searchInput') as HTMLInputElement | null;
    if (sInp) sInp.value = '';
    const clr = document.getElementById('clearSearchBtn');
    if (clr) clr.style.display = 'none';
    document
      .querySelectorAll('#formatPills .pill-btn')
      .forEach((b) => b.classList.remove('active'));
    document.querySelector('#formatPills .pill-btn[data-format="all"]')?.classList.add('active');
    document.querySelectorAll('.category-item').forEach((b) => b.classList.remove('active'));
    document.querySelector('.category-item[data-cat="all"]')?.classList.add('active');

    this.renderListings();
    this.renderCategoryCounts();
  }

  public renderListings() {
    const container = document.getElementById('listingsContainer');
    const countText = document.getElementById('resultsCountText');
    if (!container) return;

    // If filtering by requests pill or requests mode:
    if (this.filters.formatPill === 'requests') {
      const filteredReqs = this.requests.filter((r) => {
        if (this.filters.category !== 'all' && r.category !== this.filters.category) return false;
        if (this.filters.searchQuery) {
          const q = this.filters.searchQuery.toLowerCase();
          return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
        }
        return true;
      });

      if (countText) countText.textContent = `Showing ${filteredReqs.length} buyer requests`;

      if (filteredReqs.length === 0) {
        container.innerHTML = `
          <div class="empty-state-card">
            <h3>No buyer requests found</h3>
            <p>Be the first to post a request for items or services you need!</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filteredReqs.map((req) => this.buildRequestCardHtml(req)).join('');
      this.bindCardEvents(container);
      return;
    }

    const filtered = filterListings(this.listings, this.filters);
    const sorted = sortListings(filtered, this.sortMode);

    if (countText) countText.textContent = `Showing ${sorted.length} items`;

    if (sorted.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="text-align: center; padding: 48px 20px; grid-column: 1 / -1;">
          <span style="font-size: 2.5rem;">🌍</span>
          <h3 style="margin: 12px 0 6px;">No listings match your criteria</h3>
          <p style="color: #64748b; max-width: 460px; margin: 0 auto 16px;">Try resetting filters or be the first to list items and services in ${this.escapeHtml(this.currentCity)}!</p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button type="button" class="btn-primary" id="emptyStatePostBtn">Post a Listing</button>
            ${this.cloud ? '' : '<button type="button" class="btn-secondary" id="emptyStateSeedBtn">Load Sample African Listings</button>'}
          </div>
        </div>
      `;
      document.getElementById('emptyStatePostBtn')?.addEventListener('click', () => {
        this.openPostModal('sell');
      });
      document.getElementById('emptyStateSeedBtn')?.addEventListener('click', () => {
        this.storage.seedDemoData();
        this.listings = this.storage.getListings();
        this.requests = this.storage.getRequests();
        this.renderListings();
        this.renderCategoryCounts();
        this.updateTopBarStats();
        this.showToast('Demo African listings and requests loaded!', 'success');
      });
      return;
    }

    container.innerHTML = sorted.map((item) => this.buildListingCardHtml(item)).join('');
    this.bindCardEvents(container);
  }

  private buildListingCardHtml(item: Listing): string {
    const isSold = item.isSold || item.status === 'sold';
    const isEnded = Boolean(item.endTime && item.endTime <= Date.now());
    const formattedPrice = formatMoney(item.amountMinor, item.currency, {
      showSecondary: true,
      targetCurrency: this.activeCurrency,
    });

    return `
      <article class="listing-card ${isSold ? 'card-sold' : ''} ${isEnded ? 'card-ended' : ''}" data-id="${item.id}">
        <div class="card-image-wrap">
          <img src="${item.imageUrl}" alt="${this.escapeHtml(item.title)}" loading="lazy" decoding="async">
          <span class="card-badge badge-${item.format}">${item.format.toUpperCase()}</span>
          ${isSold ? '<span class="sold-banner">SOLD</span>' : isEnded ? '<span class="ended-banner">ENDED</span>' : ''}
        </div>
        <div class="card-content">
          <div class="card-meta">
            <span class="card-location">${ICONS.location} ${this.escapeHtml(item.city)}</span>
            <span class="card-category">${item.category}</span>
          </div>
          <h3 class="card-title">${this.escapeHtml(item.title)}</h3>
          <div class="card-price-row">
            <div>
              <span class="price-label">${item.format === 'auction' ? 'Current Bid' : 'Price'}</span>
              <div class="price-value">${formattedPrice}</div>
            </div>
            ${item.format === 'auction' ? `<div class="card-bids-count">${item.bidsCount} bids</div>` : ''}
          </div>
          <div class="card-footer">
            <span class="seller-name">${this.escapeHtml(item.seller.name)}</span>
            <span class="verified-tag">${item.seller.verified ? '✓ Verified' : ''}</span>
          </div>
        </div>
      </article>
    `;
  }

  private buildRequestCardHtml(req: BuyerRequest): string {
    const budgetFormatted = formatMoney(req.budgetAmountMinor, req.currency, {
      showSecondary: true,
      targetCurrency: this.activeCurrency,
    });

    return `
      <article class="listing-card card-request" data-req-id="${req.id}">
        <div class="card-image-wrap">
          <img src="${req.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'}" alt="${this.escapeHtml(req.title)}" loading="lazy" decoding="async">
          <span class="card-badge badge-request">REQUEST (${req.requestType.toUpperCase()})</span>
        </div>
        <div class="card-content">
          <div class="card-meta">
            <span class="card-location">${ICONS.location} ${this.escapeHtml(req.city)}</span>
            <span class="card-urgency">⏱️ ${this.escapeHtml(req.urgency)}</span>
          </div>
          <h3 class="card-title">${this.escapeHtml(req.title)}</h3>
          <div class="card-price-row">
            <div>
              <span class="price-label">Target Budget</span>
              <div class="price-value">${budgetFormatted}</div>
            </div>
            <div class="card-offers-count">${req.offers?.length || 0} quotes</div>
          </div>
          <div class="card-footer">
            <span class="buyer-name">${this.escapeHtml(req.buyer.name)}</span>
            <span class="action-hint">Submit Quote &rarr;</span>
          </div>
        </div>
      </article>
    `;
  }

  private bindCardEvents(container: HTMLElement) {
    container.querySelectorAll('.listing-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = (card as HTMLElement).dataset.id;
        const reqId = (card as HTMLElement).dataset.reqId;
        if (id) {
          this.openDetailModal(id);
        } else if (reqId) {
          this.openRequestDetailModal(reqId);
        }
      });
    });
  }

  public openDetailModal(listingId: string) {
    const item = this.listings.find((l) => l.id === listingId);
    if (!item) return;

    this.currentListingDetail = item;
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

    this.renderDetailActionBox(item);
    this.renderBidHistory(item);

    AppRouter.setListingUrl(item.id);
    this.dialogs['detailModalOverlay']?.open();
  }

  public openRequestDetailModal(requestId: string) {
    const req = this.requests.find((r) => r.id === requestId);
    if (!req) return;

    this.currentRequestDetail = req;
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

    this.renderRequestActionBox(req);
    this.renderQuotesList(req);

    AppRouter.setRequestUrl(req.id);
    this.dialogs['detailModalOverlay']?.open();
  }

  private renderDetailActionBox(item: Listing) {
    const box = document.getElementById('detailActionBox');
    if (!box) return;

    const isSold = item.isSold || item.status === 'sold';
    const isEnded = item.endTime && item.endTime <= Date.now();
    const formattedPrice = formatMoney(item.amountMinor, item.currency, {
      showSecondary: true,
      targetCurrency: this.activeCurrency,
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
          this.placeBid(item.id, minorVal);
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
        this.createEscrowFromListing(item);
      });
    }
  }

  private renderRequestActionBox(req: BuyerRequest) {
    const box = document.getElementById('detailActionBox');
    if (!box) return;

    const formattedBudget = formatMoney(req.budgetAmountMinor, req.currency, {
      showSecondary: true,
      targetCurrency: this.activeCurrency,
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
            <span>⏱️ ${this.escapeHtml(req.urgency)}</span>
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
      const priceVal = parseFloat(
        (box.querySelector('#quotePriceInput') as HTMLInputElement).value
      );
      const timeline = (box.querySelector('#quoteTimelineInput') as HTMLInputElement).value;
      const message = (box.querySelector('#quoteMessageInput') as HTMLTextAreaElement).value;

      const minorPrice = toMinorUnits(priceVal, req.currency);
      this.submitQuote(req.id, minorPrice, timeline, message);
    });
  }

  private renderBidHistory(item: Listing) {
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
            <strong>${this.escapeHtml(b.bidderName)}</strong>
            <span class="bid-time">${b.timeFormatted || 'Just now'}</span>
          </div>
          <div class="bid-val">${formatMoney(b.amountMinor, b.currency)}</div>
        </div>
      `
      )
      .join('');
  }

  private renderQuotesList(req: BuyerRequest) {
    const list = document.getElementById('detailQuotesList');
    const sec = document.getElementById('detailQuotesSection');
    const count = document.getElementById('detailQuotesCount');
    if (!list || !sec) return;

    sec.style.display = 'block';
    const currentUser = this.authService.getCurrentUser();
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
        : `<div class="empty-hint">Quotes on this request are private between the requester and vendor. Use the form above to submit your proposal!</div>`;
      return;
    }

    list.innerHTML = visibleOffers
      .map(
        (off) => `
        <div class="quote-item-card">
          <div class="quote-item-head">
            <div>
              <strong>${this.escapeHtml(off.providerName)}</strong>
              <span class="rating">(${off.providerRating} ★)</span>
            </div>
            <div class="quote-price">${formatMoney(off.amountMinor, off.currency)}</div>
          </div>
          <div class="quote-body">
            <div><strong>Timeline:</strong> ${this.escapeHtml(off.timeline)}</div>
            <p>"${this.escapeHtml(off.message)}"</p>
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
        this.acceptQuote(reqId!, offId!);
      });
    });
  }

  public placeBid(listingId: string, amountMinor: number) {
    const item = this.listings.find((l) => l.id === listingId);
    if (!item) return;

    const validation = validateBid(item, amountMinor);
    if (!validation.valid) {
      this.showToast(validation.error || 'Invalid bid', 'warning');
      return;
    }
    if (this.cloud) {
      void this.cloud.placeBid(item.id, amountMinor);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const newBid = {
      id: `bid-${Date.now()}`,
      listingId: item.id,
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

    this.storage.saveListings(this.listings);
    this.syncManager.broadcast(
      'BID_PLACED',
      { listingId: item.id, bid: newBid, amountMinor },
      currentUser.id
    );
    this.renderListings();
    this.openDetailModal(item.id);

    this.showToast(
      `🎉 Highest Bid placed! You are currently winning at ${formatMoney(amountMinor, item.currency)}`,
      'success'
    );
  }

  public submitQuote(requestId: string, amountMinor: number, timeline: string, message: string) {
    const req = this.requests.find((r) => r.id === requestId);
    if (!req) return;
    if (this.cloud) {
      void this.cloud.submitQuote(req, amountMinor, timeline, message);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const newQuote = createQuote({
      requestId: req.id,
      providerName: currentUser.name,
      amountMinor,
      currency: req.currency,
      timeline,
      message,
    });
    (newQuote as any).providerId = currentUser.id;

    if (!req.offers) req.offers = [];
    req.offers.unshift(newQuote);

    this.storage.saveRequests(this.requests);
    this.syncManager.broadcast(
      'QUOTE_PLACED',
      { requestId: req.id, quote: newQuote },
      currentUser.id
    );
    this.renderListings();
    this.renderQuotesList(req);
    this.showToast(`🚀 Quote sent to buyer!`, 'success');
  }

  public acceptQuote(requestId: string, quoteId: string) {
    const req = this.requests.find((r) => r.id === requestId);
    const offer = req?.offers?.find((o) => o.id === quoteId);
    if (!req || !offer) return;
    if (this.cloud) {
      void this.cloud.acceptQuote(req, offer.id);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const order = createEscrowOrder({
      requestId: req.id,
      quoteId: offer.id,
      title: req.title,
      buyerName: currentUser.name,
      buyerId: currentUser.id,
      sellerName: offer.providerName,
      amountMinor: offer.amountMinor,
      currency: offer.currency,
      targetCurrency: this.activeCurrency,
      safeZone: `${req.city} Safe Commercial Zone`,
    });

    this.escrowOrders.unshift(order);
    offer.status = 'accepted';
    req.status = 'matched';

    this.storage.saveRequests(this.requests);
    this.storage.saveEscrowOrders(this.escrowOrders);

    this.dialogs['detailModalOverlay']?.close();
    this.showToast(`🎉 Offer accepted! Funds secured in Escrow!`, 'success');
    this.openBuyerDashboard('orders');
  }

  public createEscrowFromListing(item: Listing) {
    if (this.cloud) {
      void this.cloud.buyListing(item);
      return;
    }
    const currentUser = this.authService.getCurrentUser();
    const order = createEscrowOrder({
      listingId: item.id,
      title: item.title,
      buyerName: currentUser.name,
      buyerId: currentUser.id,
      sellerName: item.seller.name,
      sellerId: item.seller.id,
      amountMinor: item.amountMinor,
      currency: item.currency,
      targetCurrency: this.activeCurrency,
      safeZone: `${item.city} Safe Meetup Zone`,
    });

    item.isSold = true;
    item.status = 'sold';
    this.escrowOrders.unshift(order);

    this.storage.saveListings(this.listings);
    this.storage.saveEscrowOrders(this.escrowOrders);

    this.dialogs['detailModalOverlay']?.close();
    this.renderListings();
    this.showToast(`🎉 Order Placed! Payment secured in Escrow.`, 'success');
    this.openBuyerDashboard('orders');
  }

  public openPostModal(mode: 'sell' | 'request' = 'sell') {
    this.switchPostTab(mode);
    this.dialogs['postModalOverlay']?.open();
  }

  public switchPostTab(mode: 'sell' | 'request') {
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

  private updatePostFormatFields(format: ListingFormat) {
    const durGroup = document.getElementById('auctionDurationGroup');
    const resGroup = document.getElementById('reservePriceGroup');
    if (durGroup) durGroup.style.display = format === 'auction' ? 'block' : 'none';
    if (resGroup) resGroup.style.display = format === 'auction' ? 'block' : 'none';
  }

  private handleCreateListing() {
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
    const currentUser = this.authService.getCurrentUser();

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

    if (this.cloud) {
      void this.cloud.createListing(newListing).then((ok) => {
        if (!ok) return;
        this.dialogs['postModalOverlay']?.close();
        (document.getElementById('postListingForm') as HTMLFormElement)?.reset();
      });
      return;
    }

    this.listings.unshift(newListing);
    this.storage.saveListings(this.listings);
    this.syncManager.broadcast('LISTING_CREATED', newListing, currentUser.id);

    this.dialogs['postModalOverlay']?.close();
    (document.getElementById('postListingForm') as HTMLFormElement)?.reset();

    this.showToast('🚀 Listing published across African commerce hubs!', 'success');
    this.renderListings();
    this.renderCategoryCounts();
    this.updateTopBarStats();
    this.updateDashboardMetrics();
  }

  private handleCreateRequest() {
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
    const city =
      (document.getElementById('reqCity') as HTMLSelectElement)?.value || 'Lagos, Nigeria';
    const description = (
      document.getElementById('reqDescription') as HTMLTextAreaElement
    )?.value.trim();

    const currency = getCurrencyForCity(city);
    const budgetAmountMinor = toMinorUnits(budgetMajor, currency);
    const currentUser = this.authService.getCurrentUser();

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

    if (this.cloud) {
      void this.cloud.createRequest(newReq).then((ok) => {
        if (!ok) return;
        this.dialogs['postModalOverlay']?.close();
        (document.getElementById('postRequestForm') as HTMLFormElement)?.reset();
        this.setFormatPill('requests');
      });
      return;
    }

    this.requests.unshift(newReq);
    this.storage.saveRequests(this.requests);
    this.syncManager.broadcast('REQUEST_CREATED', newReq, currentUser.id);

    this.dialogs['postModalOverlay']?.close();
    (document.getElementById('postRequestForm') as HTMLFormElement)?.reset();

    this.showToast('🙋 Buyer request published!', 'success');
    this.filters.formatPill = 'requests';
    this.renderListings();
    this.updateTopBarStats();
    this.updateDashboardMetrics();
  }

  public openBuyerDashboard(subTab: BuyerSubTab = 'orders') {
    const body = document.getElementById('buyerDashboardBody');
    if (body) {
      this.dashboardManager.setBuyerSubTab(subTab);
      const currentUser = this.authService.getCurrentUser();
      const visibleOrders = this.escrowOrders.filter((order) =>
        PolicyEvaluator.canReadEscrowOrder(currentUser, order)
      );
      this.dashboardManager.renderBuyerDashboard(body, visibleOrders, this.activeCurrency);
    }
    this.dialogs['buyerDashboardModalOverlay']?.open();
  }

  public openSellerDashboard(subTab: SellerSubTab = 'analytics') {
    const body = document.getElementById('sellerDashboardBody');
    if (body) {
      this.dashboardManager.setSellerSubTab(subTab);
      this.dashboardManager.renderSellerDashboard(body, this.listings, this.activeCurrency);
    }
    this.dialogs['sellerDashboardModalOverlay']?.open();
  }

  public openAdminDashboard(subTab: AdminSubTab = 'analytics') {
    const body = document.getElementById('adminDashboardBody');
    if (body) {
      this.dashboardManager.setAdminSubTab(subTab);
      this.dashboardManager.renderAdminDashboard(body, this.activeCurrency);
    }
    this.dialogs['adminDashboardModalOverlay']?.open();
  }

  public openDashboardsModal(tab: string = 'overview') {
    if (tab === 'seller') {
      this.openSellerDashboard('analytics');
    } else if (tab === 'buyer' || tab === 'escrow') {
      this.openBuyerDashboard('orders');
    } else {
      this.openAdminDashboard('analytics');
    }
  }

  public switchDashboardTab(tab: string) {
    if (tab === 'seller') {
      this.openSellerDashboard('analytics');
    } else if (tab === 'buyer' || tab === 'escrow') {
      this.openBuyerDashboard('orders');
    } else {
      this.openAdminDashboard('analytics');
    }
  }

  public renderEscrowOrders() {
    const body = document.getElementById('buyerDashboardBody');
    if (body) {
      this.dashboardManager.renderBuyerDashboard(body, this.escrowOrders, this.activeCurrency);
    }
  }

  public verifyAndReleaseEscrow(orderId: string, otpInput: string) {
    const order = this.escrowOrders.find((o) => o.id === orderId);
    if (!order) {
      this.showToast('Escrow order not found', 'warning');
      return;
    }
    if (this.cloud) {
      void this.cloud.confirmHandover(order, otpInput.trim());
      return;
    }
    const res = transitionEscrow(order, 'otp_verified', { otpAttempt: otpInput.trim() });
    if (res.success && res.order) {
      const released = transitionEscrow(res.order, 'released');
      if (released.success && released.order) {
        const idx = this.escrowOrders.findIndex((o) => o.id === orderId);
        if (idx !== -1) this.escrowOrders[idx] = released.order;
        this.storage.saveEscrowOrders(this.escrowOrders);
        this.showToast('🎉 Escrow payout released!', 'success');
        this.updateDashboardMetrics();
        const buyerBody = document.getElementById('buyerDashboardBody');
        if (buyerBody) {
          this.dashboardManager.renderBuyerDashboard(
            buyerBody,
            this.escrowOrders,
            this.activeCurrency
          );
        }
      }
    } else {
      this.showToast(res.error || 'Incorrect OTP code', 'warning');
    }
  }

  public async testSupabaseConnection() {
    const supa = (window as any).servilistSupabase || (window as any).servlistSupabase;
    if (supa && typeof supa.testConnection === 'function') {
      const res = await supa.testConnection();
      if (res?.success) {
        this.showToast('🟢 Supabase cloud ping successful!', 'success');
      } else {
        this.showToast('Supabase ping failed: ' + (res?.error || 'Backend unavailable'), 'info');
      }
    } else {
      this.showToast('Supabase client not loaded', 'warning');
    }
  }

  public async syncWithSupabase() {
    const supa = (window as any).servilistSupabase || (window as any).servlistSupabase;
    if (supa && typeof supa.syncToCloud === 'function') {
      const res = await supa.syncToCloud({
        listings: this.listings,
        requests: this.requests,
        escrow: this.escrowOrders,
      });
      if (res?.success) {
        this.showToast('🎉 All local data synced to Supabase!', 'success');
      } else {
        this.showToast('Saved locally. Backend Supabase sync is unavailable.', 'info');
      }
    } else {
      this.showToast('Saved locally. Backend Supabase sync is unavailable.', 'info');
    }
  }

  public downloadSchema() {
    window.open('supabase_schema.sql', '_blank');
    this.showToast('Opening supabase_schema.sql', 'info');
  }

  public resetToSeedData() {
    if (this.cloud) return;
    if (confirm('Reset marketplace to authentic African seed listings & requests?')) {
      this.listings = JSON.parse(JSON.stringify(SEED_LISTINGS));
      this.requests = JSON.parse(JSON.stringify(SEED_REQUESTS));
      this.storage.saveListings(this.listings);
      this.storage.saveRequests(this.requests);
      this.renderListings();
      this.renderCategoryCounts();
      this.updateTopBarStats();
      this.updateDashboardMetrics();
      this.showToast('African marketplace seed data restored', 'success');
    }
  }

  public openConverterModal() {
    this.dialogs['converterModalOverlay']?.open();
    this.updateConverterResults();
  }

  private updateConverterResults() {
    const input = document.getElementById('calcAmountInput') as HTMLInputElement | null;
    const fromSel = document.getElementById('calcFromCurrency') as HTMLSelectElement | null;
    const toSel = document.getElementById('calcToCurrency') as HTMLSelectElement | null;
    const display = document.getElementById('convMainResultDisplay');
    const breakdown = document.getElementById('convRateBreakdown');

    if (!input || !fromSel || !toSel || !display) return;

    const amount = parseFloat(input.value) || 0;
    const fromCurr = fromSel.value as CurrencyCode;
    const toCurr = toSel.value as CurrencyCode;

    const fromMinor = toMinorUnits(amount, fromCurr);
    const convertedMinor = convertMinor(fromMinor, fromCurr, toCurr);
    display.textContent = formatMoney(convertedMinor, toCurr);

    if (breakdown) {
      const oneFromInTo = convertMinor(toMinorUnits(1, fromCurr), fromCurr, toCurr);
      breakdown.textContent = `1 ${fromCurr} = ${fromMinorUnits(oneFromInTo, toCurr).toFixed(4)} ${toCurr}`;
    }
  }

  public openDrawer(tab: string = 'watchlist') {
    this.activeDrawerTab = tab;
    this.dialogs['drawerModalOverlay']?.open();
  }

  private renderCategoryCounts() {
    const counts: Record<string, number> = {
      electronics: 0,
      solar: 0,
      services: 0,
      collectibles: 0,
      vehicles: 0,
      housing: 0,
      home: 0,
      agriculture: 0,
      community: 0,
    };

    this.listings.forEach((l) => {
      if (counts[l.category] !== undefined) counts[l.category]++;
    });

    Object.entries(counts).forEach(([cat, count]) => {
      const cap = cat.charAt(0).toUpperCase() + cat.slice(1);
      const el = document.getElementById(`count${cap}`);
      if (el) el.textContent = String(count);
    });
  }

  private updateTopBarStats() {
    const activeStats = document.getElementById('activeStats');
    if (activeStats) {
      const activeListings = this.listings.filter((l) => !l.isSold).length;
      const liveAuctions = this.listings.filter((l) => l.format === 'auction' && !l.isSold).length;
      const buyerReqs = this.requests.length;
      activeStats.innerHTML = `<strong>${activeListings}</strong> Active Listings &bull; <strong>${liveAuctions}</strong> Live Auctions &bull; <strong>${buyerReqs}</strong> Buyer Requests`;
    }
  }

  private updateDashboardMetrics() {
    const gmvEl = document.getElementById('dashMetricGMV');
    const aucEl = document.getElementById('dashMetricAuctions');
    const reqEl = document.getElementById('dashMetricRequests');
    const escEl = document.getElementById('dashMetricEscrow');

    if (aucEl)
      aucEl.textContent = String(this.listings.filter((l) => l.format === 'auction').length);
    if (reqEl) reqEl.textContent = String(this.requests.length);

    let totalGmvMinor = 0;
    this.listings.forEach((l) => {
      totalGmvMinor += convertMinor(l.amountMinor, l.currency, this.activeCurrency);
    });

    if (gmvEl) gmvEl.textContent = formatMoney(totalGmvMinor, this.activeCurrency);

    let totalEscrowMinor = 0;
    this.escrowOrders.forEach((o) => {
      totalEscrowMinor += convertMinor(o.amountMinor, o.currency, this.activeCurrency);
    });
    if (escEl) escEl.textContent = formatMoney(totalEscrowMinor, this.activeCurrency);
  }

  private startTimerTicker() {
    setInterval(() => {
      const clock = document.getElementById('modalTimerClock');
      if (clock && this.currentListingDetail && this.currentListingDetail.endTime) {
        const diff = this.currentListingDetail.endTime - Date.now();
        if (diff <= 0) {
          clock.textContent = 'Auction Ended';
        } else {
          const hours = Math.floor(diff / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          clock.textContent = `${hours}h ${mins}m ${secs}s`;
        }
      }
    }, 1000);
  }

  public showToast(message: string, type: 'info' | 'success' | 'warning' = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? ICONS.check : type === 'warning' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span><span>${this.escapeHtml(message)}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  private initSyncListener() {
    this.syncManager.subscribe((msg) => {
      if (msg.type === 'LISTING_CREATED' && msg.payload) {
        const newListing: Listing = msg.payload;
        if (!this.listings.some((l) => l.id === newListing.id)) {
          this.listings.unshift(newListing);
          this.storage.saveListings(this.listings);
          this.renderListings();
          this.renderCategoryCounts();
          this.updateTopBarStats();
          this.updateDashboardMetrics();
          this.showToast(`✨ Live update: New listing "${newListing.title}"`, 'info');
        }
      } else if (msg.type === 'REQUEST_CREATED' && msg.payload) {
        const newReq: BuyerRequest = msg.payload;
        if (!this.requests.some((r) => r.id === newReq.id)) {
          this.requests.unshift(newReq);
          this.storage.saveRequests(this.requests);
          this.renderListings();
          this.renderCategoryCounts();
          this.updateTopBarStats();
          this.updateDashboardMetrics();
          this.showToast(`✨ Live update: New request "${newReq.title}"`, 'info');
        }
      } else if (msg.type === 'BID_PLACED' && msg.payload) {
        const { listingId, bid, amountMinor } = msg.payload;
        const item = this.listings.find((l) => l.id === listingId);
        if (item) {
          item.amountMinor = amountMinor;
          item.bidsCount = (item.bidsCount || 0) + 1;
          if (!item.bidHistory) item.bidHistory = [];
          if (!item.bidHistory.some((b) => b.id === bid.id)) {
            item.bidHistory.unshift(bid);
          }
          this.storage.saveListings(this.listings);
          this.renderListings();
          if (this.currentListingDetail?.id === listingId) {
            this.openDetailModal(listingId);
          }
        }
      } else if (msg.type === 'QUOTE_PLACED' && msg.payload) {
        const { requestId, quote } = msg.payload;
        const req = this.requests.find((r) => r.id === requestId);
        if (req) {
          if (!req.offers) req.offers = [];
          if (!req.offers.some((o) => o.id === quote.id)) {
            req.offers.unshift(quote);
          }
          this.storage.saveRequests(this.requests);
          if (this.currentRequestDetail?.id === requestId) {
            this.openRequestDetailModal(requestId);
          }
        }
      }
    });

    if (!this.cloud && typeof window !== 'undefined' && (window as any).supabase) {
      this.syncManager.initSupabaseRealtime((window as any).supabase, (newListing) => {
        if (!this.listings.some((l) => l.id === newListing.id)) {
          this.listings.unshift(newListing);
          this.storage.saveListings(this.listings);
          this.renderListings();
          this.renderCategoryCounts();
          this.updateTopBarStats();
        }
      });
    }
  }

  private checkUrlRoute() {
    const route = AppRouter.parseRoute();
    if (route.type === 'listing' && route.id) {
      const match = this.listings.find((l) => l.id === route.id);
      if (match) {
        this.openDetailModal(match.id);
      }
    } else if (route.type === 'request' && route.id) {
      const match = this.requests.find((r) => r.id === route.id);
      if (match) {
        this.openRequestDetailModal(match.id);
      }
    }
  }

  private initAuthUI() {
    const userPill = document.getElementById('userProfilePill');
    const signOutBtn = document.getElementById('authSignOutBtn');
    const phoneForm = document.getElementById('phoneAuthForm') as HTMLFormElement | null;
    const emailForm = document.getElementById('emailAuthForm') as HTMLFormElement | null;
    const regForm = document.getElementById('registerAuthForm') as HTMLFormElement | null;

    userPill?.addEventListener('click', () => {
      this.dialogs['authModalOverlay']?.open();
      if (!this.cloud) this.renderTestUsersList();
    });

    // Auth Modal Tabs
    document.querySelectorAll('#authModalTabs .modal-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document
          .querySelectorAll('#authModalTabs .modal-tab-btn')
          .forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = (btn as HTMLElement).dataset.authTab;

        document
          .querySelectorAll('.auth-tab-panel')
          .forEach((p) => ((p as HTMLElement).style.display = 'none'));
        if (tab === 'switch') {
          const p = document.getElementById('authPanelSwitch');
          if (p) p.style.display = 'block';
          this.renderTestUsersList();
        } else if (tab === 'phone') {
          const p = document.getElementById('authPanelPhone');
          if (p) p.style.display = 'block';
        } else if (tab === 'email') {
          const p = document.getElementById('authPanelEmail');
          if (p) p.style.display = 'block';
        } else if (tab === 'register') {
          const p = document.getElementById('authPanelRegister');
          if (p) p.style.display = 'block';
        }
      });
    });

    phoneForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const code =
        (document.getElementById('authPhoneCountry') as HTMLSelectElement)?.value || '+234';
      const num = (document.getElementById('authPhoneNumber') as HTMLInputElement)?.value || '';
      const user = this.authService.signInWithPhone(`${code}${num}`);
      this.syncAuthUserUI();
      this.dialogs['authModalOverlay']?.close();
      this.showToast(`Signed in via mobile phone as ${user.name}`, 'success');
    });

    emailForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = (document.getElementById('authEmailInput') as HTMLInputElement)?.value || '';
      if (this.cloud) {
        const passwordInput = document.getElementById('authPasswordInput') as HTMLInputElement;
        void this.cloud.signIn(email.trim(), passwordInput?.value || '');
        if (passwordInput) passwordInput.value = '';
        return;
      }
      const user = this.authService.signInWithEmail(email);
      this.syncAuthUserUI();
      this.dialogs['authModalOverlay']?.close();
      this.showToast(`Signed in as ${user.name}`, 'success');
    });

    regForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('regFullName') as HTMLInputElement)?.value || '';
      const email = (document.getElementById('regEmail') as HTMLInputElement)?.value || '';
      const phone = (document.getElementById('regPhone') as HTMLInputElement)?.value || '';
      const city =
        (document.getElementById('regCity') as HTMLSelectElement)?.value || 'Lagos, Nigeria';
      if (this.cloud) {
        const passwordInput = document.getElementById('regPassword') as HTMLInputElement;
        void this.cloud.signUp({
          name: name.trim(),
          email: email.trim(),
          password: passwordInput?.value || '',
          city,
        });
        if (passwordInput) passwordInput.value = '';
        return;
      }
      const user = this.authService.signUp({ name, email, phone, city, country: 'Africa' });
      this.syncAuthUserUI();
      this.dialogs['authModalOverlay']?.close();
      this.showToast(`Welcome to Servilist Africa, ${user.name}!`, 'success');
    });

    signOutBtn?.addEventListener('click', () => {
      if (this.cloud) {
        void this.cloud.signOut();
        return;
      }
      this.authService.signOut();
      this.syncAuthUserUI();
      this.dialogs['authModalOverlay']?.close();
      this.showToast('Signed out to guest test profile', 'info');
    });

    this.authService.onAuthStateChange(() => {
      this.syncAuthUserUI();
    });

    this.syncAuthUserUI();
  }

  private renderTestUsersList() {
    const grid = document.getElementById('testUsersGrid');
    if (!grid) return;

    const current = this.authService.getCurrentUser();
    grid.innerHTML = TEST_USERS.map((u) => {
      const isActive = u.id === current.id;
      return `
        <div class="test-user-card ${isActive ? 'active-user' : ''}" data-user-id="${u.id}">
          <div class="test-user-avatar">${u.avatar}</div>
          <div class="test-user-info">
            <div class="test-user-name">${u.name} ${isActive ? '✓' : ''}</div>
            <div class="test-user-city">📍 ${u.city} &bull; ${u.role}</div>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.test-user-card').forEach((card) => {
      card.addEventListener('click', () => {
        const uid = (card as HTMLElement).dataset.userId;
        if (uid) {
          const user = this.authService.switchUser(uid);
          this.syncAuthUserUI();
          this.showToast(`Switched active profile to ${user.name} (${user.city})`, 'info');
          this.dialogs['authModalOverlay']?.close();
          this.renderListings();
        }
      });
    });
  }

  private syncAuthUserUI() {
    const user = this.authService.getCurrentUser();
    const avatar = document.getElementById('navUserAvatar');
    const name = document.getElementById('navUserName');
    if (avatar) avatar.textContent = user.avatar;
    if (name) {
      name.textContent = user.id === 'guest' ? 'Sign in' : `${user.name} (${user.rating} ★)`;
    }

    const modalAvatar = document.getElementById('authCurrentAvatar');
    const modalName = document.getElementById('authCurrentName');
    const modalDetails = document.getElementById('authCurrentDetails');
    const modalRole = document.getElementById('authCurrentRole');
    if (modalAvatar) modalAvatar.textContent = user.avatar;
    if (modalName) modalName.textContent = user.name;
    if (modalDetails) {
      modalDetails.textContent = `📍 ${user.city || 'Africa Hub'} • ${user.verified ? 'Verified Merchant' : 'Community Trader'} (${user.rating} ★)`;
    }
    if (modalRole) modalRole.textContent = `Role: ${user.role.toUpperCase()}`;
  }

  public escapeHtml(str: string): string {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Global initialization
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const app = new ServilistApp();
    app.init();
    (window as any).servilistApp = app;
    (window as any).servlistApp = app;
  });
}
