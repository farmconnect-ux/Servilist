-- Migration 00004: Buyer Requests Table (RFQs / Wanted)
-- Lead feature: buyers post specific items or service jobs they need

CREATE TABLE IF NOT EXISTS public.buyer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN ('electronics', 'solar', 'services', 'collectibles', 'vehicles', 'housing', 'home', 'agriculture', 'community')
    ),
    request_type TEXT NOT NULL CHECK (request_type IN ('good', 'service')),
    currency VARCHAR(3) NOT NULL,
    budget_amount_minor BIGINT NOT NULL CHECK (budget_amount_minor >= 0),
    urgency TEXT NOT NULL DEFAULT 'Within 2-3 Days',
    condition_required TEXT,
    rate_type TEXT DEFAULT 'flat' CHECK (rate_type IN ('flat', 'hourly')),
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    neighborhood TEXT,
    fulfillment TEXT NOT NULL DEFAULT 'both' CHECK (fulfillment IN ('pickup', 'shipping', 'both')),
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buyer_requests_status ON public.buyer_requests(status);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_category ON public.buyer_requests(category);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_city ON public.buyer_requests(city);

DROP TRIGGER IF EXISTS set_buyer_requests_updated_at ON public.buyer_requests;
CREATE TRIGGER set_buyer_requests_updated_at
    BEFORE UPDATE ON public.buyer_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
