-- Migration 00018: Sprint 7 - auction rules
-- Master spec sections 24, 25, 120.
--
-- Auctions already exist: an auction is a listing with format 'auction', bids
-- live in public.bids, and place_bid() and settle_auction() are the only way
-- to bid or close (migrations 00010 and 00011). Both sites use them. This
-- migration tightens those rules instead of adding a second auction system:
--
--   * only active members can bid (a suspended member could before)
--   * a bid in the last five minutes extends the auction by five minutes, so
--     an auction cannot be won by bidding in the final second
--   * a new auction needs an end time between ten minutes and sixty days away
--   * once an auction has bids, its end time and reserve cannot be changed

CREATE OR REPLACE FUNCTION public.place_bid(p_listing_id UUID, p_amount_minor BIGINT)
RETURNS public.bids
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_listing public.listings;
    v_min BIGINT;
    v_bid public.bids;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to place a bid';
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
       SET amount_minor = p_amount_minor,
           bids_count = bids_count + 1,
           -- A late bid gives other bidders five more minutes
           auction_end_at = CASE
               WHEN auction_end_at IS NOT NULL AND auction_end_at - now() < INTERVAL '5 minutes'
               THEN now() + INTERVAL '5 minutes'
               ELSE auction_end_at END
     WHERE id = p_listing_id;

    RETURN v_bid;
END;
$$;

REVOKE ALL ON FUNCTION public.place_bid(UUID, BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_bid(UUID, BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.listings_enforce_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
    v_category public.categories;
    v_direct BOOLEAN := current_user IN ('authenticated', 'anon');
BEGIN
    IF NEW.status = 'published' THEN
        NEW.status := 'active';
    END IF;

    IF NEW.category_id IS NOT NULL THEN
        SELECT * INTO v_category FROM public.categories WHERE id = NEW.category_id AND is_active;
    ELSE
        SELECT * INTO v_category FROM public.categories WHERE slug = NEW.category AND is_active;
    END IF;
    IF v_category.id IS NULL THEN
        RAISE EXCEPTION 'Unknown category';
    END IF;
    NEW.category_id := v_category.id;
    NEW.category := v_category.slug;

    IF TG_OP = 'INSERT' THEN
        IF v_direct THEN
            NEW.bids_count := 0;
            IF NEW.status NOT IN ('draft', 'active') THEN
                RAISE EXCEPTION 'A new listing starts as a draft or published';
            END IF;
            IF NEW.format = 'auction' THEN
                IF NEW.amount_minor <= 0 THEN
                    RAISE EXCEPTION 'An auction needs a starting bid';
                END IF;
                IF NEW.auction_end_at IS NULL
                   OR NEW.auction_end_at < now() + INTERVAL '10 minutes'
                   OR NEW.auction_end_at > now() + INTERVAL '60 days' THEN
                    RAISE EXCEPTION 'An auction must end between ten minutes and sixty days from now';
                END IF;
                IF NEW.reserve_amount_minor IS NOT NULL AND NEW.reserve_amount_minor < NEW.amount_minor THEN
                    RAISE EXCEPTION 'The reserve cannot be lower than the starting bid';
                END IF;
            END IF;
        END IF;
        IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
            NEW.slug := trim(BOTH '-' FROM lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g')))
                || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
        END IF;
        RETURN NEW;
    END IF;

    IF v_direct THEN
        IF NEW.seller_id <> OLD.seller_id THEN
            RAISE EXCEPTION 'A listing cannot change owner';
        END IF;
        IF NEW.currency <> OLD.currency THEN
            RAISE EXCEPTION 'The currency of a listing cannot change';
        END IF;
        IF OLD.bids_count > 0 AND (NEW.amount_minor <> OLD.amount_minor OR NEW.format <> OLD.format) THEN
            RAISE EXCEPTION 'An auction with bids cannot change its price or type';
        END IF;
        IF OLD.bids_count > 0
           AND (NEW.auction_end_at IS DISTINCT FROM OLD.auction_end_at
                OR NEW.reserve_amount_minor IS DISTINCT FROM OLD.reserve_amount_minor) THEN
            RAISE EXCEPTION 'An auction with bids cannot change its end time or reserve';
        END IF;
        IF NEW.format = 'auction'
           AND (NEW.auction_end_at IS DISTINCT FROM OLD.auction_end_at OR OLD.format <> 'auction')
           AND (NEW.auction_end_at IS NULL
                OR NEW.auction_end_at < now() + INTERVAL '10 minutes'
                OR NEW.auction_end_at > now() + INTERVAL '60 days') THEN
            RAISE EXCEPTION 'An auction must end between ten minutes and sixty days from now';
        END IF;
        IF OLD.status IN ('sold', 'removed')
           AND NOT public.has_permission('listings.moderate') THEN
            RAISE EXCEPTION 'This listing can no longer be edited';
        END IF;
        IF NEW.status = 'removed' AND OLD.status <> 'removed'
           AND NOT public.has_permission('listings.moderate') THEN
            RAISE EXCEPTION 'Only a moderator can remove a listing';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;
