-- Migration 00021: Listing integrity for Sprint 2 (review of 00013)
--
-- 00013 added categories and listing columns but left the listing rules from
-- 00003 and 00010 untouched, so the new app could not save what its forms
-- offer, and sellers could not edit the new fields. This aligns them, keeping
-- every rule in the database.

-- ---------------------------------------------------------------------------
-- 1. Lifecycle states from the master spec (section 5)
--    'active' is the published state; 'ended' and 'cancelled' are kept for the
--    auction and withdrawal flows that already use them.
-- ---------------------------------------------------------------------------
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_status_check
    CHECK (status IN ('draft', 'active', 'paused', 'sold', 'ended', 'expired', 'cancelled', 'removed'));

-- ---------------------------------------------------------------------------
-- 2. Categories come from the categories table, not a hard-coded list
-- ---------------------------------------------------------------------------
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_category_check;
ALTER TABLE public.buyer_requests DROP CONSTRAINT IF EXISTS buyer_requests_category_check;

-- The current site still posts under these two; they stay until it is retired
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
    ('Collectibles & Art', 'collectibles', 'Heritage art, crafts, antiques and collectibles', 11),
    ('Housing & Shortlets', 'housing', 'Homes to rent, shortlets and shared spaces', 12)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_listing_type_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_listing_type_check
    CHECK (listing_type IN ('classified', 'fixed_price', 'negotiable', 'auction', 'service'));

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_condition_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_condition_check
    CHECK (condition IN ('new', 'refurbished', 'used_like_new', 'used_good', 'used_fair'));

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_quantity_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_quantity_check CHECK (quantity >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS uq_listings_slug ON public.listings(slug) WHERE slug IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. One place that keeps a listing row honest, whoever writes it
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.listings_enforce_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_category public.categories;
    -- True for a member writing through the API; false inside trusted database functions
    v_direct BOOLEAN := current_user IN ('authenticated', 'anon');
BEGIN
    IF NEW.status = 'published' THEN
        NEW.status := 'active';
    END IF;

    -- Resolve the category from its id or its slug; unknown categories are refused
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
        -- Once bidding has started the price and type belong to the auction
        IF OLD.bids_count > 0 AND (NEW.amount_minor <> OLD.amount_minor OR NEW.format <> OLD.format) THEN
            RAISE EXCEPTION 'An auction with bids cannot change its price or type';
        END IF;
        -- Sold and moderated listings are closed to their seller
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

DROP TRIGGER IF EXISTS listings_integrity ON public.listings;
CREATE TRIGGER listings_integrity
    BEFORE INSERT OR UPDATE ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.listings_enforce_integrity();

-- ---------------------------------------------------------------------------
-- 4. What a seller may edit on their own listing
-- ---------------------------------------------------------------------------
GRANT UPDATE (
    title, description, category, category_id, listing_type, condition, quantity, negotiable,
    amount_minor, city, country, neighborhood, fulfillment, image_url, status, expires_at
) ON public.listings TO authenticated;

-- Moderators may pause or remove any listing; sellers keep their own
DROP POLICY IF EXISTS "Owners can update own listings" ON public.listings;
CREATE POLICY "Owners can update own listings" ON public.listings
    FOR UPDATE TO authenticated
    USING (auth.uid() = seller_id OR public.has_permission('listings.moderate'))
    WITH CHECK (auth.uid() = seller_id OR public.has_permission('listings.moderate'));

-- Drafts, paused and closed listings are visible to their seller, to people
-- with a stake in them (00011) and to moderators
DROP POLICY IF EXISTS "Public read listings" ON public.listings;
CREATE POLICY "Public read listings" ON public.listings
    FOR SELECT TO anon, authenticated
    USING (
        status = 'active'
        OR auth.uid() = seller_id
        OR EXISTS (SELECT 1 FROM public.bids b WHERE b.listing_id = listings.id AND b.bidder_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.escrow_orders o WHERE o.listing_id = listings.id AND o.buyer_id = auth.uid())
        OR public.has_permission('listings.moderate')
    );

-- ---------------------------------------------------------------------------
-- 5. Listing images: tighten 00013 (members had every privilege on the table)
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.listing_images FROM anon, authenticated;
GRANT SELECT ON public.listing_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.listing_images TO authenticated;

ALTER TABLE public.listing_images DROP CONSTRAINT IF EXISTS listing_images_url_check;
ALTER TABLE public.listing_images ADD CONSTRAINT listing_images_url_check
    CHECK (url ~* '^https://[^[:space:]"''<>]+$');

REVOKE ALL ON public.categories FROM anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;

-- Read policies call has_permission(); visitors must be able to evaluate it (it is false for them)
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO anon;
