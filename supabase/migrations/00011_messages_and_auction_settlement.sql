-- Migration 00011: Member messaging and auction settlement
--
-- 1. Buyers and sellers can message each other about a listing or request.
-- 2. An auction that has run out is settled by its seller or winning bidder:
--    the winner gets an order, or the listing is closed if the reserve was not met.

-- ---------------------------------------------------------------------------
-- 1. MESSAGES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.buyer_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT messages_about_one_item CHECK (num_nonnulls(listing_id, request_id) = 1),
    CONSTRAINT messages_not_to_self CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_listing ON public.messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_request ON public.messages(request_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.messages FROM anon, authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;

DROP POLICY IF EXISTS "Members read their own conversations" ON public.messages;
CREATE POLICY "Members read their own conversations" ON public.messages
    FOR SELECT TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- The other party must be the item's owner, or someone who already wrote to the
-- owner about it, so members cannot message arbitrary people.
DROP POLICY IF EXISTS "Members message about an item" ON public.messages;
CREATE POLICY "Members message about an item" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
        AND (
            EXISTS (SELECT 1 FROM public.listings l WHERE l.id = messages.listing_id AND l.seller_id = messages.recipient_id)
            OR EXISTS (SELECT 1 FROM public.buyer_requests r WHERE r.id = messages.request_id AND r.buyer_id = messages.recipient_id)
            OR EXISTS (
                SELECT 1 FROM public.messages m
                WHERE m.sender_id = messages.recipient_id
                  AND m.recipient_id = auth.uid()
                  AND m.listing_id IS NOT DISTINCT FROM messages.listing_id
                  AND m.request_id IS NOT DISTINCT FROM messages.request_id
            )
        )
    );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. AUCTION SETTLEMENT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.settle_auction(p_listing_id UUID, p_safe_zone TEXT DEFAULT NULL)
RETURNS public.listings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_listing public.listings;
    v_top public.bids;
BEGIN
    SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR UPDATE;
    IF NOT FOUND OR v_listing.format <> 'auction' THEN
        RAISE EXCEPTION 'Auction not found';
    END IF;
    IF v_listing.status <> 'active' THEN
        RAISE EXCEPTION 'This auction is already closed';
    END IF;
    IF v_listing.auction_end_at IS NULL OR v_listing.auction_end_at > now() THEN
        RAISE EXCEPTION 'This auction is still running';
    END IF;

    SELECT * INTO v_top FROM public.bids
    WHERE listing_id = p_listing_id
    ORDER BY amount_minor DESC, created_at ASC
    LIMIT 1;

    IF v_uid IS NULL OR (v_uid <> v_listing.seller_id AND (v_top.id IS NULL OR v_uid <> v_top.bidder_id)) THEN
        RAISE EXCEPTION 'Only the seller or the winning bidder can close this auction';
    END IF;

    IF v_top.id IS NULL
       OR (v_listing.reserve_amount_minor IS NOT NULL AND v_top.amount_minor < v_listing.reserve_amount_minor) THEN
        UPDATE public.listings SET status = 'ended' WHERE id = p_listing_id RETURNING * INTO v_listing;
        RETURN v_listing;
    END IF;

    PERFORM public.open_escrow_order(
        v_top.bidder_id, v_listing.seller_id, v_listing.id, NULL, NULL,
        v_listing.title, v_listing.currency, v_top.amount_minor, p_safe_zone);

    UPDATE public.listings SET status = 'sold' WHERE id = p_listing_id RETURNING * INTO v_listing;
    RETURN v_listing;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.settle_auction(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_auction(UUID, TEXT) TO authenticated;

-- A sold or ended listing stays visible to the buyer who holds an order on it
-- and to people who bid on it, not only to its seller.
DROP POLICY IF EXISTS "Public read listings" ON public.listings;
CREATE POLICY "Public read listings" ON public.listings
    FOR SELECT TO anon, authenticated
    USING (
        status = 'active'
        OR auth.uid() = seller_id
        OR EXISTS (SELECT 1 FROM public.bids b WHERE b.listing_id = listings.id AND b.bidder_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.escrow_orders o WHERE o.listing_id = listings.id AND o.buyer_id = auth.uid())
    );
