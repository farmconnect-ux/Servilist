-- Migration 00010: Real accounts and server-side bids, quotes and escrow
--
-- 1. Profiles belong to Supabase Auth users and are created on sign-up.
-- 2. Bids, quote acceptance and every escrow transition go through
--    SECURITY DEFINER functions; clients can no longer write those rows.
-- 3. The handover OTP is generated in the database and readable only by the buyer.

-- ---------------------------------------------------------------------------
-- 1. PROFILES <-> AUTH
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Contact details stay private; other members see only the public columns.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, username, display_name, avatar_url, city, country, rating, reviews_count, is_verified, created_at)
    ON public.profiles TO anon, authenticated;

-- Members may edit their own presentation fields, never rating or verification.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (display_name, avatar_url, city, country) ON public.profiles TO authenticated;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_name TEXT;
BEGIN
    v_name := NULLIF(btrim(left(COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''), 80)), '');
    IF v_name IS NULL THEN
        v_name := COALESCE(NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''), 'Member');
    END IF;

    INSERT INTO public.profiles (id, username, display_name, email, phone, city, country)
    VALUES (
        NEW.id,
        'member-' || replace(NEW.id::text, '-', ''),
        v_name,
        NEW.email,
        NEW.phone,
        NULLIF(left(COALESCE(NEW.raw_user_meta_data ->> 'city', ''), 100), ''),
        NULLIF(left(COALESCE(NEW.raw_user_meta_data ->> 'country', ''), 100), '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. LISTINGS: sellers edit their listing, but not the auction state
-- ---------------------------------------------------------------------------
REVOKE UPDATE ON public.listings FROM anon, authenticated;
GRANT UPDATE (title, description, category, city, country, neighborhood, fulfillment, image_url, status)
    ON public.listings TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. BIDS: placed only through place_bid()
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can place bids" ON public.bids;
REVOKE INSERT, UPDATE, DELETE ON public.bids FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.place_bid(p_listing_id UUID, p_amount_minor BIGINT)
RETURNS public.bids
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_listing public.listings;
    v_min BIGINT;
    v_bid public.bids;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Sign in to place a bid';
    END IF;

    SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing not found';
    END IF;
    IF v_listing.format <> 'auction' OR v_listing.status <> 'active' THEN
        RAISE EXCEPTION 'This listing is not an active auction';
    END IF;
    IF v_listing.auction_end_at IS NOT NULL AND v_listing.auction_end_at <= now() THEN
        RAISE EXCEPTION 'This auction has ended';
    END IF;
    IF v_listing.seller_id = v_uid THEN
        RAISE EXCEPTION 'You cannot bid on your own listing';
    END IF;

    -- Same rule as src/auctions: first bid at the starting price, then +5% (min 100 minor units)
    IF v_listing.bids_count = 0 THEN
        v_min := GREATEST(1, v_listing.amount_minor);
    ELSE
        v_min := v_listing.amount_minor + GREATEST(100, CEIL(v_listing.amount_minor * 0.05)::BIGINT);
    END IF;
    IF p_amount_minor IS NULL OR p_amount_minor < v_min THEN
        RAISE EXCEPTION 'Bid must be at least % minor units', v_min;
    END IF;

    INSERT INTO public.bids (listing_id, bidder_id, currency, amount_minor)
    VALUES (p_listing_id, v_uid, v_listing.currency, p_amount_minor)
    RETURNING * INTO v_bid;

    UPDATE public.listings
    SET amount_minor = p_amount_minor, bids_count = bids_count + 1
    WHERE id = p_listing_id;

    RETURN v_bid;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. QUOTES: providers manage their own quote; buyers accept through a function
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Vendors or request owners can update quote status" ON public.quotes;
REVOKE UPDATE, DELETE ON public.quotes FROM anon, authenticated;

DROP POLICY IF EXISTS "Vendors can submit quotes" ON public.quotes;
CREATE POLICY "Vendors can submit quotes" ON public.quotes
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = provider_id
        AND status = 'pending'
        AND EXISTS (
            SELECT 1 FROM public.buyer_requests r
            WHERE r.id = request_id AND r.status = 'open' AND r.buyer_id <> auth.uid()
        )
    );

CREATE OR REPLACE FUNCTION public.withdraw_quote(p_quote_id UUID)
RETURNS public.quotes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_quote public.quotes;
BEGIN
    UPDATE public.quotes SET status = 'withdrawn'
    WHERE id = p_quote_id AND provider_id = auth.uid() AND status = 'pending'
    RETURNING * INTO v_quote;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quote not found or no longer pending';
    END IF;
    RETURN v_quote;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. ESCROW: OTP kept apart from the order, all transitions server-side
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Buyer can fund escrow order" ON public.escrow_orders;
DROP POLICY IF EXISTS "Buyer or seller can update escrow milestones" ON public.escrow_orders;
REVOKE INSERT, UPDATE, DELETE ON public.escrow_orders FROM anon, authenticated;

ALTER TABLE public.escrow_orders DROP COLUMN IF EXISTS otp_code;
ALTER TABLE public.escrow_orders
    ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.escrow_otps (
    order_id UUID PRIMARY KEY REFERENCES public.escrow_orders(id) ON DELETE CASCADE,
    otp_code VARCHAR(6) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.escrow_otps ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.escrow_otps FROM anon, authenticated;
GRANT SELECT ON public.escrow_otps TO authenticated;

DROP POLICY IF EXISTS "Only the buyer can read the handover OTP" ON public.escrow_otps;
CREATE POLICY "Only the buyer can read the handover OTP" ON public.escrow_otps
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.escrow_orders o
            WHERE o.id = order_id AND o.buyer_id = auth.uid()
        )
    );

-- Shared by the two entry points below; not callable by clients.
CREATE OR REPLACE FUNCTION public.open_escrow_order(
    p_buyer UUID, p_seller UUID, p_listing UUID, p_request UUID, p_quote UUID,
    p_title TEXT, p_currency VARCHAR, p_amount BIGINT, p_safe_zone TEXT
)
RETURNS public.escrow_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order public.escrow_orders;
    v_otp TEXT;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Nothing to pay for on this item';
    END IF;

    INSERT INTO public.escrow_orders
        (listing_id, request_id, quote_id, buyer_id, seller_id, order_code, title, currency, amount_minor, safe_zone)
    VALUES
        (p_listing, p_request, p_quote, p_buyer, p_seller,
         'ESC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
         p_title, p_currency, p_amount,
         COALESCE(NULLIF(btrim(left(p_safe_zone, 200)), ''), 'Safe Public Exchange Hub'))
    RETURNING * INTO v_order;

    -- 6 digits taken from a random UUID (cryptographic generator)
    v_otp := lpad(
        ((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint) % 1000000)::text,
        6, '0');
    INSERT INTO public.escrow_otps (order_id, otp_code) VALUES (v_order.id, v_otp);

    RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_escrow_for_listing(p_listing_id UUID, p_safe_zone TEXT DEFAULT NULL)
RETURNS public.escrow_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_listing public.listings;
    v_amount BIGINT;
    v_order public.escrow_orders;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Sign in to buy';
    END IF;

    SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR UPDATE;
    IF NOT FOUND OR v_listing.status <> 'active' THEN
        RAISE EXCEPTION 'This listing is no longer available';
    END IF;
    IF v_listing.seller_id = v_uid THEN
        RAISE EXCEPTION 'You cannot buy your own listing';
    END IF;

    v_amount := CASE
        WHEN v_listing.format = 'auction' THEN v_listing.buy_it_now_amount_minor
        ELSE v_listing.amount_minor
    END;
    IF v_amount IS NULL THEN
        RAISE EXCEPTION 'This auction has no Buy It Now price';
    END IF;

    v_order := public.open_escrow_order(
        v_uid, v_listing.seller_id, v_listing.id, NULL, NULL,
        v_listing.title, v_listing.currency, v_amount, p_safe_zone);

    -- Services stay bookable; goods are taken off the market
    IF v_listing.format <> 'service' THEN
        UPDATE public.listings SET status = 'sold' WHERE id = v_listing.id;
    END IF;

    RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_quote(p_quote_id UUID, p_safe_zone TEXT DEFAULT NULL)
RETURNS public.escrow_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_quote public.quotes;
    v_request public.buyer_requests;
BEGIN
    SELECT * INTO v_quote FROM public.quotes WHERE id = p_quote_id FOR UPDATE;
    IF NOT FOUND OR v_quote.status <> 'pending' THEN
        RAISE EXCEPTION 'Quote not found or no longer pending';
    END IF;

    SELECT * INTO v_request FROM public.buyer_requests WHERE id = v_quote.request_id FOR UPDATE;
    IF v_uid IS NULL OR v_request.buyer_id <> v_uid THEN
        RAISE EXCEPTION 'Only the buyer who posted this request can accept a quote';
    END IF;
    IF v_request.status <> 'open' THEN
        RAISE EXCEPTION 'This request is no longer open';
    END IF;

    UPDATE public.quotes SET status = 'accepted' WHERE id = v_quote.id;
    UPDATE public.quotes SET status = 'rejected'
    WHERE request_id = v_request.id AND id <> v_quote.id AND status = 'pending';
    UPDATE public.buyer_requests SET status = 'matched' WHERE id = v_request.id;

    RETURN public.open_escrow_order(
        v_uid, v_quote.provider_id, NULL, v_request.id, v_quote.id,
        v_request.title, v_quote.currency, v_quote.amount_minor, p_safe_zone);
END;
$$;

-- The seller types in the code the buyer reads out at handover.
CREATE OR REPLACE FUNCTION public.confirm_escrow_handover(p_order_id UUID, p_otp TEXT)
RETURNS public.escrow_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order public.escrow_orders;
    v_expected TEXT;
BEGIN
    SELECT * INTO v_order FROM public.escrow_orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND OR auth.uid() IS NULL OR v_order.seller_id <> auth.uid() THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    IF v_order.status NOT IN ('funded', 'inspection') THEN
        RAISE EXCEPTION 'This order cannot be released from its current state';
    END IF;
    IF v_order.otp_attempts >= 5 THEN
        RAISE EXCEPTION 'Too many incorrect codes. Open a dispute to continue';
    END IF;

    SELECT otp_code INTO v_expected FROM public.escrow_otps WHERE order_id = p_order_id;

    -- A wrong code is recorded (not raised) so the attempt counter is kept.
    IF v_expected IS NULL OR regexp_replace(COALESCE(p_otp, ''), '[^0-9]', '', 'g') <> v_expected THEN
        UPDATE public.escrow_orders SET otp_attempts = otp_attempts + 1
        WHERE id = p_order_id RETURNING * INTO v_order;
        RETURN v_order;
    END IF;

    UPDATE public.escrow_orders SET status = 'released', released_at = now()
    WHERE id = p_order_id RETURNING * INTO v_order;
    DELETE FROM public.escrow_otps WHERE order_id = p_order_id;
    RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_escrow_stage(p_order_id UUID, p_stage TEXT)
RETURNS public.escrow_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order public.escrow_orders;
BEGIN
    SELECT * INTO v_order FROM public.escrow_orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND OR auth.uid() IS NULL OR auth.uid() NOT IN (v_order.buyer_id, v_order.seller_id) THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF p_stage = 'inspection' AND v_order.status = 'funded' THEN
        NULL;
    ELSIF p_stage = 'disputed' AND v_order.status IN ('funded', 'inspection') THEN
        NULL;
    ELSE
        RAISE EXCEPTION 'That change is not allowed for this order';
    END IF;

    UPDATE public.escrow_orders SET status = p_stage WHERE id = p_order_id RETURNING * INTO v_order;
    RETURN v_order;
END;
$$;

REVOKE EXECUTE ON FUNCTION
    public.place_bid(UUID, BIGINT),
    public.withdraw_quote(UUID),
    public.open_escrow_order(UUID, UUID, UUID, UUID, UUID, TEXT, VARCHAR, BIGINT, TEXT),
    public.create_escrow_for_listing(UUID, TEXT),
    public.accept_quote(UUID, TEXT),
    public.confirm_escrow_handover(UUID, TEXT),
    public.set_escrow_stage(UUID, TEXT)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.place_bid(UUID, BIGINT),
    public.withdraw_quote(UUID),
    public.create_escrow_for_listing(UUID, TEXT),
    public.accept_quote(UUID, TEXT),
    public.confirm_escrow_handover(UUID, TEXT),
    public.set_escrow_stage(UUID, TEXT)
TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. STORAGE: members upload only into their own folder
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users upload listing images" ON storage.objects;
CREATE POLICY "Authenticated users upload listing images" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'listing-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
