import { ICONS } from './icons';

export interface BottomNavCallbacks {
  onBrowse: () => void;
  onRequests: () => void;
  onPost: () => void;
  onBids: () => void;
  onDashboards: () => void;
}

export class BottomNav {
  private container: HTMLElement | null = null;
  private callbacks: BottomNavCallbacks;

  constructor(callbacks: BottomNavCallbacks) {
    this.callbacks = callbacks;
  }

  public render(parentElement: HTMLElement = document.body): HTMLElement {
    const existing = document.getElementById('servilistBottomNav');
    if (existing) {
      existing.remove();
    }

    const nav = document.createElement('nav');
    nav.id = 'servilistBottomNav';
    nav.className = 'phone-bottom-nav';
    nav.setAttribute('aria-label', 'Mobile Navigation Bar');

    nav.innerHTML = `
      <button type="button" class="bottom-nav-item active" id="bottomNavBrowse" aria-label="Browse Marketplace">
        <span class="nav-icon">${ICONS.search}</span>
        <span class="nav-label">Market</span>
      </button>
      <button type="button" class="bottom-nav-item" id="bottomNavRequests" aria-label="Buyer Requests and Wanted Goods">
        <span class="nav-icon">${ICONS.request}</span>
        <span class="nav-label">Requests</span>
      </button>
      <button type="button" class="bottom-nav-item bottom-nav-fab" id="bottomNavPost" aria-label="Post a Listing or Request">
        <div class="fab-circle">
          <span class="nav-icon">${ICONS.plus}</span>
        </div>
        <span class="nav-label">Post</span>
      </button>
      <button type="button" class="bottom-nav-item" id="bottomNavBids" aria-label="My Bids and Watchlist">
        <span class="nav-icon">${ICONS.hammer}</span>
        <span class="nav-label">My Bids</span>
      </button>
      <button type="button" class="bottom-nav-item" id="bottomNavDashboards" aria-label="Commerce Dashboards and Escrow Vault">
        <span class="nav-icon">${ICONS.shield}</span>
        <span class="nav-label">Escrow</span>
      </button>
    `;

    nav.querySelector('#bottomNavBrowse')?.addEventListener('click', () => {
      this.setActive('bottomNavBrowse');
      this.callbacks.onBrowse();
    });

    nav.querySelector('#bottomNavRequests')?.addEventListener('click', () => {
      this.setActive('bottomNavRequests');
      this.callbacks.onRequests();
    });

    nav.querySelector('#bottomNavPost')?.addEventListener('click', () => {
      this.callbacks.onPost();
    });

    nav.querySelector('#bottomNavBids')?.addEventListener('click', () => {
      this.setActive('bottomNavBids');
      this.callbacks.onBids();
    });

    nav.querySelector('#bottomNavDashboards')?.addEventListener('click', () => {
      this.callbacks.onDashboards();
    });

    parentElement.appendChild(nav);
    this.container = nav;
    return nav;
  }

  public setActive(activeId: string) {
    if (!this.container) return;
    this.container.querySelectorAll('.bottom-nav-item').forEach((btn) => {
      if (btn.id === activeId) {
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.classList.remove('active');
        btn.removeAttribute('aria-current');
      }
    });
  }
}
