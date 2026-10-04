export interface RouteState {
  type: 'listing' | 'request' | null;
  id: string | null;
}

export interface ShareContentOptions {
  title: string;
  priceFormatted?: string;
  city: string;
  itemId: string;
  type: 'listing' | 'request';
  origin?: string;
}

export class AppRouter {
  public static parseRoute(searchString?: string): RouteState {
    const search =
      searchString !== undefined
        ? searchString
        : typeof window !== 'undefined'
          ? window.location.search
          : '';

    const params = new URLSearchParams(search);
    const listingId = params.get('listing');
    if (listingId) {
      return { type: 'listing', id: listingId };
    }

    const requestId = params.get('request');
    if (requestId) {
      return { type: 'request', id: requestId };
    }

    return { type: null, id: null };
  }

  public static setListingUrl(listingId: string): void {
    if (typeof window === 'undefined' || !window.history) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('request');
    url.searchParams.set('listing', listingId);
    window.history.pushState({ listingId }, '', url.toString());
  }

  public static setRequestUrl(requestId: string): void {
    if (typeof window === 'undefined' || !window.history) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('listing');
    url.searchParams.set('request', requestId);
    window.history.pushState({ requestId }, '', url.toString());
  }

  public static clearDetailUrl(): void {
    if (typeof window === 'undefined' || !window.history) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('listing');
    url.searchParams.delete('request');
    window.history.replaceState({}, '', url.pathname + (url.search || ''));
  }

  public static buildDirectUrl(
    itemId: string,
    type: 'listing' | 'request',
    origin?: string
  ): string {
    const baseOrigin =
      origin ||
      (typeof window !== 'undefined' ? window.location.origin : 'https://servilist.africa');
    return `${baseOrigin}/?${type}=${encodeURIComponent(itemId)}`;
  }

  public static generateWhatsAppShareUrl(options: ShareContentOptions): string {
    const directUrl = this.buildDirectUrl(options.itemId, options.type, options.origin);
    const priceText = options.priceFormatted ? ` [${options.priceFormatted}]` : '';
    const message = `Check out this ${options.type === 'listing' ? 'deal' : 'buyer request'} on Servilist Africa:\n"${options.title}"${priceText} in ${options.city}.\n\nView details: ${directUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  public static async copyLinkToClipboard(
    itemId: string,
    type: 'listing' | 'request'
  ): Promise<string> {
    const directUrl = this.buildDirectUrl(itemId, type);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(directUrl);
    }
    return directUrl;
  }
}
