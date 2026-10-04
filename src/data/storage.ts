import { Listing, BuyerRequest, EscrowOrder, CurrencyCode } from '../types';
import { SEED_LISTINGS, SEED_REQUESTS } from './seeds';

const PREFIX = 'servilist_';

export class LocalStorageManager {
  constructor() {
    this.migrateLegacyKeys();
  }

  private migrateLegacyKeys() {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith('servlist_')) {
          const newKey = k.replace('servlist_', 'servilist_');
          if (!localStorage.getItem(newKey)) {
            const val = localStorage.getItem(k);
            if (val !== null) {
              localStorage.setItem(newKey, val);
            }
          }
        }
      }
    } catch {
      // storage quota or blocked
    }
  }

  public getListings(): Listing[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return JSON.parse(JSON.stringify(SEED_LISTINGS));
    }

    try {
      const raw = localStorage.getItem(`${PREFIX}listings`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // JSON parse error
    }

    const seeds = JSON.parse(JSON.stringify(SEED_LISTINGS));
    this.saveListings(seeds);
    return seeds;
  }

  public saveListings(listings: Listing[]) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(`${PREFIX}listings`, JSON.stringify(listings));
    } catch {
      // storage error
    }
  }

  public getRequests(): BuyerRequest[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return JSON.parse(JSON.stringify(SEED_REQUESTS));
    }

    try {
      const raw = localStorage.getItem(`${PREFIX}requests`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // JSON parse error
    }

    const seeds = JSON.parse(JSON.stringify(SEED_REQUESTS));
    this.saveRequests(seeds);
    return seeds;
  }

  public saveRequests(requests: BuyerRequest[]) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(`${PREFIX}requests`, JSON.stringify(requests));
    } catch {
      // storage error
    }
  }

  public getEscrowOrders(): EscrowOrder[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];

    try {
      const raw = localStorage.getItem(`${PREFIX}escrow_orders`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // JSON error
    }
    return [];
  }

  public saveEscrowOrders(orders: EscrowOrder[]) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(`${PREFIX}escrow_orders`, JSON.stringify(orders));
    } catch {
      // storage error
    }
  }

  public getActiveCurrency(): CurrencyCode {
    if (typeof window === 'undefined' || !window.localStorage) return 'NGN';
    try {
      const val = localStorage.getItem(`${PREFIX}currency`);
      if (val) return val as CurrencyCode;
    } catch {
      // ignore
    }
    return 'NGN';
  }

  public saveActiveCurrency(curr: CurrencyCode) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(`${PREFIX}currency`, curr);
    } catch {
      // ignore
    }
  }
}
