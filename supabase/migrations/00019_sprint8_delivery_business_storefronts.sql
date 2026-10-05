-- Sprint 8: delivery records and business pages.
--
-- Same pattern as the earlier sprints: members can read, and every change goes
-- through a function that takes the member from auth.uid().
--
-- Two things the first draft of this file allowed are deliberately not here:
--   * a business could not be trusted to set its own "verified" tier. There is
--     no tier column; the verified badge comes from the owner's profile, which
--     only staff can change (00016).
--   * a seller could not be trusted to edit an order's status directly. A
--     delivery update moves the order only through set_order_stage() (00015),
--     and an order is still completed only with the buyer's handover code.
--
-- Servilist has no courier integration. A delivery here is what the seller
-- reports: who is carrying the parcel and the tracking code they were given.
--
-- This migration only adds things; nothing the live site uses is changed.

-- ---------------------------------------------------------------------------
-- Business pages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL CHECK (char_length(business_name) BETWEEN 2 AND 150),
    slug TEXT NOT NULL UNIQUE,
    -- As given by the business. Servilist does not check it.
    registration_number TEXT CHECK (registration_number IS NULL OR char_length(registration_number) <= 100),
    tagline TEXT CHECK (tagline IS NULL OR char_length(tagline) <= 250),
    description TEXT CHECK (description IS NULL OR char_length(description) <= 3000),
    logo_url TEXT CHECK (logo_url IS NULL OR (logo_url ~ '^https://[^\s"''<>]+$' AND char_length(logo_url) <= 500)),
    banner_url TEXT CHECK (banner_url IS NULL OR (banner_url ~ '^https://[^\s"''<>]+$' AND char_length(banner_url) <= 500)),
    support_email TEXT CHECK (support_email IS NULL OR (support_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND char_length(support_email) <= 255)),
    support_phone TEXT CHECK (support_phone IS NULL OR support_phone ~ '^\+?[0-9 ()-]{6,30}$'),
    website_url TEXT CHECK (website_url IS NULL OR (website_url ~ '^https://[^\s"''<>]+$' AND char_length(website_url) <= 300)),
    return_policy TEXT CHECK (return_policy IS NULL OR char_length(return_policy) <= 3000),
    opening_hours TEXT CHECK (opening_hours IS NULL OR char_length(opening_hours) <= 300),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.business_profiles TO anon, authenticated;

DROP POLICY IF EXISTS "Read business pages" ON public.business_profiles;
CREATE POLICY "Read business pages" ON public.business_profiles
    FOR SELECT TO anon, authenticated
    USING (is_active OR owner_id = auth.uid() OR public.has_permission('listings.moderate'));

-- Create or update the caller's own business page. The web address (slug) is
-- made once, on creation, and does not change when the name changes.
CREATE OR REPLACE FUNCTION public.save_business_profile(
    p_business_name TEXT,
    p_tagline TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_logo_url TEXT DEFAULT NULL,
    p_banner_url TEXT DEFAULT NULL,
    p_support_email TEXT DEFAULT NULL,
    p_support_phone TEXT DEFAULT NULL,
    p_website_url TEXT DEFAULT NULL,
    p_return_policy TEXT DEFAULT NULL,
    p_opening_hours TEXT DEFAULT NULL,
    p_registration_number TEXT DEFAULT NULL
)
RETURNS public.business_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_name TEXT := btrim(COALESCE(p_business_name, ''));
    v_row public.business_profiles;
    v_slug TEXT;
    v_url TEXT;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to manage a business page';
    END IF;
    IF char_length(v_name) < 2 OR char_length(v_name) > 150 THEN
        RAISE EXCEPTION 'Enter a business name of 2 to 150 characters';
    END IF;
    FOREACH v_url IN ARRAY ARRAY[p_logo_url, p_banner_url, p_website_url] LOOP
        IF NULLIF(btrim(v_url), '') IS NOT NULL AND btrim(v_url) !~ '^https://[^\s"''<>]+$' THEN
            RAISE EXCEPTION 'Web addresses must start with https://';
        END IF;
    END LOOP;
    IF NULLIF(btrim(p_support_email), '') IS NOT NULL AND btrim(p_support_email) !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RAISE EXCEPTION 'Enter a valid support email address';
    END IF;
    IF NULLIF(btrim(p_support_phone), '') IS NOT NULL AND btrim(p_support_phone) !~ '^\+?[0-9 ()-]{6,30}$' THEN
        RAISE EXCEPTION 'Enter a valid support phone number';
    END IF;

    SELECT * INTO v_row FROM public.business_profiles WHERE owner_id = v_uid FOR UPDATE;

    IF FOUND THEN
        IF NOT v_row.is_active THEN
            RAISE EXCEPTION 'This business page has been suspended. Contact support.';
        END IF;
        UPDATE public.business_profiles SET
            business_name = v_name,
            tagline = NULLIF(btrim(p_tagline), ''),
            description = NULLIF(btrim(p_description), ''),
            logo_url = NULLIF(btrim(p_logo_url), ''),
            banner_url = NULLIF(btrim(p_banner_url), ''),
            support_email = NULLIF(btrim(p_support_email), ''),
            support_phone = NULLIF(btrim(p_support_phone), ''),
            website_url = NULLIF(btrim(p_website_url), ''),
            return_policy = NULLIF(btrim(p_return_policy), ''),
            opening_hours = NULLIF(btrim(p_opening_hours), ''),
            registration_number = NULLIF(btrim(p_registration_number), ''),
            updated_at = now()
         WHERE id = v_row.id
        RETURNING * INTO v_row;
        PERFORM public.write_audit_log('business.updated', 'business', v_row.id::text, '{}'::jsonb);
        RETURN v_row;
    END IF;

    v_slug := btrim(left(regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'), 60), '-');
    v_slug := COALESCE(NULLIF(v_slug, ''), 'business') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

    INSERT INTO public.business_profiles (owner_id, business_name, slug, tagline, description, logo_url,
        banner_url, support_email, support_phone, website_url, return_policy, opening_hours, registration_number)
    VALUES (v_uid, v_name, v_slug, NULLIF(btrim(p_tagline), ''), NULLIF(btrim(p_description), ''),
        NULLIF(btrim(p_logo_url), ''), NULLIF(btrim(p_banner_url), ''), NULLIF(btrim(p_support_email), ''),
        NULLIF(btrim(p_support_phone), ''), NULLIF(btrim(p_website_url), ''), NULLIF(btrim(p_return_policy), ''),
        NULLIF(btrim(p_opening_hours), ''), NULLIF(btrim(p_registration_number), ''))
    RETURNING * INTO v_row;
    PERFORM public.write_audit_log('business.created', 'business', v_row.id::text,
        jsonb_build_object('slug', v_row.slug));
    RETURN v_row;
END;
$$;

-- Staff: take a business page down, or put it back.
CREATE OR REPLACE FUNCTION public.set_business_active(p_business_id UUID, p_active BOOLEAN, p_reason TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR NOT public.has_permission('listings.moderate') THEN
        RAISE EXCEPTION 'You do not have permission to moderate business pages';
    END IF;
    IF char_length(btrim(COALESCE(p_reason, ''))) < 5 THEN
        RAISE EXCEPTION 'Give a reason of at least 5 characters';
    END IF;
    UPDATE public.business_profiles SET is_active = p_active, updated_at = now() WHERE id = p_business_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Business page not found';
    END IF;
    PERFORM public.write_audit_log(
        CASE WHEN p_active THEN 'business.restored' ELSE 'business.suspended' END,
        'business', p_business_id::text, jsonb_build_object('reason', left(btrim(p_reason), 500)));
END;
$$;

REVOKE ALL ON FUNCTION public.save_business_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_business_active(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_business_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_business_active(UUID, BOOLEAN, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Deliveries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    carrier_name TEXT NOT NULL CHECK (char_length(carrier_name) BETWEEN 2 AND 80),
    tracking_code TEXT CHECK (tracking_code IS NULL OR char_length(tracking_code) <= 100),
    estimated_delivery_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'dispatched'
        CHECK (status IN ('dispatched', 'in_transit', 'out_for_delivery', 'delivered')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('dispatched', 'in_transit', 'out_for_delivery', 'delivered')),
    note TEXT CHECK (note IS NULL OR char_length(note) <= 300),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_delivery_events_delivery ON public.delivery_events(delivery_id, created_at);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.deliveries, public.delivery_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.deliveries, public.delivery_events TO authenticated;

DROP POLICY IF EXISTS "Order parties read deliveries" ON public.deliveries;
CREATE POLICY "Order parties read deliveries" ON public.deliveries
    FOR SELECT TO authenticated
    USING (
        public.has_permission('orders.read')
        OR EXISTS (SELECT 1 FROM public.orders o
                    WHERE o.id = deliveries.order_id AND auth.uid() IN (o.buyer_id, o.seller_id))
    );

DROP POLICY IF EXISTS "Order parties read delivery events" ON public.delivery_events;
CREATE POLICY "Order parties read delivery events" ON public.delivery_events
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.deliveries d WHERE d.id = delivery_events.delivery_id));

-- The seller hands the parcel over for delivery, or corrects the details later.
CREATE OR REPLACE FUNCTION public.record_dispatch(
    p_order_id UUID,
    p_carrier_name TEXT,
    p_tracking_code TEXT DEFAULT NULL,
    p_estimated_delivery_at TIMESTAMPTZ DEFAULT NULL,
    p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_order public.orders;
    v_carrier TEXT := btrim(COALESCE(p_carrier_name, ''));
    v_id UUID;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to dispatch an order';
    END IF;
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND OR v_order.seller_id <> v_uid THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    IF v_order.fulfillment_type <> 'delivery' THEN
        RAISE EXCEPTION 'The buyer chose pickup for this order';
    END IF;
    IF v_order.status NOT IN ('in_escrow', 'dispatched') THEN
        RAISE EXCEPTION 'This order cannot be dispatched';
    END IF;
    IF char_length(v_carrier) < 2 OR char_length(v_carrier) > 80 THEN
        RAISE EXCEPTION 'Say who is delivering the item, in 2 to 80 characters';
    END IF;
    IF char_length(COALESCE(p_tracking_code, '')) > 100 OR char_length(COALESCE(p_note, '')) > 300 THEN
        RAISE EXCEPTION 'The tracking code or note is too long';
    END IF;
    IF p_estimated_delivery_at IS NOT NULL
       AND (p_estimated_delivery_at < now() - interval '1 day' OR p_estimated_delivery_at > now() + interval '90 days') THEN
        RAISE EXCEPTION 'Choose an expected delivery date within the next 90 days';
    END IF;

    SELECT id INTO v_id FROM public.deliveries WHERE order_id = v_order.id;
    IF FOUND THEN
        -- Correcting the details does not add a step to the timeline
        UPDATE public.deliveries SET carrier_name = v_carrier,
               tracking_code = NULLIF(btrim(p_tracking_code), ''),
               estimated_delivery_at = p_estimated_delivery_at, updated_at = now()
         WHERE id = v_id;
        RETURN v_id;
    END IF;

    INSERT INTO public.deliveries (order_id, carrier_name, tracking_code, estimated_delivery_at)
    VALUES (v_order.id, v_carrier, NULLIF(btrim(p_tracking_code), ''), p_estimated_delivery_at)
    RETURNING id INTO v_id;
    INSERT INTO public.delivery_events (delivery_id, status, note)
    VALUES (v_id, 'dispatched', NULLIF(btrim(p_note), ''));

    IF v_order.status = 'in_escrow' THEN
        PERFORM public.set_order_stage(v_order.id, 'dispatched');
    END IF;
    RETURN v_id;
END;
$$;

-- The seller reports progress. Steps only move forward. "delivered" marks the
-- order delivered; it is completed, and the seller paid, only when the buyer
-- gives their handover code.
CREATE OR REPLACE FUNCTION public.add_delivery_update(p_order_id UUID, p_status TEXT, p_note TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_order public.orders;
    v_delivery public.deliveries;
    v_steps TEXT[] := ARRAY['dispatched', 'in_transit', 'out_for_delivery', 'delivered'];
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to update a delivery';
    END IF;
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND OR v_order.seller_id <> v_uid THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    SELECT * INTO v_delivery FROM public.deliveries WHERE order_id = v_order.id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Dispatch this order first';
    END IF;
    IF v_order.status <> 'dispatched' THEN
        RAISE EXCEPTION 'This delivery can no longer be updated';
    END IF;
    IF p_status IS NULL OR array_position(v_steps, p_status) IS NULL
       OR array_position(v_steps, p_status) <= array_position(v_steps, v_delivery.status) THEN
        RAISE EXCEPTION 'A delivery can only move forward';
    END IF;
    IF char_length(COALESCE(p_note, '')) > 300 THEN
        RAISE EXCEPTION 'Keep the note to 300 characters';
    END IF;

    UPDATE public.deliveries SET status = p_status, updated_at = now() WHERE id = v_delivery.id;
    INSERT INTO public.delivery_events (delivery_id, status, note)
    VALUES (v_delivery.id, p_status, NULLIF(btrim(p_note), ''));

    IF p_status = 'delivered' THEN
        PERFORM public.set_order_stage(v_order.id, 'delivered');
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_dispatch(UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_delivery_update(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_dispatch(UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_delivery_update(UUID, TEXT, TEXT) TO authenticated;
