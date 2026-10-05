import { CityLocation, CurrencyCode } from '../types';

export interface CountryGroup {
  country: string;
  countryCode: string;
  flag: string;
  defaultCurrency: CurrencyCode;
  cities: CityLocation[];
}

export const AFRICAN_LOCATIONS: CountryGroup[] = [
  {
    country: 'Nigeria',
    countryCode: 'NG',
    flag: '🇳🇬',
    defaultCurrency: 'NGN',
    cities: [
      {
        city: 'Lagos',
        country: 'Nigeria',
        countryCode: 'NG',
        currency: 'NGN',
        neighborhoods: ['Ikeja', 'Lekki', 'Yaba', 'Alaba', 'Victoria Island'],
        label: 'Lagos (Ikeja, Lekki, Yaba, Alaba)',
        lat: 6.5244,
        lng: 3.3792,
      },
      {
        city: 'Abuja',
        country: 'Nigeria',
        countryCode: 'NG',
        currency: 'NGN',
        neighborhoods: ['Wuse II', 'Maitama', 'Garki'],
        label: 'Abuja (Wuse II, Maitama, Garki)',
        lat: 9.0765,
        lng: 7.3986,
      },
      {
        city: 'Port Harcourt',
        country: 'Nigeria',
        countryCode: 'NG',
        currency: 'NGN',
        neighborhoods: ['GRA', 'Trans-Amadi'],
        label: 'Port Harcourt (GRA, Trans-Amadi)',
        lat: 4.8156,
        lng: 7.0498,
      },
      {
        city: 'Ibadan',
        country: 'Nigeria',
        countryCode: 'NG',
        currency: 'NGN',
        neighborhoods: ['Bodija', 'Dugbe'],
        label: 'Ibadan (Bodija, Dugbe)',
        lat: 7.3775,
        lng: 3.947,
      },
      {
        city: 'Kano',
        country: 'Nigeria',
        countryCode: 'NG',
        currency: 'NGN',
        neighborhoods: ['Sabon Gari', 'Fagge'],
        label: 'Kano (Sabon Gari, Fagge)',
        lat: 12.0022,
        lng: 8.592,
      },
    ],
  },
  {
    country: 'Kenya',
    countryCode: 'KE',
    flag: '🇰🇪',
    defaultCurrency: 'KES',
    cities: [
      {
        city: 'Nairobi',
        country: 'Kenya',
        countryCode: 'KE',
        currency: 'KES',
        neighborhoods: ['Westlands', 'Kilimani', 'CBD'],
        label: 'Nairobi (Westlands, Kilimani, CBD)',
        lat: -1.2921,
        lng: 36.8219,
      },
      {
        city: 'Mombasa',
        country: 'Kenya',
        countryCode: 'KE',
        currency: 'KES',
        neighborhoods: ['Nyali', 'Old Town'],
        label: 'Mombasa (Nyali, Old Town)',
        lat: -4.0435,
        lng: 39.6682,
      },
      {
        city: 'Kisumu',
        country: 'Kenya',
        countryCode: 'KE',
        currency: 'KES',
        neighborhoods: ['Milimani'],
        label: 'Kisumu (Milimani)',
        lat: -0.0917,
        lng: 34.768,
      },
    ],
  },
  {
    country: 'Ghana',
    countryCode: 'GH',
    flag: '🇬🇭',
    defaultCurrency: 'GHS',
    cities: [
      {
        city: 'Accra',
        country: 'Ghana',
        countryCode: 'GH',
        currency: 'GHS',
        neighborhoods: ['Osu', 'East Legon', 'Circle'],
        label: 'Accra (Osu, East Legon, Circle)',
        lat: 5.6037,
        lng: -0.187,
      },
      {
        city: 'Kumasi',
        country: 'Ghana',
        countryCode: 'GH',
        currency: 'GHS',
        neighborhoods: ['Adum', 'Bantama'],
        label: 'Kumasi (Adum, Bantama)',
        lat: 6.6885,
        lng: -1.6244,
      },
    ],
  },
  {
    country: 'South Africa',
    countryCode: 'ZA',
    flag: '🇿🇦',
    defaultCurrency: 'ZAR',
    cities: [
      {
        city: 'Johannesburg',
        country: 'South Africa',
        countryCode: 'ZA',
        currency: 'ZAR',
        neighborhoods: ['Sandton', 'Rosebank'],
        label: 'Johannesburg (Sandton, Rosebank)',
        lat: -26.2041,
        lng: 28.0473,
      },
      {
        city: 'Cape Town',
        country: 'South Africa',
        countryCode: 'ZA',
        currency: 'ZAR',
        neighborhoods: ['CBD', 'Camps Bay'],
        label: 'Cape Town (CBD, Camps Bay)',
        lat: -33.9249,
        lng: 18.4241,
      },
      {
        city: 'Durban',
        country: 'South Africa',
        countryCode: 'ZA',
        currency: 'ZAR',
        neighborhoods: ['Umhlanga'],
        label: 'Durban (Umhlanga)',
        lat: -29.8587,
        lng: 31.0218,
      },
    ],
  },
  {
    country: 'Rwanda',
    countryCode: 'RW',
    flag: '🇷🇼',
    defaultCurrency: 'RWF',
    cities: [
      {
        city: 'Kigali',
        country: 'Rwanda',
        countryCode: 'RW',
        currency: 'RWF',
        neighborhoods: ['Kiyovu', 'Kimihurura'],
        label: 'Kigali (Kiyovu, Kimihurura)',
        lat: -1.9441,
        lng: 30.0619,
      },
    ],
  },
  {
    country: 'Tanzania',
    countryCode: 'TZ',
    flag: '🇹🇿',
    defaultCurrency: 'TZS',
    cities: [
      {
        city: 'Dar es Salaam',
        country: 'Tanzania',
        countryCode: 'TZ',
        currency: 'TZS',
        neighborhoods: ['Kariakoo', 'Masaki'],
        label: 'Dar es Salaam (Kariakoo, Masaki)',
        lat: -6.7924,
        lng: 39.2083,
      },
    ],
  },
  {
    country: 'Uganda',
    countryCode: 'UG',
    flag: '🇺🇬',
    defaultCurrency: 'UGX',
    cities: [
      {
        city: 'Kampala',
        country: 'Uganda',
        countryCode: 'UG',
        currency: 'UGX',
        neighborhoods: ['Kololo', 'Nakasero'],
        label: 'Kampala (Kololo, Nakasero)',
        lat: 0.3476,
        lng: 32.5825,
      },
    ],
  },
  {
    country: 'Egypt',
    countryCode: 'EG',
    flag: '🇪🇬',
    defaultCurrency: 'EGP',
    cities: [
      {
        city: 'Cairo',
        country: 'Egypt',
        countryCode: 'EG',
        currency: 'EGP',
        neighborhoods: ['Maadi', 'Zamalek', 'New Cairo'],
        label: 'Cairo (Maadi, Zamalek, New Cairo)',
        lat: 30.0444,
        lng: 31.2357,
      },
    ],
  },
  {
    country: 'Pan-African Trade',
    countryCode: 'ALL',
    flag: '🌍',
    defaultCurrency: 'USD',
    cities: [
      {
        city: 'All Africa',
        country: 'All Africa',
        countryCode: 'ALL',
        currency: 'USD',
        neighborhoods: ['Cross-Border Hubs'],
        label: 'All Africa (Cross-Border Trade & Shipping)',
        lat: 0.0,
        lng: 25.0,
      },
    ],
  },
];

export const CITY_LOOKUP: Map<string, CityLocation> = new Map();
AFRICAN_LOCATIONS.forEach((group) => {
  group.cities.forEach((c) => {
    CITY_LOOKUP.set(c.city.toLowerCase(), c);
    CITY_LOOKUP.set(`${c.city.toLowerCase()}, ${c.country.toLowerCase()}`, c);
  });
});

export function findCity(cityName: string): CityLocation | undefined {
  if (!cityName) return undefined;
  return (
    CITY_LOOKUP.get(cityName.toLowerCase()) ||
    CITY_LOOKUP.get(
      cityName
        .toLowerCase()
        .trim()
        .replace(/,\s*[a-z\s]+$/i, '')
    )
  );
}

export function getCurrencyForCity(cityName: string): CurrencyCode {
  const loc = findCity(cityName);
  return loc ? loc.currency : 'NGN';
}

/**
 * Calculates Great-Circle distance between two coordinates in kilometers using Haversine formula.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Computes distance in kilometers between two African cities.
 */
export function getDistanceBetweenCitiesKm(city1Name: string, city2Name: string): number | null {
  const c1 = findCity(city1Name);
  const c2 = findCity(city2Name);
  if (!c1 || !c2) return null;
  if (c1.city === 'All Africa' || c2.city === 'All Africa') return 0;
  return haversineDistanceKm(c1.lat, c1.lng, c2.lat, c2.lng);
}
