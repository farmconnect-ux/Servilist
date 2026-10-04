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
      },
      {
        city: 'Abuja',
        country: 'Nigeria',
        countryCode: 'NG',
        currency: 'NGN',
        neighborhoods: ['Wuse II', 'Maitama', 'Garki'],
        label: 'Abuja (Wuse II, Maitama, Garki)',
      },
      {
        city: 'Port Harcourt',
        country: 'Nigeria',
        countryCode: 'NG',
        currency: 'NGN',
        neighborhoods: ['GRA', 'Trans-Amadi'],
        label: 'Port Harcourt (GRA, Trans-Amadi)',
      },
      {
        city: 'Ibadan',
        country: 'Nigeria',
        countryCode: 'NG',
        currency: 'NGN',
        neighborhoods: ['Bodija', 'Dugbe'],
        label: 'Ibadan (Bodija, Dugbe)',
      },
      {
        city: 'Kano',
        country: 'Nigeria',
        countryCode: 'NG',
        currency: 'NGN',
        neighborhoods: ['Sabon Gari', 'Fagge'],
        label: 'Kano (Sabon Gari, Fagge)',
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
      },
      {
        city: 'Mombasa',
        country: 'Kenya',
        countryCode: 'KE',
        currency: 'KES',
        neighborhoods: ['Nyali', 'Old Town'],
        label: 'Mombasa (Nyali, Old Town)',
      },
      {
        city: 'Kisumu',
        country: 'Kenya',
        countryCode: 'KE',
        currency: 'KES',
        neighborhoods: ['Milimani'],
        label: 'Kisumu (Milimani)',
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
      },
      {
        city: 'Kumasi',
        country: 'Ghana',
        countryCode: 'GH',
        currency: 'GHS',
        neighborhoods: ['Adum', 'Bantama'],
        label: 'Kumasi (Adum, Bantama)',
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
      },
      {
        city: 'Cape Town',
        country: 'South Africa',
        countryCode: 'ZA',
        currency: 'ZAR',
        neighborhoods: ['CBD', 'Camps Bay'],
        label: 'Cape Town (CBD, Camps Bay)',
      },
      {
        city: 'Durban',
        country: 'South Africa',
        countryCode: 'ZA',
        currency: 'ZAR',
        neighborhoods: ['Umhlanga'],
        label: 'Durban (Umhlanga)',
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
