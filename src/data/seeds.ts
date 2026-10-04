import { Listing, BuyerRequest } from '../types';

export const SEED_LISTINGS: Listing[] = [
  {
    id: 'serv-101',
    title: 'Toyota Hilux 2021 Double Cabin 4WD Tokunbo',
    category: 'vehicles',
    format: 'auction',
    status: 'active',
    amountMinor: 2850000000, // 28,500,000 NGN
    currency: 'NGN',
    buyItNowAmountMinor: 3400000000, // 34,000,000 NGN
    reserveAmountMinor: 3000000000, // 30,000,000 NGN
    bidsCount: 14,
    endTime: Date.now() + 1000 * 60 * 60 * 18, // 18 hours remaining
    city: 'Lagos',
    country: 'Nigeria',
    neighborhood: 'Berger / Ikeja',
    fulfillment: 'pickup',
    imageUrl:
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    description:
      'Clean direct Belgium import, custom duty paid with complete papers. Perfect engine and AC.',
    seller: {
      id: 'usr-1',
      name: 'Chukwudi Motors',
      avatar: 'CM',
      rating: 4.9,
      reviewsCount: 38,
      verified: true,
      city: 'Lagos',
      country: 'Nigeria',
    },
    bidHistory: [
      {
        id: 'bid-1',
        listingId: 'serv-101',
        bidderName: 'Babajide F.',
        amountMinor: 2850000000,
        currency: 'NGN',
        createdAt: Date.now() - 3600000,
        timeFormatted: '1 hour ago',
      },
      {
        id: 'bid-2',
        listingId: 'serv-101',
        bidderName: 'Musa Garba',
        amountMinor: 2700000000,
        currency: 'NGN',
        createdAt: Date.now() - 7200000,
        timeFormatted: '2 hours ago',
      },
    ],
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'serv-102',
    title: '5kVA Hybrid Solar Inverter + 10kWh Lithium Battery Rack',
    category: 'solar',
    format: 'buy_now',
    status: 'active',
    amountMinor: 320000000, // 3,200,000 NGN
    currency: 'NGN',
    buyItNowAmountMinor: 320000000,
    bidsCount: 0,
    city: 'Lagos',
    country: 'Nigeria',
    neighborhood: 'Alaba International Market',
    fulfillment: 'both',
    imageUrl:
      'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    description:
      'Tier-1 Felicity Solar 48V hybrid system with LiFePO4 battery rack. 5 years warranty with warranty card.',
    seller: {
      id: 'usr-2',
      name: 'SunPower Africa Ltd',
      avatar: 'SP',
      rating: 5.0,
      reviewsCount: 64,
      verified: true,
      city: 'Lagos',
      country: 'Nigeria',
    },
    bidHistory: [],
    createdAt: Date.now() - 43200000,
  },
  {
    id: 'serv-103',
    title: 'Apple MacBook Pro 14" M1 Pro 16GB / 512GB Space Gray',
    category: 'electronics',
    format: 'auction',
    status: 'active',
    amountMinor: 115000, // $1,150 USD
    currency: 'USD',
    buyItNowAmountMinor: 140000, // $1,400 USD
    reserveAmountMinor: 125000, // $1,250 USD
    bidsCount: 9,
    endTime: Date.now() + 1000 * 60 * 60 * 7, // 7 hours remaining
    city: 'Nairobi',
    country: 'Kenya',
    neighborhood: 'Westlands',
    fulfillment: 'both',
    imageUrl:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    description:
      'Battery health 94%, cycle count 82. Comes with original 67W MagSafe brick. No scratches.',
    seller: {
      id: 'usr-3',
      name: 'TechBoutique Nairobi',
      avatar: 'TB',
      rating: 4.8,
      reviewsCount: 22,
      verified: true,
      city: 'Nairobi',
      country: 'Kenya',
    },
    bidHistory: [],
    createdAt: Date.now() - 72000000,
  },
  {
    id: 'serv-104',
    title: 'Certified Borehole Geological Survey & Drilling Team',
    category: 'services',
    format: 'service',
    status: 'active',
    amountMinor: 85000000, // 850,000 NGN
    currency: 'NGN',
    bidsCount: 0,
    city: 'Abuja',
    country: 'Nigeria',
    neighborhood: 'Gwarinpa / Maitama',
    fulfillment: 'pickup',
    imageUrl:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    description:
      'Industrial and residential deep borehole drilling with geophysical ground resistivity report and submersible installation.',
    seller: {
      id: 'usr-4',
      name: 'Apex Geoworks',
      avatar: 'AG',
      rating: 4.9,
      reviewsCount: 19,
      verified: true,
      city: 'Abuja',
      country: 'Nigeria',
    },
    bidHistory: [],
    createdAt: Date.now() - 18000000,
  },
  {
    id: 'serv-105',
    title: 'Handwoven Royal Ashanti Kente Cloth (Double Weave 6-Piece)',
    category: 'collectibles',
    format: 'buy_now',
    status: 'active',
    amountMinor: 340000, // 3,400 GHS
    currency: 'GHS',
    buyItNowAmountMinor: 340000,
    bidsCount: 0,
    city: 'Accra',
    country: 'Ghana',
    neighborhood: 'Osu / Arts Centre',
    fulfillment: 'both',
    imageUrl:
      'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80',
    description:
      'Authentic handwoven Kente by master weavers in Bonwire. 100% pure silk and cotton threads.',
    seller: {
      id: 'usr-5',
      name: 'Kente Heritage House',
      avatar: 'KH',
      rating: 5.0,
      reviewsCount: 14,
      verified: true,
      city: 'Accra',
      country: 'Ghana',
    },
    bidHistory: [],
    createdAt: Date.now() - 36000000,
  },
  {
    id: 'serv-106',
    title: 'Solid Teak Wood Dining Table + 6 Handcrafted Chairs',
    category: 'home',
    format: 'buy_now',
    status: 'active',
    amountMinor: 1450000, // 14,500 ZAR
    currency: 'ZAR',
    buyItNowAmountMinor: 1450000,
    bidsCount: 0,
    city: 'Cape Town',
    country: 'South Africa',
    neighborhood: 'Woodstock / CBD',
    fulfillment: 'pickup',
    imageUrl:
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    description:
      'Locally crafted kiln-dried African teak timber. Natural wax finish, built for generations.',
    seller: {
      id: 'usr-6',
      name: 'Cape Craft Timber',
      avatar: 'CC',
      rating: 4.7,
      reviewsCount: 11,
      verified: true,
      city: 'Cape Town',
      country: 'South Africa',
    },
    bidHistory: [],
    createdAt: Date.now() - 25000000,
  },
];

export const SEED_REQUESTS: BuyerRequest[] = [
  {
    id: 'req-201',
    title: 'URGENT: Need 15kVA Soundproof Diesel Generator (Perkins / Cummins)',
    category: 'services',
    requestType: 'good',
    budgetAmountMinor: 650000000, // 6,500,000 NGN
    currency: 'NGN',
    urgency: 'ASAP (Within 24 Hours)',
    conditionRequired: 'Brand New or Tokunbo < 500 hours',
    rateType: 'flat',
    city: 'Lagos',
    country: 'Nigeria',
    neighborhood: 'Victoria Island / Lekki',
    fulfillment: 'both',
    imageUrl:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    description:
      'Factory diesel generator needed for commercial baking facility. Must provide load test video and ATS panel.',
    buyer: {
      id: 'buyer-1',
      name: 'Bakery Logistics Hub',
      avatar: 'BL',
      rating: 4.8,
      reviewsCount: 6,
      verified: true,
      city: 'Lagos',
      country: 'Nigeria',
    },
    offers: [
      {
        id: 'off-1',
        requestId: 'req-201',
        providerName: 'Alhaji Sani Machinery',
        providerAvatar: 'AS',
        providerRating: 4.9,
        amountMinor: 620000000, // 6,200,000 NGN
        currency: 'NGN',
        timeline: 'Can deliver to Lekki within 4 hours today',
        message:
          'Original UK Perkins 15kVA soundproof, 320 run hours, serviced yesterday with new filters.',
        status: 'pending',
        createdAt: Date.now() - 1800000,
      },
    ],
    status: 'open',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'req-202',
    title: 'ISO: 50 Bags High-Yield Certified Maize Seeds for Planting',
    category: 'agriculture',
    requestType: 'good',
    budgetAmountMinor: 45000000, // 450,000 KES
    currency: 'KES',
    urgency: 'Within 2-3 Days',
    conditionRequired: 'Brand New / Sealed Certified Bags',
    rateType: 'flat',
    city: 'Nairobi',
    country: 'Kenya',
    neighborhood: 'Industrial Area / Thika Road',
    fulfillment: 'both',
    imageUrl:
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    description:
      'Looking for verified Kenya Seed Company SC Duma 43 or certified hybrid maize seeds with KEPHIS stamp.',
    buyer: {
      id: 'buyer-2',
      name: 'Rift Valley Agro Farm',
      avatar: 'RV',
      rating: 5.0,
      reviewsCount: 12,
      verified: true,
      city: 'Nairobi',
      country: 'Kenya',
    },
    offers: [],
    status: 'open',
    createdAt: Date.now() - 14400000,
  },
];
