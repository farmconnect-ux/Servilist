-- Migration 00018: Sprint 7 - Auctions and Timed Bidding Engine
-- Master Spec Section 24 (auctions) & Section 25 (auction_bids) & Phase 7

CREATE TABLE IF NOT EXISTS public.auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL UNIQUE REFERENCES public.listings(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    starting_amount_minor BIGINT NOT NULL CHECK (starting_amount_minor >= 0),
    reserve_amount_minor BIGINT CHECK (reserve_amount_minor IS NULL OR reserve_amount_minor >= starting_amount_minor),
    current_amount_minor BIGINT NOT NULL CHECK (current_amount_minor >= starting_amount_minor),
    min_increment_minor BIGINT NOT NULL DEFAULT 50000 CHECK (min_increment_minor > 0), -- e.g. 500 NGN default
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'active' CHECK (status IN ('scheduled', 'active', 'ended', 'settled', 'cancelled')),
    winner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    winning_bid_id UUID,
    total_bids INTEGER NOT NULL DEFAULT 0 CHECK (total_bids >= 0),
    anti_sniping_seconds INTEGER NOT NULL DEFAULT 300, -- 5 minutes extension if bid placed in last 5 min
    settled_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT auctions_time_valid CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_auctions_listing_id ON public.auctions(listing_id);
CREATE INDEX IF NOT EXISTS idx_auctions_seller_id ON public.auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON public.auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_ends_at ON public.auctions(ends_at);
CREATE INDEX IF NOT EXISTS idx_auctions_winner ON public.auctions(winner_user_id);

-- Auction Bids (immutable log of all bids placed on auctions)
CREATE TABLE IF NOT EXISTS public.auction_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    max_proxy_amount_minor BIGINT CHECK (max_proxy_amount_minor IS NULL OR max_proxy_amount_minor >= amount_minor),
    is_auto_bid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON public.auction_bids(auction_id, amount_minor DESC);
CREATE INDEX IF NOT EXISTS idx_auction_bids_bidder_id ON public.auction_bids(bidder_id, created_at DESC);

-- Function for atomic bid placement with anti-sniping and concurrency locks
CREATE OR REPLACE FUNCTION public.place_bid(
    p_auction_id UUID,
    p_bidder_id UUID,
    p_amount_minor BIGINT,
    p_max_proxy_minor BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_auction public.auctions;
    v_min_required BIGINT;
    v_bid_id UUID;
    v_new_ends_at TIMESTAMPTZ;
    v_extended BOOLEAN := false;
BEGIN
    -- Acquire exclusive row lock on auction
    SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'AUCTION_NOT_FOUND', 'message', 'Auction does not exist');
    END IF;

    IF v_auction.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'AUCTION_NOT_ACTIVE', 'message', 'Auction is not accepting bids');
    END IF;

    IF now() < v_auction.starts_at THEN
        RETURN jsonb_build_object('success', false, 'error', 'AUCTION_NOT_STARTED', 'message', 'Auction has not started yet');
    END IF;

    IF now() >= v_auction.ends_at THEN
        RETURN jsonb_build_object('success', false, 'error', 'AUCTION_ENDED', 'message', 'Auction has already ended');
    END IF;

    IF v_auction.seller_id = p_bidder_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Sellers cannot bid on their own auctions');
    END IF;

    -- Calculate minimum required bid
    IF v_auction.total_bids = 0 THEN
        v_min_required := v_auction.starting_amount_minor;
    ELSE
        v_min_required := v_auction.current_amount_minor + v_auction.min_increment_minor;
    END IF;

    IF p_amount_minor < v_min_required THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'BID_TOO_LOW',
            'message', 'Bid must be at least ' || v_min_required,
            'min_required', v_min_required
        );
    END IF;

    -- Anti-sniping check: If bid placed within anti_sniping_seconds of ends_at, extend ends_at
    v_new_ends_at := v_auction.ends_at;
    IF v_auction.ends_at - now() <= make_interval(secs => v_auction.anti_sniping_seconds) THEN
        v_new_ends_at := now() + make_interval(secs => v_auction.anti_sniping_seconds);
        v_extended := true;
    END IF;

    -- Insert bid record
    INSERT INTO public.auction_bids (auction_id, bidder_id, amount_minor, max_proxy_amount_minor)
    VALUES (p_auction_id, p_bidder_id, p_amount_minor, p_max_proxy_minor)
    RETURNING id INTO v_bid_id;

    -- Update auction record
    UPDATE public.auctions
    SET current_amount_minor = p_amount_minor,
        winner_user_id = p_bidder_id,
        winning_bid_id = v_bid_id,
        total_bids = v_auction.total_bids + 1,
        ends_at = v_new_ends_at,
        updated_at = now()
    WHERE id = p_auction_id;

    -- Also mirror update to listings table
    UPDATE public.listings
    SET amount_minor = p_amount_minor,
        bids_count = v_auction.total_bids + 1,
        auction_end_at = v_new_ends_at
    WHERE id = v_auction.listing_id;

    RETURN jsonb_build_object(
        'success', true,
        'bid_id', v_bid_id,
        'amount_minor', p_amount_minor,
        'new_current_price', p_amount_minor,
        'ends_at', v_new_ends_at,
        'extended', v_extended
    );
END;
$$;

-- RLS Policies
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view auctions" ON public.auctions;
CREATE POLICY "Public view auctions" ON public.auctions
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Sellers create auctions" ON public.auctions;
CREATE POLICY "Sellers create auctions" ON public.auctions
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers and admins update auctions" ON public.auctions;
CREATE POLICY "Sellers and admins update auctions" ON public.auctions
    FOR UPDATE TO authenticated
    USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Public view bids" ON public.auction_bids;
CREATE POLICY "Public view bids" ON public.auction_bids
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Bidders place bids" ON public.auction_bids;
CREATE POLICY "Bidders place bids" ON public.auction_bids
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = bidder_id);
