-- Sprint 7: closing an auction in the new app.
--
-- settle_auction() (00011) belongs to the current live site and opens an order
-- in its own escrow_orders table, so it is left exactly as it is. The new app
-- keeps orders in public.orders (00015) and takes payment through a licensed
-- provider, so it closes auctions with close_auction() instead: the winner
-- gets an unpaid order at the winning bid and pays it like any other order.
--
-- This migration only adds things; nothing the live site uses is changed.

INSERT INTO public.platform_settings (key, value_int, description) VALUES
    ('auction_payment_window_hours', 48, 'Hours an auction winner has to pay before the order expires')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.close_auction(p_listing_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_listing public.listings;
    v_top public.bids;
    v_fee BIGINT;
    v_commission BIGINT;
    v_hours INT;
    v_order UUID;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to close an auction';
    END IF;

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

    IF v_uid <> v_listing.seller_id AND (v_top.id IS NULL OR v_uid <> v_top.bidder_id) THEN
        RAISE EXCEPTION 'Only the seller or the winning bidder can close this auction';
    END IF;

    -- No bids, or the reserve was not reached: the auction ends without a sale
    IF v_top.id IS NULL
       OR (v_listing.reserve_amount_minor IS NOT NULL AND v_top.amount_minor < v_listing.reserve_amount_minor) THEN
        UPDATE public.listings SET status = 'ended' WHERE id = p_listing_id;
        PERFORM public.write_audit_log('auction.ended', 'listing', p_listing_id::text,
            jsonb_build_object('bids', v_listing.bids_count));
        RETURN jsonb_build_object('status', 'ended', 'order_id', NULL);
    END IF;

    SELECT (v_top.amount_minor * value_int) / 10000 INTO v_fee
      FROM public.platform_settings WHERE key = 'buyer_protection_fee_bps';
    SELECT (v_top.amount_minor * value_int) / 10000 INTO v_commission
      FROM public.platform_settings WHERE key = 'seller_commission_bps';
    SELECT value_int INTO v_hours FROM public.platform_settings WHERE key = 'auction_payment_window_hours';
    v_fee := COALESCE(v_fee, 0);
    v_commission := COALESCE(v_commission, 0);
    v_hours := COALESCE(v_hours, 48);

    INSERT INTO public.orders (order_number, buyer_id, seller_id, listing_id, title, currency,
                               subtotal_minor, delivery_fee_minor, buyer_fee_minor, seller_commission_minor,
                               total_minor, fulfillment_type, payment_due_at)
    VALUES ('SV-' || to_char(now(), 'YYMM') || '-' || nextval('public.order_number_seq'),
            v_top.bidder_id, v_listing.seller_id, v_listing.id, v_listing.title, v_listing.currency,
            v_top.amount_minor, 0, v_fee, v_commission, v_top.amount_minor + v_fee,
            'pickup', now() + make_interval(hours => v_hours))
    RETURNING id INTO v_order;

    UPDATE public.listings SET status = 'sold' WHERE id = p_listing_id;

    PERFORM public.write_audit_log('auction.sold', 'listing', p_listing_id::text,
        jsonb_build_object('order_id', v_order, 'winner_id', v_top.bidder_id,
                           'amount_minor', v_top.amount_minor, 'currency', v_listing.currency));
    RETURN jsonb_build_object('status', 'sold', 'order_id', v_order);
END;
$$;

REVOKE ALL ON FUNCTION public.close_auction(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_auction(UUID) TO authenticated;
