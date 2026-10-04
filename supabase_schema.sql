-- ============================================================================
-- SERVILIST AFRICA - SUPABASE POSTGRESQL SCHEMA
-- Pan-African Auctions, Hyperlocal Classifieds, Buyer Requests (ISO/RFQ) & Escrow
-- Idempotent schema: Safe to run multiple times in Supabase SQL Editor.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. LISTINGS TABLE (eBay Auctions, Buy It Now & Craigslist Classifieds)
CREATE TABLE IF NOT EXISTS public.listings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'electronics',
    format TEXT NOT NULL DEFAULT 'buy_now', -- 'auction', 'buy_now', 'service', 'free_barter'
    starting_price NUMERIC(14,2) DEFAULT 0,
    current_price NUMERIC(14,2) NOT NULL DEFAULT 0,
    buy_it_now_price NUMERIC(14,2),
    reserve_price NUMERIC(14,2),
    bids_count INT DEFAULT 0,
    end_time BIGINT, -- Epoch milliseconds for live countdown
    city TEXT NOT NULL DEFAULT 'Lagos, Nigeria',
    neighborhood TEXT,
    fulfillment TEXT DEFAULT 'both', -- 'pickup', 'shipping', 'both'
    shipping_fee NUMERIC(10,2) DEFAULT 0,
    image_url TEXT,
    description TEXT,
    seller_name TEXT NOT NULL DEFAULT 'Servilist Merchant',
    seller_avatar TEXT DEFAULT 'SM',
    seller_rating NUMERIC(3,1) DEFAULT 5.0,
    seller_verified BOOLEAN DEFAULT FALSE,
    is_sold BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BIDS TABLE (Live Auction Bidding Log)
CREATE TABLE IF NOT EXISTS public.bids (
    id TEXT PRIMARY KEY,
    listing_id TEXT REFERENCES public.listings(id) ON DELETE CASCADE,
    bidder TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BUYER REQUESTS TABLE (Wanted Goods ISO & Service RFQ)
CREATE TABLE IF NOT EXISTS public.buyer_requests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'services',
    request_type TEXT NOT NULL DEFAULT 'good', -- 'good' or 'service'
    budget NUMERIC(14,2) NOT NULL DEFAULT 0,
    urgency TEXT DEFAULT 'Within 2-3 Days',
    condition TEXT,
    city TEXT NOT NULL DEFAULT 'Lagos, Nigeria',
    neighborhood TEXT,
    fulfillment TEXT DEFAULT 'both',
    image_url TEXT,
    description TEXT,
    requester_name TEXT NOT NULL DEFAULT 'Servilist Buyer',
    status TEXT DEFAULT 'active', -- 'active', 'fulfilled', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. QUOTES & PROPOSALS TABLE (Vendor bids submitted on Buyer Requests)
CREATE TABLE IF NOT EXISTS public.quotes (
    id TEXT PRIMARY KEY,
    request_id TEXT REFERENCES public.buyer_requests(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    provider_avatar TEXT DEFAULT 'VP',
    provider_rating NUMERIC(3,1) DEFAULT 5.0,
    price NUMERIC(14,2) NOT NULL,
    timeline TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Pending', -- 'Pending', 'Under Review', 'Accepted', 'Declined'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ESCROW ORDERS TABLE (Protected Trade with Secret Handover OTP)
-- NOTE: Restricted access. Writes and reads only through server-side service role.
CREATE TABLE IF NOT EXISTS public.escrow_orders (
    id TEXT PRIMARY KEY,
    listing_or_request_id TEXT,
    title TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    amount_usd NUMERIC(14,2) NOT NULL,
    target_currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'funded', -- 'funded', 'inspection', 'verified', 'released', 'disputed'
    fulfillment_type TEXT DEFAULT 'pickup',
    otp_code TEXT NOT NULL, -- Secret 6-digit handover OTP
    safe_zone TEXT DEFAULT 'Public Safe Exchange Hub',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_format ON public.listings(format);
CREATE INDEX IF NOT EXISTS idx_bids_listing ON public.bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_quotes_request ON public.quotes(request_id);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_city ON public.buyer_requests(city);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Security rule: Public read on active listings and buyer requests only.
-- No public access to escrow_orders. Writes are handled server-side via service role key.
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    -- Clean up legacy broad policies if present
    DROP POLICY IF EXISTS "Allow public read on listings" ON public.listings;
    DROP POLICY IF EXISTS "Allow public insert on listings" ON public.listings;
    DROP POLICY IF EXISTS "Allow public update on listings" ON public.listings;
    DROP POLICY IF EXISTS "Allow public delete on listings" ON public.listings;
    DROP POLICY IF EXISTS "Allow public all on bids" ON public.bids;
    DROP POLICY IF EXISTS "Allow public all on buyer_requests" ON public.buyer_requests;
    DROP POLICY IF EXISTS "Allow public all on quotes" ON public.quotes;
    DROP POLICY IF EXISTS "Allow public all on escrow_orders" ON public.escrow_orders;

    -- Strict public policies: Read-only on marketplace catalog
    CREATE POLICY "Allow public read on listings" ON public.listings FOR SELECT USING (true);
    CREATE POLICY "Allow public read on buyer_requests" ON public.buyer_requests FOR SELECT USING (true);
    CREATE POLICY "Allow public read on bids" ON public.bids FOR SELECT USING (true);
    CREATE POLICY "Allow public read on quotes" ON public.quotes FOR SELECT USING (true);

    -- escrow_orders: No public policy. Only service role (bypassing RLS) can access.
END $$;

-- 9. REALTIME PUBLICATION REPLICATION (Idempotent)
DO $$
DECLARE
    tbl text;
    pub_tables text[] := ARRAY['listings', 'bids', 'buyer_requests', 'quotes'];
BEGIN
    FOREACH tbl IN ARRAY pub_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
        ) THEN
            BEGIN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
            EXCEPTION WHEN OTHERS THEN
                -- If supabase_realtime publication is not created or available in environment, continue
                RAISE NOTICE 'Publication addition for % skipped: %', tbl, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;
