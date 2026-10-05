import { Listing, BuyerRequest, EscrowOrder, CurrencyCode, ListingFormat } from './types';
import { AFRICAN_LOCATIONS, getCurrencyForCity } from './data/locations';
import { LocalStorageManager } from './data/storage';
import { formatMoney } from './money';
import { filterListings, sortListings, SortMode, ListingFilterCriteria } from './listings';

import { AccessibleDialog } from './ui/dialog';
import { BottomNav } from './ui/bottomNav';
import { initMemberNav } from './ui/memberNav';
import {
  ActivityData,
  ActivityTab,
  activityCounts,
  buildActivityView,
  renderActivityDrawer,
} from './ui/activityDrawer';
import { setupMobileSheetEnhancements } from './ui/bottomSheet';
import { ICONS } from './ui/icons';
import { DashboardManager } from './dashboards';
import { BuyerSubTab, SellerSubTab, AdminSubTab } from './dashboards/types';
import { AuthService } from './auth/authService';

import { processAndUploadImage } from './storage/imageUpload';
import { AppRouter } from './routing/router';
import { SyncChannelManager } from './data/syncChannel';
import { supabase } from './data/supabase';
import { CloudStore } from './data/cloudStore';
import { CloudController } from './cloud/cloudController';
import * as authUI from './app/authUI';
import * as detailView from './app/detailView';
import * as cards from './app/cards';
import * as trading from './app/trading';
import * as messaging from './app/messaging';
import { bindFilterControls, resetFilterControls, syncPricePrefix } from './app/filters';
import { escapeHtml } from './ui/html';
import type { ChatTarget } from './ui/chat';
import type { Message } from './types';
import * as posting from './app/posting';
import * as syncListener from './app/syncListener';
import * as converter from './app/converter';
import * as dashboards from './app/dashboards';
import * as supabaseConsole from './app/supabaseConsole';

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
  public messages: Message[] = [];
  public chatTarget: ChatTarget | null = null;
  public activeCurrency: CurrencyCode = 'NGN';
  public sortMode: SortMode = 'newest';
  public marketMode: 'all' | 'requests' | 'supply' = 'all';
  public activeCategory: string = 'all';
  public currentCity: string = 'All Africa';
  public currentListingDetail: Listing | null = null;
  public currentRequestDetail: BuyerRequest | null = null;
  public activeDashboardTab: string = 'overview';
  public activeDrawerTab: ActivityTab = 'orders';
  public watchlistIds: Set<string> = new Set();
  public myBidIds: Map<string, number> = new Map(); // listingId -> highestBidMinor

  public filters: ListingFilterCriteria = {
    city: 'All Africa',
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

  public contactOwner() {
    messaging.contactOwner(this);
  }

  public openChat(target: ChatTarget) {
    messaging.openChat(this, target);
  }

  public renderChat() {
    messaging.renderChat(this);
  }

  public sendChat(body: string) {
    messaging.sendChat(this, body);
  }

  public settleAuction(listingId: string) {
    trading.settleAuction(this, listingId);
  }

  public withdrawListing(listingId: string) {
    trading.withdrawListing(this, listingId);
  }

  public cancelRequest(requestId: string) {
    trading.cancelRequest(this, requestId);
  }

  /** Shown when a member arrives from a password-reset email. */
  public showPasswordRecovery() {
    this.openAuthModal();
    document
      .querySelectorAll<HTMLElement>('.auth-tab-panel')
      .forEach((p) => (p.style.display = 'none'));
    const panel = document.getElementById('authPanelRecovery');
    if (panel) panel.style.display = 'block';
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

  /** Puts the city and sort controls in step with the app's starting state. */
  public applyDefaultControls() {
    const city = document.getElementById('citySelector') as HTMLSelectElement | null;
    if (city) {
      if (![...city.options].some((o) => o.value === this.currentCity)) {
        city.add(new Option('All Africa', this.currentCity), 0);
      }
      city.value = this.currentCity;
    }
    const sort = document.getElementById('sortSelector') as HTMLSelectElement | null;
    if (sort) sort.value = this.sortMode;
  }

  public refreshMarketplaceUI() {
    if (this.isModalOpen('chatModalOverlay')) this.renderChat();
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

    this.loadWatchlist();
    this.populateLocationSelects();
    this.applyDefaultControls();
    this.initDashboardManager();
    this.initDialogs();
    this.initBottomNav();
    initMemberNav({
      saved: () => this.openDrawer('watchlist'),
      listings: () => this.openDrawer('my_listings'),
      bids: () => this.openDrawer('my_bids'),
      requests: () => this.openDrawer('my_requests'),
      orders: () => this.openDrawer('orders'),
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
  public populateLocationSelects() {
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

  public initDashboardManager() {
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

  public initDialogs() {
    const dialogConfigs = [
      { id: 'detailModalOverlay', closeBtn: '#closeDetailModalBtn' },
      { id: 'postModalOverlay', closeBtn: '#closePostModalBtn' },
      { id: 'drawerModalOverlay', closeBtn: '#closeDrawerBtn' },
      { id: 'chatModalOverlay', closeBtn: '#closeChatModalBtn' },
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
          // Runs for every way of closing, including Escape
          onClose:
            cfg.id === 'detailModalOverlay'
              ? () => {
                  AppRouter.clearDetailUrl();
                  this.currentListingDetail = null;
                  this.currentRequestDetail = null;
                }
              : undefined,
        });

        // Close button click
        el.querySelector(cfg.closeBtn)?.addEventListener('click', () => {
          this.dialogs[cfg.id].close();
        });

        // Backdrop click
        el.addEventListener('click', (e) => {
          if (e.target === el) {
            this.dialogs[cfg.id].close();
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

  public initBottomNav() {
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

  public bindEvents() {
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

    // Messages
    document
      .getElementById('btnContactSeller')
      ?.addEventListener('click', () => this.contactOwner());
    const chatInput = document.getElementById('chatInput') as HTMLInputElement | null;
    document.getElementById('chatForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!chatInput) return;
      this.sendChat(chatInput.value);
      chatInput.value = '';
    });
    document.querySelectorAll<HTMLElement>('.btn-chat-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (chatInput) chatInput.value = chip.dataset.template || '';
        chatInput?.focus();
      });
    });

    // Password recovery (live accounts only)
    document.getElementById('authForgotPasswordBtn')?.addEventListener('click', () => {
      const email = (document.getElementById('authEmailInput') as HTMLInputElement)?.value.trim();
      if (this.cloud) void this.cloud.requestPasswordReset(email);
      else this.showToast('Password reset is available on the live site', 'info');
    });
    document.getElementById('recoveryAuthForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('recoveryPasswordInput') as HTMLInputElement | null;
      if (this.cloud && input) void this.cloud.updatePassword(input.value);
      if (input) input.value = '';
    });

    // Footer shortcuts
    document.querySelectorAll<HTMLElement>('[data-footer-format]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.setFormatPill(link.dataset.footerFormat || 'all');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
    const footerAction = (id: string, run: () => void) =>
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        run();
      });
    footerAction('footerBidsLink', () => this.openDrawer('my_bids'));
    footerAction('footerRequestsLink', () => this.openDrawer('my_requests'));
    footerAction('footerConverterLink', () => this.openConverterModal());

    // Member activity drawer
    document
      .getElementById('viewWatchlistBtn')
      ?.addEventListener('click', () => this.openDrawer('watchlist'));
    document
      .getElementById('viewMyBidsBtn')
      ?.addEventListener('click', () => this.openDrawer('my_bids'));
    document
      .getElementById('viewMyRequestsBtn')
      ?.addEventListener('click', () => this.openDrawer('my_requests'));
    document.getElementById('footerWatchlistLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openDrawer('watchlist');
    });
    document.getElementById('detailWatchlistBtn')?.addEventListener('click', () => {
      if (this.currentListingDetail) this.toggleWatchlist(this.currentListingDetail.id);
    });

    // Visitor landing actions
    document.getElementById('guestHeroJoinBtn')?.addEventListener('click', () => {
      this.openAuthModal();
      document.getElementById('authTabRegister')?.click();
    });
    document
      .getElementById('guestHeroBrowseBtn')
      ?.addEventListener('click', () =>
        document.getElementById('listingsContainer')?.scrollIntoView({ behavior: 'smooth' })
      );

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

    ['postCity', 'reqCity'].forEach((id) =>
      document
        .getElementById(id)
        ?.addEventListener('change', () => posting.syncPostCurrencySymbols())
    );
    bindFilterControls(this);

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
      this.dashboardManager.renderBuyerDashboard(
        buyerBody,
        dashboards.buyerOrders(this),
        this.activeCurrency
      );
    }
    const sellerBody = document.getElementById('sellerDashboardBody');
    if (
      sellerBody &&
      document.getElementById('sellerDashboardModalOverlay')?.style.display !== 'none'
    ) {
      this.dashboardManager.renderSellerDashboard(
        sellerBody,
        dashboards.sellerListings(this),
        this.activeCurrency
      );
    }
    const adminBody = document.getElementById('adminDashboardBody');
    if (
      adminBody &&
      document.getElementById('adminDashboardModalOverlay')?.style.display !== 'none'
    ) {
      this.dashboardManager.renderAdminDashboard(adminBody, this.activeCurrency);
    }
  }

  public syncCurrencyUI() {
    const sel = document.getElementById('currencySelector') as HTMLSelectElement | null;
    if (sel && sel.value !== this.activeCurrency) {
      sel.value = this.activeCurrency;
    }
    posting.syncPostCurrencySymbols();
    syncPricePrefix(this);
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
    this.currentCity = 'All Africa';
    this.filters = {
      city: 'All Africa',
      category: 'all',
      formatPill: 'all',
      formatCheckboxes: ['auction', 'buy_now', 'service', 'free_barter'],
      fulfillmentCheckboxes: ['pickup', 'shipping', 'both'],
      minPriceMinor: null,
      maxPriceMinor: null,
      searchQuery: '',
      maxRadiusKm: null,
    };
    resetFilterControls();
    const cSel = document.getElementById('citySelector') as HTMLSelectElement | null;
    if (cSel) cSel.value = 'All Africa';
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

    // Withdrawn and closed listings stay out of the feed; their owners find them in activity
    const browsable = this.listings.filter((l) => l.status !== 'cancelled' && l.status !== 'ended');
    const filtered = filterListings(browsable, this.filters);
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

  public buildListingCardHtml(item: Listing): string {
    return cards.buildListingCardHtml(this, item);
  }

  public buildRequestCardHtml(req: BuyerRequest): string {
    return cards.buildRequestCardHtml(this, req);
  }

  public bindCardEvents(container: HTMLElement) {
    cards.bindCardEvents(this, container);
  }

  public openDetailModal(listingId: string) {
    detailView.openDetailModal(this, listingId);
  }

  public openRequestDetailModal(requestId: string) {
    detailView.openRequestDetailModal(this, requestId);
  }

  public renderDetailActionBox(item: Listing) {
    detailView.renderDetailActionBox(this, item);
  }

  public renderRequestActionBox(req: BuyerRequest) {
    detailView.renderRequestActionBox(this, req);
  }

  public renderBidHistory(item: Listing) {
    detailView.renderBidHistory(this, item);
  }

  public renderQuotesList(req: BuyerRequest) {
    detailView.renderQuotesList(this, req);
  }

  public placeBid(listingId: string, amountMinor: number) {
    trading.placeBid(this, listingId, amountMinor);
  }

  public submitQuote(requestId: string, amountMinor: number, timeline: string, message: string) {
    trading.submitQuote(this, requestId, amountMinor, timeline, message);
  }

  public acceptQuote(requestId: string, quoteId: string) {
    trading.acceptQuote(this, requestId, quoteId);
  }

  public createEscrowFromListing(item: Listing) {
    trading.createEscrowFromListing(this, item);
  }

  public openPostModal(mode: 'sell' | 'request' = 'sell') {
    posting.openPostModal(this, mode);
  }

  public switchPostTab(mode: 'sell' | 'request') {
    posting.switchPostTab(this, mode);
  }

  public updatePostFormatFields(format: ListingFormat) {
    posting.updatePostFormatFields(this, format);
  }

  public handleCreateListing() {
    posting.handleCreateListing(this);
  }

  public handleCreateRequest() {
    posting.handleCreateRequest(this);
  }

  public openBuyerDashboard(subTab: BuyerSubTab = 'orders') {
    dashboards.openBuyerDashboard(this, subTab);
  }

  public openSellerDashboard(subTab: SellerSubTab = 'analytics') {
    dashboards.openSellerDashboard(this, subTab);
  }

  public openAdminDashboard(subTab: AdminSubTab = 'analytics') {
    dashboards.openAdminDashboard(this, subTab);
  }

  public openDashboardsModal(tab: string = 'overview') {
    dashboards.openDashboardsModal(this, tab);
  }

  public switchDashboardTab(tab: string) {
    dashboards.switchDashboardTab(this, tab);
  }

  public renderEscrowOrders() {
    dashboards.renderEscrowOrders(this);
  }

  public verifyAndReleaseEscrow(orderId: string, otpInput: string) {
    trading.verifyAndReleaseEscrow(this, orderId, otpInput);
  }

  public async testSupabaseConnection() {
    await supabaseConsole.testSupabaseConnection(this);
  }

  public async syncWithSupabase() {
    await supabaseConsole.syncWithSupabase(this);
  }

  public downloadSchema() {
    supabaseConsole.downloadSchema(this);
  }

  public resetToSeedData() {
    supabaseConsole.resetToSeedData(this);
  }

  public openConverterModal() {
    converter.openConverterModal(this);
  }

  public updateConverterResults() {
    converter.updateConverterResults(this);
  }

  public openDrawer(tab: ActivityTab = 'orders') {
    if (this.cloud && !this.cloud.requireUser('see your activity')) return;
    this.activeDrawerTab = tab;
    this.renderDrawer();
    this.dialogs['drawerModalOverlay']?.open();
  }

  public activityData(): ActivityData {
    return {
      userId: this.authService.getCurrentUser().id,
      listings: this.listings,
      requests: this.requests,
      escrowOrders: this.escrowOrders,
      watchlistIds: this.watchlistIds,
      messages: this.messages,
    };
  }

  public renderDrawer() {
    const panel = document.getElementById('drawerPanel');
    if (!panel) return;
    renderActivityDrawer(panel, this.activeDrawerTab, this.activityData(), {
      onOpenListing: (id) => {
        this.closeModal('drawerModalOverlay');
        this.openDetailModal(id);
      },
      onOpenRequest: (id) => {
        this.closeModal('drawerModalOverlay');
        this.openRequestDetailModal(id);
      },
      onConfirmHandover: (orderId, code) => this.verifyAndReleaseEscrow(orderId, code),
      onSelectTab: (tab) => {
        this.activeDrawerTab = tab;
        this.renderDrawer();
      },
      onOpenConversation: (conversation) => {
        this.closeModal('drawerModalOverlay');
        this.openChat(conversation);
      },
    });
  }

  public updateActivityBadges() {
    const counts = activityCounts(buildActivityView(this.activityData()));
    const set = (id: string, n: number) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(n);
    };
    set('watchlistCountBadge', counts.watchlist);
    set('myBidsCountBadge', counts.my_bids);
    set('myRequestsCountBadge', counts.my_requests);
    if (this.isModalOpen('drawerModalOverlay')) this.renderDrawer();
  }

  public static readonly WATCHLIST_KEY = 'servilist_watchlist';

  public loadWatchlist() {
    try {
      const raw = localStorage.getItem(ServilistApp.WATCHLIST_KEY);
      this.watchlistIds = new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      this.watchlistIds = new Set();
    }
  }

  public toggleWatchlist(listingId: string) {
    const saved = !this.watchlistIds.has(listingId);
    if (saved) this.watchlistIds.add(listingId);
    else this.watchlistIds.delete(listingId);
    try {
      localStorage.setItem(ServilistApp.WATCHLIST_KEY, JSON.stringify([...this.watchlistIds]));
    } catch {
      // Storage unavailable; the list still works for this visit
    }
    this.syncWatchlistButton(listingId);
    this.updateActivityBadges();
    this.showToast(saved ? 'Saved to your watchlist' : 'Removed from your watchlist', 'info');
  }

  public syncWatchlistButton(listingId: string) {
    const label = document.querySelector('#detailWatchlistBtn .btn-text');
    if (label) {
      label.textContent = this.watchlistIds.has(listingId)
        ? 'Remove from Watchlist'
        : 'Add to Watchlist';
    }
  }

  public renderCategoryCounts() {
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

  public updateTopBarStats() {
    const activeStats = document.getElementById('activeStats');
    if (activeStats) {
      const activeListings = this.listings.filter((l) => !l.isSold).length;
      const liveAuctions = this.listings.filter((l) => l.format === 'auction' && !l.isSold).length;
      const buyerReqs = this.requests.length;
      activeStats.innerHTML = `<strong>${activeListings}</strong> Active Listings &bull; <strong>${liveAuctions}</strong> Live Auctions &bull; <strong>${buyerReqs}</strong> Buyer Requests`;
    }
    this.updateActivityBadges();
  }

  public updateDashboardMetrics() {
    dashboards.updateDashboardMetrics(this);
  }

  public startTimerTicker() {
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

  public initSyncListener() {
    syncListener.initSyncListener(this);
  }

  public checkUrlRoute() {
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

  public initAuthUI() {
    authUI.initAuthUI(this);
  }

  public renderTestUsersList() {
    authUI.renderTestUsersList(this);
  }

  public syncAuthUserUI() {
    authUI.syncAuthUserUI(this);
  }

  public escapeHtml(str: string): string {
    return escapeHtml(str);
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
