import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthService } from '../auth/authService';
import { CloudStore, GUEST_USER } from '../data/cloudStore';
import type { BuyerRequest, EscrowOrder, Listing } from '../types';

/** The parts of the app the cloud layer reads and refreshes. */
export interface CloudHost {
  listings: Listing[];
  requests: BuyerRequest[];
  escrowOrders: EscrowOrder[];
  authService: AuthService;
  currentListingDetail: Listing | null;
  currentRequestDetail: BuyerRequest | null;
  showToast(message: string, type?: 'info' | 'success' | 'warning'): void;
  refreshMarketplaceUI(): void;
  openDetailModal(listingId: string): void;
  openRequestDetailModal(requestId: string): void;
  openBuyerDashboard(): void;
  openAuthModal(): void;
  closeModal(id: string): void;
  isModalOpen(id: string): boolean;
}

const LIVE_TABLES = ['listings', 'bids', 'buyer_requests', 'quotes'];

/**
 * Runs the marketplace against Supabase: real accounts, shared data and
 * server-side bids, quotes and escrow. Used only when the build has Supabase
 * settings; otherwise the app stays a local demo.
 */
export class CloudController {
  private userId: string | null = null;
  private reloadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly client: SupabaseClient,
    private readonly store: CloudStore,
    private readonly host: CloudHost
  ) {}

  async start(): Promise<void> {
    this.host.authService.setCurrentUser(GUEST_USER);
    this.hideDemoOnlyControls();

    const { data } = await this.client.auth.getSession();
    await this.applySession(data.session?.user ?? null);

    this.client.auth.onAuthStateChange((_event, session) => {
      // Supabase asks that no awaited calls run inside this callback
      setTimeout(() => {
        void this.applySession(session?.user ?? null).then(() => this.reload());
      }, 0);
    });

    await this.reload();
    this.subscribeToLiveChanges();
  }

  private hideDemoOnlyControls() {
    // Test identities, SMS sign-in (no SMS provider yet) and the sample-data admin hub
    ['authTabSwitch', 'authPanelSwitch', 'authTabPhone', 'openAdminDashBtn'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    document.getElementById('authTabEmail')?.click();

    const subtitle = document.getElementById('authModalSubtitle');
    if (subtitle) subtitle.textContent = 'Sign in or create your Servilist account';
    const passwordInput = document.getElementById('authPasswordInput') as HTMLInputElement | null;
    if (passwordInput) {
      passwordInput.required = true;
      passwordInput.placeholder = 'Your password';
    }
  }

  private async applySession(user: { id: string; email?: string } | null): Promise<void> {
    this.userId = user?.id ?? null;
    const profile = user ? await this.store.fetchProfile(user.id, user.email) : null;
    this.host.authService.setCurrentUser(profile ?? GUEST_USER);

    const signOutBtn = document.getElementById('authSignOutBtn');
    if (signOutBtn) signOutBtn.style.display = user ? '' : 'none';
  }

  async reload(): Promise<void> {
    try {
      const [listings, requests, escrowOrders] = await Promise.all([
        this.store.fetchListings(),
        this.store.fetchRequests(),
        this.userId ? this.store.fetchEscrowOrders() : Promise.resolve([]),
      ]);
      this.host.listings = listings;
      this.host.requests = requests;
      this.host.escrowOrders = escrowOrders;
      this.host.refreshMarketplaceUI();

      // Keep an open detail view in step with the fresh data
      const listingId = this.host.currentListingDetail?.id;
      const requestId = this.host.currentRequestDetail?.id;
      if (this.host.isModalOpen('detailModalOverlay')) {
        if (listingId && listings.some((l) => l.id === listingId)) {
          this.host.openDetailModal(listingId);
        } else if (requestId && requests.some((r) => r.id === requestId)) {
          this.host.openRequestDetailModal(requestId);
        }
      }
    } catch (err) {
      this.host.showToast(`Could not load the marketplace: ${this.message(err)}`, 'warning');
    }
  }

  private subscribeToLiveChanges() {
    const channel = this.client.channel('servilist-live');
    LIVE_TABLES.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        if (this.reloadTimer) clearTimeout(this.reloadTimer);
        this.reloadTimer = setTimeout(() => void this.reload(), 400);
      });
    });
    channel.subscribe();
  }

  /** Returns the signed-in member's id, or prompts for sign-in and returns null. */
  private requireUser(action: string): string | null {
    if (this.userId) return this.userId;
    this.host.showToast(`Sign in to ${action}`, 'info');
    this.host.openAuthModal();
    return null;
  }

  private message(err: unknown): string {
    return err instanceof Error ? err.message : 'Something went wrong';
  }

  private async run(task: () => Promise<void>, success: string): Promise<boolean> {
    try {
      await task();
      await this.reload();
      this.host.showToast(success, 'success');
      return true;
    } catch (err) {
      this.host.showToast(this.message(err), 'warning');
      return false;
    }
  }

  // -- Accounts ------------------------------------------------------------

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) {
      this.host.showToast(error.message, 'warning');
      return;
    }
    this.host.closeModal('authModalOverlay');
    this.host.showToast('Signed in', 'success');
  }

  async signUp(details: {
    name: string;
    email: string;
    password: string;
    city: string;
  }): Promise<void> {
    if (!details.email || details.password.length < 8) {
      this.host.showToast('Enter your email and a password of at least 8 characters', 'warning');
      return;
    }
    const { data, error } = await this.client.auth.signUp({
      email: details.email,
      password: details.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: details.name,
          city: details.city,
          country: details.city.split(',')[1]?.trim() || '',
        },
      },
    });
    if (error) {
      this.host.showToast(error.message, 'warning');
      return;
    }
    this.host.closeModal('authModalOverlay');
    this.host.showToast(
      data.session
        ? `Welcome to Servilist, ${details.name}!`
        : 'Check your email to confirm your account, then sign in',
      'success'
    );
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
    this.host.closeModal('authModalOverlay');
    this.host.showToast('Signed out', 'info');
  }

  /** Storage folder for the member's uploads, or null for guests. */
  uploadFolder(): string | null {
    return this.userId;
  }

  // -- Marketplace ---------------------------------------------------------

  async createListing(listing: Listing): Promise<boolean> {
    const uid = this.requireUser('post a listing');
    if (!uid) return false;
    return this.run(() => this.store.createListing(uid, listing), 'Listing published');
  }

  async createRequest(request: BuyerRequest): Promise<boolean> {
    const uid = this.requireUser('post a request');
    if (!uid) return false;
    return this.run(() => this.store.createRequest(uid, request), 'Buyer request published');
  }

  async placeBid(listingId: string, amountMinor: number): Promise<void> {
    if (!this.requireUser('place a bid')) return;
    await this.run(() => this.store.placeBid(listingId, amountMinor), 'Bid placed');
  }

  async submitQuote(
    request: BuyerRequest,
    amountMinor: number,
    timeline: string,
    message: string
  ): Promise<void> {
    const uid = this.requireUser('send a quote');
    if (!uid) return;
    await this.run(
      () =>
        this.store.submitQuote(uid, {
          requestId: request.id,
          currency: request.currency,
          amountMinor,
          timeline,
          message,
        }),
      'Quote sent to the buyer'
    );
  }

  async acceptQuote(request: BuyerRequest, quoteId: string): Promise<void> {
    if (!this.requireUser('accept a quote')) return;
    const ok = await this.run(
      () => this.store.acceptQuote(quoteId, `${request.city} Safe Commercial Zone`),
      'Quote accepted. Your order is open'
    );
    if (ok) this.showOrders();
  }

  async buyListing(listing: Listing): Promise<void> {
    if (!this.requireUser('buy')) return;
    const ok = await this.run(
      () => this.store.buyListing(listing.id, `${listing.city} Safe Meetup Zone`),
      'Order placed'
    );
    if (ok) this.showOrders();
  }

  private showOrders() {
    this.host.closeModal('detailModalOverlay');
    this.host.openBuyerDashboard();
  }

  async confirmHandover(order: EscrowOrder, otp: string): Promise<void> {
    if (!this.requireUser('release an order')) return;
    if (order.buyerId === this.userId) {
      this.host.showToast(
        'Read this code to the seller at handover. The seller enters it to complete the order.',
        'info'
      );
      return;
    }
    try {
      const released = await this.store.confirmHandover(order.id, otp);
      await this.reload();
      this.host.showToast(
        released ? 'Handover confirmed. Order released' : 'Incorrect handover code',
        released ? 'success' : 'warning'
      );
      if (released) this.host.openBuyerDashboard();
    } catch (err) {
      this.host.showToast(this.message(err), 'warning');
    }
  }
}
