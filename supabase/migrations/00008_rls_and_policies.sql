-- Migration 00008: Row Level Security & Realtime Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_orders ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: public read, service_role write
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manage profiles" ON public.profiles;
CREATE POLICY "Service role manage profiles" ON public.profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Exchange Rates: public read, service_role write
DROP POLICY IF EXISTS "Public read exchange rates" ON public.exchange_rates;
CREATE POLICY "Public read exchange rates" ON public.exchange_rates
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manage exchange rates" ON public.exchange_rates;
CREATE POLICY "Service role manage exchange rates" ON public.exchange_rates
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Listings: public read, service_role write
DROP POLICY IF EXISTS "Public read listings" ON public.listings;
CREATE POLICY "Public read listings" ON public.listings
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manage listings" ON public.listings;
CREATE POLICY "Service role manage listings" ON public.listings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Buyer Requests: public read, service_role write
DROP POLICY IF EXISTS "Public read buyer requests" ON public.buyer_requests;
CREATE POLICY "Public read buyer requests" ON public.buyer_requests
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manage buyer requests" ON public.buyer_requests;
CREATE POLICY "Service role manage buyer requests" ON public.buyer_requests
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Quotes: public read, service_role write
DROP POLICY IF EXISTS "Public read quotes" ON public.quotes;
CREATE POLICY "Public read quotes" ON public.quotes
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manage quotes" ON public.quotes;
CREATE POLICY "Service role manage quotes" ON public.quotes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Bids: public read, service_role write
DROP POLICY IF EXISTS "Public read bids" ON public.bids;
CREATE POLICY "Public read bids" ON public.bids
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manage bids" ON public.bids;
CREATE POLICY "Service role manage bids" ON public.bids
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Escrow Orders: NO public read/write; service_role access only
DROP POLICY IF EXISTS "Service role manage escrow orders" ON public.escrow_orders;
CREATE POLICY "Service role manage escrow orders" ON public.escrow_orders
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Safe Realtime publication configuration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buyer_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
