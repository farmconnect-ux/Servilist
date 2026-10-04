import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Realistic Pan-African Seed Listings
export const SAMPLE_LISTINGS = [
  {
    id: 'serv-seed-101',
    title: '5kVA Pure Sine Wave Solar Inverter + MPPT',
    category: 'solar',
    format: 'buy_now',
    starting_price: 85000000,
    current_price: 85000000,
    buy_it_now_price: 85000000,
    reserve_price: null,
    bids_count: 0,
    end_time: null,
    city: 'Lagos, Nigeria',
    neighborhood: 'Alaba International',
    fulfillment: 'both',
    shipping_fee: 1500000,
    image_url:
      'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    description:
      'High-performance 48V hybrid inverter with built-in 80A MPPT charge controller. 2-year warranty included.',
    seller_name: 'Kofi Mensah',
    seller_avatar: 'KM',
    seller_rating: 4.9,
    seller_verified: true,
    is_sold: false,
  },
  {
    id: 'serv-seed-102',
    title: 'Apple MacBook Pro M2 Max 32GB RAM 1TB SSD',
    category: 'electronics',
    format: 'auction',
    starting_price: 240000000,
    current_price: 265000000,
    buy_it_now_price: 310000000,
    reserve_price: 280000000,
    bids_count: 5,
    end_time: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
    city: 'Nairobi, Kenya',
    neighborhood: 'Westlands / Parklands',
    fulfillment: 'both',
    shipping_fee: 250000,
    image_url:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    description:
      'Space Gray, immaculate condition with original 96W USB-C power adapter and packaging. Battery health 98%.',
    seller_name: 'Amina Diallo',
    seller_avatar: 'AD',
    seller_rating: 4.8,
    seller_verified: true,
    is_sold: false,
  },
  {
    id: 'serv-seed-103',
    title: 'Toyota Hilux Double Cabin 4x4 2021',
    category: 'vehicles',
    format: 'buy_now',
    starting_price: 3500000000,
    current_price: 3500000000,
    buy_it_now_price: 3500000000,
    reserve_price: null,
    bids_count: 0,
    end_time: null,
    city: 'Accra, Ghana',
    neighborhood: 'Airport Residential',
    fulfillment: 'pickup',
    shipping_fee: 0,
    image_url:
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    description:
      'Manual diesel 2.8L GD-6 engine. Fully serviced at Toyota Ghana, genuine low mileage (42,000 km).',
    seller_name: 'Kwame Boateng',
    seller_avatar: 'KB',
    seller_rating: 4.7,
    seller_verified: true,
    is_sold: false,
  },
  {
    id: 'serv-seed-104',
    title: 'Solar Borehole Pump & Complete Installation Kit',
    category: 'agriculture',
    format: 'service',
    starting_price: 145000000,
    current_price: 145000000,
    buy_it_now_price: null,
    reserve_price: null,
    bids_count: 0,
    end_time: null,
    city: 'Johannesburg, South Africa',
    neighborhood: 'Sandton',
    fulfillment: 'shipping',
    shipping_fee: 50000,
    image_url:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    description:
      'Submersible solar water pump system suitable for farms and rural homes up to 120m head.',
    seller_name: 'Zola Khumalo',
    seller_avatar: 'ZK',
    seller_rating: 5.0,
    seller_verified: true,
    is_sold: false,
  },
];

export const SAMPLE_REQUESTS = [
  {
    id: 'req-seed-201',
    title: 'Urgent: Commercial Inverter Battery Bank (48V 200Ah)',
    category: 'solar',
    request_type: 'good',
    budget: 180000000,
    urgency: 'ASAP (Within 24 Hours)',
    condition: 'Brand New with Warranty',
    city: 'Lagos, Nigeria',
    neighborhood: 'Ikeja',
    fulfillment: 'both',
    description:
      'Looking for 4 units of 12V 200Ah tubular deep cycle batteries or 1 unit 48V 100Ah lithium wall mount.',
    requester_name: 'Amina Diallo',
    status: 'active',
  },
  {
    id: 'req-seed-202',
    title: 'Cold Storage Room Construction for Farm Produce',
    category: 'services',
    request_type: 'service',
    budget: 350000000,
    urgency: 'Within 2-3 Days',
    condition: 'Contractor with past completed works',
    city: 'Nairobi, Kenya',
    neighborhood: 'Naivasha Road',
    fulfillment: 'pickup',
    description:
      'Seeking certified HVAC refrigeration contractor to build a 20ft walk-in cold room for horticulture export.',
    requester_name: 'Kofi Mensah',
    status: 'active',
  },
];

async function runSeed() {
  console.log('🌱 Servilist Africa - Seeding Development Data...');

  const outputPath = path.resolve(__dirname, 'seed-data.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ listings: SAMPLE_LISTINGS, requests: SAMPLE_REQUESTS }, null, 2),
    'utf-8'
  );
  console.log(`✅ Fixture data saved to ${outputPath}`);

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    console.log(`Connecting to Supabase at ${SUPABASE_URL}...`);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: listingsErr } = await supabase
      .from('listings')
      .upsert(SAMPLE_LISTINGS, { onConflict: 'id' });

    if (listingsErr) {
      console.error('❌ Failed to seed listings into Supabase:', listingsErr.message);
    } else {
      console.log(`✅ Successfully seeded ${SAMPLE_LISTINGS.length} listings into Supabase!`);
    }

    const { error: reqsErr } = await supabase
      .from('buyer_requests')
      .upsert(SAMPLE_REQUESTS, { onConflict: 'id' });

    if (reqsErr) {
      console.error('❌ Failed to seed requests into Supabase:', reqsErr.message);
    } else {
      console.log(`✅ Successfully seeded ${SAMPLE_REQUESTS.length} buyer requests into Supabase!`);
    }
  } else {
    console.log(
      'ℹ️ Supabase credentials not set in .env. Seed JSON generated for local/browser usage.'
    );
  }

  console.log('✨ Seed script completed.');
}

runSeed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
