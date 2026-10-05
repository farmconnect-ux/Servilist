import { Listing, CurrencyCode } from '../types';
import { convertMinor } from '../money';
import { getDistanceBetweenCitiesKm } from '../data/locations';

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
  /** Currency the price bounds were typed in; listings are converted to it. */
  priceCurrency?: CurrencyCode;
  searchQuery?: string;
  maxRadiusKm?: number | null;
  userCity?: string;
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
        // If radius filter is active from user city, let radius handle it, otherwise filter out
        if (!filters.maxRadiusKm) {
          return false;
        }
      }
    }

    // 2. Geographic Radius Filter (Haversine Distance)
    if (
      filters.maxRadiusKm &&
      filters.maxRadiusKm > 0 &&
      filters.userCity &&
      filters.userCity !== 'All Africa'
    ) {
      const distKm = getDistanceBetweenCitiesKm(filters.userCity, item.city);
      if (distKm !== null && distKm > filters.maxRadiusKm) {
        return false;
      }
    }

    // 3. Category filter
    if (filters.category && filters.category !== 'all') {
      if (item.category !== filters.category) {
        return false;
      }
    }

    // 4. Quick Format Pill filter
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

    // 5. Format Checkboxes filter
    if (filters.formatCheckboxes && filters.formatCheckboxes.length > 0) {
      if (!filters.formatCheckboxes.includes(item.format)) {
        return false;
      }
    }

    // 6. Fulfillment Checkboxes filter
    if (filters.fulfillmentCheckboxes && filters.fulfillmentCheckboxes.length > 0) {
      if (!filters.fulfillmentCheckboxes.includes(item.fulfillment)) {
        return false;
      }
    }

    // 7. Search Query filter (matches title, description, city, category, tags)
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.toLowerCase().trim();
      const inTitle = item.title.toLowerCase().includes(q);
      const inDesc = item.description.toLowerCase().includes(q);
      const inCity = item.city.toLowerCase().includes(q);
      const inCat = item.category.toLowerCase().includes(q);
      const inSeller = item.seller.name.toLowerCase().includes(q);
      const inTags = item.tags && item.tags.some((t) => t.toLowerCase().includes(q));

      if (!inTitle && !inDesc && !inCity && !inCat && !inSeller && !inTags) {
        return false;
      }
    }

    // 8. Price range filter (normalized to minor units)
    const comparablePrice = filters.priceCurrency
      ? convertMinor(item.amountMinor, item.currency, filters.priceCurrency)
      : item.amountMinor;

    if (filters.minPriceMinor !== null && filters.minPriceMinor !== undefined) {
      if (comparablePrice < filters.minPriceMinor) {
        return false;
      }
    }

    if (filters.maxPriceMinor !== null && filters.maxPriceMinor !== undefined) {
      if (comparablePrice > filters.maxPriceMinor) {
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
  rates?: Record<CurrencyCode, number>,
  referenceCity?: string
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
      return copy.sort((a, b) => {
        const ref = referenceCity || 'Lagos, Nigeria';
        const distA = getDistanceBetweenCitiesKm(ref, a.city) ?? 99999;
        const distB = getDistanceBetweenCitiesKm(ref, b.city) ?? 99999;
        return distA - distB;
      });

    default:
      return copy;
  }
}
