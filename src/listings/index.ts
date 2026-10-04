import { Listing, CurrencyCode } from '../types';
import { convertMinor } from '../money';

export type SortMode =
  'ending_soon' | 'newest' | 'price_low' | 'price_high' | 'most_bids' | 'distance';

export interface ListingFilterCriteria {
  city?: string;
  category?: string;
  formatPill?: string;
  formatCheckboxes?: string[];
  fulfillmentCheckboxes?: string[];
  minPriceMinor?: number | null;
  maxPriceMinor?: number | null;
  searchQuery?: string;
}

/**
 * Pure filtering function for marketplace listings.
 */
export function filterListings(listings: Listing[], filters: ListingFilterCriteria): Listing[] {
  return listings.filter((item) => {
    // 1. City filter
    if (filters.city && filters.city !== 'All Africa') {
      const targetCity = filters.city.toLowerCase();
      const itemCity = (item.city || '').toLowerCase();
      if (!itemCity.includes(targetCity) && !targetCity.includes(itemCity)) {
        return false;
      }
    }

    // 2. Category filter
    if (filters.category && filters.category !== 'all') {
      if (item.category !== filters.category) {
        return false;
      }
    }

    // 3. Quick Format Pill filter
    if (filters.formatPill && filters.formatPill !== 'all') {
      if (filters.formatPill === 'local_only') {
        if (item.fulfillment !== 'pickup') return false;
      } else if (filters.formatPill === 'requests') {
        // Exclude regular listings if user clicked requests pill
        return false;
      } else if (item.format !== filters.formatPill) {
        return false;
      }
    }

    // 4. Detailed Format Checkboxes filter
    if (filters.formatCheckboxes && filters.formatCheckboxes.length > 0) {
      if (!filters.formatCheckboxes.includes(item.format)) {
        return false;
      }
    }

    // 5. Fulfillment Checkboxes filter
    if (filters.fulfillmentCheckboxes && filters.fulfillmentCheckboxes.length > 0) {
      const match = filters.fulfillmentCheckboxes.some(
        (f) => item.fulfillment === f || item.fulfillment === 'both'
      );
      if (!match) return false;
    }

    // 6. Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase().trim();
      const inTitle = item.title.toLowerCase().includes(query);
      const inDesc = (item.description || '').toLowerCase().includes(query);
      const inCity = (item.city || '').toLowerCase().includes(query);
      const inNeighborhood = (item.neighborhood || '').toLowerCase().includes(query);

      if (!inTitle && !inDesc && !inCity && !inNeighborhood) {
        return false;
      }
    }

    // 7. Price range filter (normalized to minor units)
    if (filters.minPriceMinor !== null && filters.minPriceMinor !== undefined) {
      if (item.amountMinor < filters.minPriceMinor) {
        return false;
      }
    }

    if (filters.maxPriceMinor !== null && filters.maxPriceMinor !== undefined) {
      if (item.amountMinor > filters.maxPriceMinor) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Pure sorting function for marketplace listings.
 */
export function sortListings(
  listings: Listing[],
  mode: SortMode,
  rates?: Record<CurrencyCode, number>
): Listing[] {
  const copy = [...listings];

  switch (mode) {
    case 'ending_soon':
      return copy.sort((a, b) => {
        // Prioritize active auctions with end times
        const aHasEnd = a.format === 'auction' && a.endTime ? a.endTime : Infinity;
        const bHasEnd = b.format === 'auction' && b.endTime ? b.endTime : Infinity;
        return aHasEnd - bHasEnd;
      });

    case 'newest':
      return copy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    case 'price_low':
      return copy.sort((a, b) => {
        const aNorm = convertMinor(a.amountMinor, a.currency, 'USD', rates);
        const bNorm = convertMinor(b.amountMinor, b.currency, 'USD', rates);
        return aNorm - bNorm;
      });

    case 'price_high':
      return copy.sort((a, b) => {
        const aNorm = convertMinor(a.amountMinor, a.currency, 'USD', rates);
        const bNorm = convertMinor(b.amountMinor, b.currency, 'USD', rates);
        return bNorm - aNorm;
      });

    case 'most_bids':
      return copy.sort((a, b) => (b.bidsCount || 0) - (a.bidsCount || 0));

    case 'distance':
      return copy.sort((a, b) => (a.city || '').localeCompare(b.city || ''));

    default:
      return copy;
  }
}
