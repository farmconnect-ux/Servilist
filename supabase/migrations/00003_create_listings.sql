-- Migration 00003: Listings Table
-- Supports auctions, buy-it-now, trades/services, and barter listings across Africa

CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN ('electronics', 'solar', 'services', 'collectibles', 'vehicles', 'housing', 'home', 'agriculture', 'community')
    ),
    format TEXT NOT NULL CHECK (
        format IN ('auction', 'buy_now', 'service', 'free_barter')
    ),
    status TEXT NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'sold', 'ended', 'cancelled')
    ),
    currency VARCHAR(3) NOT NULL,
    amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
    buy_it_now_amount_minor BIGINT CHECK (buy_it_now_amount_minor IS NULL OR buy_it_now_amount_minor >= 0),
    reserve_amount_minor BIGINT CHECK (reserve_amount_minor IS NULL OR reserve_amount_minor >= 0),
    bids_count INTEGER NOT NULL DEFAULT 0 CHECK (bids_count >= 0),
    auction_end_at TIMESTAMPTZ,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    neighborhood TEXT,
    fulfillment TEXT NOT NULL DEFAULT 'both' CHECK (fulfillment IN ('pickup', 'shipping', 'both')),
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_format ON public.listings(format);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_end_at ON public.listings(auction_end_at);

DROP TRIGGER IF EXISTS set_listings_updated_at ON public.listings;
CREATE TRIGGER set_listings_updated_at
    BEFORE UPDATE ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
