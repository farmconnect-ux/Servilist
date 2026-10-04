-- Migration 00009: Fine-Grained User Row Level Security (RLS) Policies
-- Implements Phase 2: Real accounts with strict ownership isolation.
-- Users can only modify their own rows; escrow orders are visible only to the participating buyer and seller.

-- 1. PROFILES
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. LISTINGS
DROP POLICY IF EXISTS "Public read listings" ON public.listings;
CREATE POLICY "Public read listings" ON public.listings
    FOR SELECT TO anon, authenticated
    USING (status = 'active' OR (auth.uid() IS NOT NULL AND auth.uid() = seller_id));

DROP POLICY IF EXISTS "Authenticated users create own listings" ON public.listings;
CREATE POLICY "Authenticated users create own listings" ON public.listings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Owners can update own listings" ON public.listings;
CREATE POLICY "Owners can update own listings" ON public.listings
    FOR UPDATE TO authenticated
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Owners can delete own listings" ON public.listings;
CREATE POLICY "Owners can delete own listings" ON public.listings
    FOR DELETE TO authenticated
    USING (auth.uid() = seller_id);

-- 3. BUYER REQUESTS (RFQs)
DROP POLICY IF EXISTS "Public read buyer requests" ON public.buyer_requests;
CREATE POLICY "Public read buyer requests" ON public.buyer_requests
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated buyers can post requests" ON public.buyer_requests;
CREATE POLICY "Authenticated buyers can post requests" ON public.buyer_requests
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Buyers can update own requests" ON public.buyer_requests;
CREATE POLICY "Buyers can update own requests" ON public.buyer_requests
    FOR UPDATE TO authenticated
    USING (auth.uid() = buyer_id)
    WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Buyers can delete own requests" ON public.buyer_requests;
CREATE POLICY "Buyers can delete own requests" ON public.buyer_requests
    FOR DELETE TO authenticated
    USING (auth.uid() = buyer_id);

-- 4. QUOTES & PROPOSALS
DROP POLICY IF EXISTS "Public read quotes" ON public.quotes;
CREATE POLICY "Read quotes allowed for vendor or request owner" ON public.quotes
    FOR SELECT TO authenticated
    USING (
        auth.uid() = vendor_id OR
        auth.uid() IN (SELECT buyer_id FROM public.buyer_requests WHERE id = request_id)
    );

DROP POLICY IF EXISTS "Vendors can submit quotes" ON public.quotes;
CREATE POLICY "Vendors can submit quotes" ON public.quotes
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Vendors or request owners can update quote status" ON public.quotes;
CREATE POLICY "Vendors or request owners can update quote status" ON public.quotes
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = vendor_id OR
        auth.uid() IN (SELECT buyer_id FROM public.buyer_requests WHERE id = request_id)
    )
    WITH CHECK (
        auth.uid() = vendor_id OR
        auth.uid() IN (SELECT buyer_id FROM public.buyer_requests WHERE id = request_id)
    );

-- 5. BIDS
DROP POLICY IF EXISTS "Public read bids" ON public.bids;
CREATE POLICY "Public read bids" ON public.bids
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can place bids" ON public.bids;
CREATE POLICY "Authenticated users can place bids" ON public.bids
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = bidder_id);

-- 6. ESCROW ORDERS (Strict Buyer & Seller Isolation)
DROP POLICY IF EXISTS "Service role manage escrow orders" ON public.escrow_orders;
CREATE POLICY "Escrow visible only to buyer or seller" ON public.escrow_orders
    FOR SELECT TO authenticated
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyer can fund escrow order" ON public.escrow_orders
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyer or seller can update escrow milestones" ON public.escrow_orders
    FOR UPDATE TO authenticated
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
    WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Service role bypass maintained for backend administration & webhook reconciliation
CREATE POLICY "Service role full access escrow" ON public.escrow_orders
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- 7. STORAGE BUCKET FOR LISTING IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read listing images" ON storage.objects;
CREATE POLICY "Public read listing images" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Authenticated users upload listing images" ON storage.objects;
CREATE POLICY "Authenticated users upload listing images" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'listing-images');
