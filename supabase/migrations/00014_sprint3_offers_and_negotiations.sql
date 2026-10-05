-- Migration 00014: Sprint 3 Offers, Counter-offers, and Multi-turn Negotiations
-- Complies with Master Build Specification sections 6, 7, 8, 21, 22, 23, 43, 87

-- ---------------------------------------------------------------------------
-- 1. OFFERS & COUNTER-OFFERS TABLE (section 8, 23)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.buyer_requests(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    message TEXT,
    status VARCHAR(40) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT offers_target_one_item CHECK (num_nonnulls(listing_id, request_id) = 1)
);

CREATE INDEX IF NOT EXISTS idx_offers_listing ON public.offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_request ON public.offers(request_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON public.offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller ON public.offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_offers_proposer ON public.offers(proposer_id);
CREATE INDEX IF NOT EXISTS idx_offers_parent ON public.offers(parent_offer_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.offers TO authenticated;

DROP POLICY IF EXISTS "Participants read own offers" ON public.offers;
CREATE POLICY "Participants read own offers" ON public.offers
    FOR SELECT TO authenticated
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_permission('orders.read'));

DROP POLICY IF EXISTS "Active members create offers" ON public.offers;
CREATE POLICY "Active members create offers" ON public.offers
    FOR INSERT TO authenticated
    WITH CHECK (
        (auth.uid() = buyer_id OR auth.uid() = seller_id)
        AND public.is_active_member()
    );

DROP POLICY IF EXISTS "Participants update offer status" ON public.offers;
CREATE POLICY "Participants update offer status" ON public.offers
    FOR UPDATE TO authenticated
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
    WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ---------------------------------------------------------------------------
-- 2. ENHANCE BUYER REQUESTS STATUS AND DEADLINE (section 7, 21)
-- ---------------------------------------------------------------------------
ALTER TABLE public.buyer_requests
    ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS budget_min_minor BIGINT,
    ADD COLUMN IF NOT EXISTS budget_max_minor BIGINT;

DO $$
BEGIN
    ALTER TABLE public.buyer_requests
        DROP CONSTRAINT IF EXISTS buyer_requests_status_check;

    ALTER TABLE public.buyer_requests
        ADD CONSTRAINT buyer_requests_status_check
        CHECK (status IN ('draft', 'open', 'receiving_offers', 'accepted', 'in_progress', 'completed', 'cancelled', 'expired'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
