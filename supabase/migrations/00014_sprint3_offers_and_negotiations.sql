-- Migration 00014: Sprint 3 - offers and counter-offers on listings
-- Master spec sections 8, 23, 120.
--
-- The server decides everything about an offer. Members cannot insert or
-- update rows in public.offers directly; they call make_offer() and
-- respond_to_offer(), which take the buyer from the session, the seller and
-- currency from the listing, and enforce who may accept, reject, counter or
-- cancel.
--
-- Offers apply to listings only. Responses to buyer requests stay in the
-- existing public.quotes table with accept_quote() and withdraw_quote().

-- ---------------------------------------------------------------------------
-- 1. Offers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(10) NOT NULL,
    message TEXT CHECK (message IS NULL OR char_length(message) <= 1000),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT offers_distinct_parties CHECK (buyer_id <> seller_id),
    CONSTRAINT offers_proposer_is_party CHECK (proposer_id IN (buyer_id, seller_id))
);

CREATE INDEX IF NOT EXISTS idx_offers_listing ON public.offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON public.offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller ON public.offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_offers_parent ON public.offers(parent_offer_id);

-- One live negotiation per buyer and listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_offers_one_pending
    ON public.offers(listing_id, buyer_id) WHERE status = 'pending';

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.offers FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.offers TO authenticated;

DROP POLICY IF EXISTS "Participants read own offers" ON public.offers;
CREATE POLICY "Participants read own offers" ON public.offers
    FOR SELECT TO authenticated
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_permission('listings.moderate'));

-- ---------------------------------------------------------------------------
-- 2. make_offer: a buyer proposes a price on someone else's listing
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.make_offer(
    p_listing_id UUID,
    p_amount_minor BIGINT,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_listing public.listings;
    v_id UUID;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to make an offer';
    END IF;
    IF p_amount_minor IS NULL OR p_amount_minor <= 0 THEN
        RAISE EXCEPTION 'Offer amount must be greater than zero';
    END IF;

    SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR SHARE;
    IF NOT FOUND OR v_listing.status <> 'active' THEN
        RAISE EXCEPTION 'This listing is not available';
    END IF;
    IF v_listing.seller_id = v_uid THEN
        RAISE EXCEPTION 'You cannot make an offer on your own listing';
    END IF;
    IF v_listing.format = 'auction' OR v_listing.listing_type = 'auction' THEN
        RAISE EXCEPTION 'This is an auction: place a bid instead';
    END IF;
    IF NOT COALESCE(v_listing.negotiable, false) THEN
        RAISE EXCEPTION 'The seller is not accepting offers on this listing';
    END IF;

    -- A new offer replaces the buyer's open negotiation on this listing
    UPDATE public.offers
       SET status = 'cancelled', updated_at = now()
     WHERE listing_id = v_listing.id AND buyer_id = v_uid AND status = 'pending';

    INSERT INTO public.offers (listing_id, buyer_id, seller_id, proposer_id, amount_minor, currency, message)
    VALUES (v_listing.id, v_uid, v_listing.seller_id, v_uid, p_amount_minor, v_listing.currency,
            NULLIF(btrim(p_message), ''))
    RETURNING id INTO v_id;

    PERFORM public.write_audit_log('offer.created', 'offer', v_id::text,
        jsonb_build_object('listing_id', v_listing.id, 'amount_minor', p_amount_minor, 'currency', v_listing.currency));
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. respond_to_offer: accept, reject, counter or cancel a pending offer
--    Returns the offer id, or the new offer's id for a counter.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.respond_to_offer(
    p_offer_id UUID,
    p_action TEXT,
    p_counter_amount_minor BIGINT DEFAULT NULL,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_offer public.offers;
    v_listing public.listings;
    v_id UUID;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to respond to an offer';
    END IF;
    IF p_action IS NULL OR p_action NOT IN ('accept', 'reject', 'counter', 'cancel') THEN
        RAISE EXCEPTION 'Unknown action';
    END IF;

    SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
    IF NOT FOUND OR v_uid NOT IN (v_offer.buyer_id, v_offer.seller_id) THEN
        RAISE EXCEPTION 'Offer not found';
    END IF;
    IF v_offer.status <> 'pending' THEN
        RAISE EXCEPTION 'This offer is already %', v_offer.status;
    END IF;

    IF p_action = 'cancel' THEN
        IF v_offer.proposer_id <> v_uid THEN
            RAISE EXCEPTION 'Only the person who made the offer can cancel it';
        END IF;
        UPDATE public.offers SET status = 'cancelled', updated_at = now() WHERE id = v_offer.id;
        PERFORM public.write_audit_log('offer.cancelled', 'offer', v_offer.id::text, '{}'::jsonb);
        RETURN v_offer.id;
    END IF;

    IF v_offer.proposer_id = v_uid THEN
        RAISE EXCEPTION 'You cannot respond to your own offer';
    END IF;

    IF p_action = 'reject' THEN
        UPDATE public.offers SET status = 'rejected', updated_at = now() WHERE id = v_offer.id;
        PERFORM public.write_audit_log('offer.rejected', 'offer', v_offer.id::text, '{}'::jsonb);
        RETURN v_offer.id;
    END IF;

    IF v_offer.expires_at <= now() THEN
        RAISE EXCEPTION 'This offer has expired';
    END IF;
    SELECT * INTO v_listing FROM public.listings WHERE id = v_offer.listing_id FOR SHARE;
    IF NOT FOUND OR v_listing.status <> 'active' THEN
        RAISE EXCEPTION 'This listing is no longer available';
    END IF;

    IF p_action = 'accept' THEN
        UPDATE public.offers SET status = 'accepted', updated_at = now() WHERE id = v_offer.id;
        PERFORM public.write_audit_log('offer.accepted', 'offer', v_offer.id::text,
            jsonb_build_object('amount_minor', v_offer.amount_minor, 'currency', v_offer.currency));
        RETURN v_offer.id;
    END IF;

    -- counter
    IF p_counter_amount_minor IS NULL OR p_counter_amount_minor <= 0 THEN
        RAISE EXCEPTION 'Counter-offer amount must be greater than zero';
    END IF;
    UPDATE public.offers SET status = 'countered', updated_at = now() WHERE id = v_offer.id;
    INSERT INTO public.offers (listing_id, buyer_id, seller_id, proposer_id, parent_offer_id,
                               amount_minor, currency, message)
    VALUES (v_offer.listing_id, v_offer.buyer_id, v_offer.seller_id, v_uid, v_offer.id,
            p_counter_amount_minor, v_offer.currency, NULLIF(btrim(p_message), ''))
    RETURNING id INTO v_id;
    PERFORM public.write_audit_log('offer.countered', 'offer', v_offer.id::text,
        jsonb_build_object('counter_offer_id', v_id, 'amount_minor', p_counter_amount_minor));
    RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.make_offer(UUID, BIGINT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_to_offer(UUID, TEXT, BIGINT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.make_offer(UUID, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_offer(UUID, TEXT, BIGINT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Buyer requests: a response deadline, and no write access for visitors
--    Statuses stay as they are (open, matched, completed, cancelled): the
--    current site and accept_quote() depend on them.
-- ---------------------------------------------------------------------------
ALTER TABLE public.buyer_requests ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMPTZ;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.buyer_requests FROM anon;
REVOKE INSERT, TRUNCATE, REFERENCES, TRIGGER ON public.quotes FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.buyer_requests, public.quotes FROM authenticated;
