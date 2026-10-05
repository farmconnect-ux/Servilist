-- Migration 00017: Sprint 6 - services and bookings
-- Master spec sections 1, 5, 20, 39, 40, 83, 120.
--
-- A provider manages their own service rows directly, within column limits and
-- an integrity trigger. Bookings are different: a booking's provider, price and
-- currency come from the service, so members cannot write bookings at all and
-- use book_service() and set_booking_status() instead.
--
-- A booking is an agreement between client and provider. It does not take
-- payment; paid orders are for listings (migration 00015).

-- ---------------------------------------------------------------------------
-- 1. Services
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_slug VARCHAR(100) NOT NULL DEFAULT 'services',
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 150),
    slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,180}$'),
    description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 5000),
    pricing_model TEXT NOT NULL DEFAULT 'starting_at'
        CHECK (pricing_model IN ('fixed', 'starting_at', 'hourly', 'custom_quote')),
    base_price_minor BIGINT NOT NULL CHECK (base_price_minor >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    delivery_type TEXT NOT NULL DEFAULT 'hybrid'
        CHECK (delivery_type IN ('remote', 'on_site_local', 'hybrid')),
    city VARCHAR(100),
    country VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
    -- [{ "name": "Standard", "priceMinor": 40000, "timeline": "3 days", "deliverables": "..." }]
    packages JSONB CHECK (packages IS NULL OR
                          (jsonb_typeof(packages) = 'array' AND jsonb_array_length(packages) <= 6)),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived', 'removed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_slug);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.services FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT (provider_id, category_id, category_slug, title, slug, description, pricing_model,
              base_price_minor, currency, delivery_type, city, country, packages, status)
    ON public.services TO authenticated;
GRANT UPDATE (category_id, category_slug, title, description, pricing_model, base_price_minor,
              currency, delivery_type, city, country, packages, status, updated_at)
    ON public.services TO authenticated;

DROP POLICY IF EXISTS "Anyone read active services" ON public.services;
CREATE POLICY "Anyone read active services" ON public.services
    FOR SELECT
    USING (status = 'active' OR auth.uid() = provider_id OR public.has_permission('listings.moderate'));

DROP POLICY IF EXISTS "Active providers create services" ON public.services;
CREATE POLICY "Active providers create services" ON public.services
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = provider_id AND public.is_active_member());

DROP POLICY IF EXISTS "Providers update own services" ON public.services;
CREATE POLICY "Providers update own services" ON public.services
    FOR UPDATE TO authenticated
    USING ((auth.uid() = provider_id AND public.is_active_member()) OR public.has_permission('listings.moderate'))
    WITH CHECK ((auth.uid() = provider_id AND public.is_active_member()) OR public.has_permission('listings.moderate'));

-- Only moderators remove a service, and a removed service stays removed
CREATE OR REPLACE FUNCTION public.services_enforce_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    IF current_user IN ('authenticated', 'anon') THEN
        IF TG_OP = 'INSERT' THEN
            IF NEW.status NOT IN ('active', 'paused') THEN
                NEW.status := 'active';
            END IF;
        ELSE
            IF NEW.status IS DISTINCT FROM OLD.status
               AND (NEW.status = 'removed' OR OLD.status = 'removed')
               AND NOT public.has_permission('listings.moderate') THEN
                RAISE EXCEPTION 'Only a moderator can remove or restore a service';
            END IF;
        END IF;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_services_integrity ON public.services;
CREATE TRIGGER trg_services_integrity
BEFORE INSERT OR UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.services_enforce_integrity();

-- ---------------------------------------------------------------------------
-- 2. Bookings
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.booking_number_seq START 1001;
REVOKE ALL ON SEQUENCE public.booking_number_seq FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number TEXT UNIQUE NOT NULL,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    package_name TEXT NOT NULL DEFAULT 'Standard',
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(10) NOT NULL,
    scheduled_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    deliverables_note TEXT CHECK (deliverables_note IS NULL OR char_length(deliverables_note) <= 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT booking_client_provider_diff CHECK (client_id <> provider_id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.service_bookings(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON public.service_bookings(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON public.service_bookings(service_id);

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.service_bookings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.service_bookings TO authenticated;

DROP POLICY IF EXISTS "Participants read own bookings" ON public.service_bookings;
CREATE POLICY "Participants read own bookings" ON public.service_bookings
    FOR SELECT TO authenticated
    USING (auth.uid() = client_id OR auth.uid() = provider_id OR public.has_permission('orders.read'));

CREATE OR REPLACE FUNCTION public.book_service(
    p_service_id UUID,
    p_package_name TEXT DEFAULT NULL,
    p_scheduled_date TIMESTAMPTZ DEFAULT NULL,
    p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_service public.services;
    v_package JSONB;
    v_name TEXT;
    v_amount BIGINT;
    v_id UUID;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to book a service';
    END IF;

    SELECT * INTO v_service FROM public.services WHERE id = p_service_id;
    IF NOT FOUND OR v_service.status <> 'active' THEN
        RAISE EXCEPTION 'This service is not available';
    END IF;
    IF v_service.provider_id = v_uid THEN
        RAISE EXCEPTION 'You cannot book your own service';
    END IF;
    IF p_scheduled_date IS NOT NULL AND p_scheduled_date < now() THEN
        RAISE EXCEPTION 'Choose a date in the future';
    END IF;

    -- The price comes from the provider's package, or the base price when none is named
    IF NULLIF(btrim(p_package_name), '') IS NOT NULL AND v_service.packages IS NOT NULL THEN
        SELECT pkg INTO v_package FROM jsonb_array_elements(v_service.packages) AS pkg
         WHERE pkg->>'name' = btrim(p_package_name) LIMIT 1;
        IF v_package IS NULL THEN
            RAISE EXCEPTION 'That package is no longer offered';
        END IF;
        v_name := v_package->>'name';
        v_amount := CASE WHEN (v_package->>'priceMinor') ~ '^[0-9]{1,15}$'
                         THEN (v_package->>'priceMinor')::BIGINT END;
    ELSE
        v_name := 'Standard';
        v_amount := v_service.base_price_minor;
    END IF;
    IF v_service.pricing_model = 'custom_quote' OR v_amount IS NULL OR v_amount <= 0 THEN
        RAISE EXCEPTION 'This service is priced by quote. Message the provider to agree a price.';
    END IF;

    IF (SELECT count(*) FROM public.service_bookings
         WHERE client_id = v_uid AND service_id = v_service.id AND status = 'pending') >= 3 THEN
        RAISE EXCEPTION 'You already have open requests for this service';
    END IF;

    INSERT INTO public.service_bookings (booking_number, service_id, client_id, provider_id, package_name,
                                         amount_minor, currency, scheduled_date, deliverables_note)
    VALUES ('BK-' || to_char(now(), 'YYMM') || '-' || nextval('public.booking_number_seq'),
            v_service.id, v_uid, v_service.provider_id, v_name, v_amount, v_service.currency,
            p_scheduled_date, NULLIF(btrim(p_note), ''))
    RETURNING id INTO v_id;

    PERFORM public.write_audit_log('service.booked', 'service_booking', v_id::text,
        jsonb_build_object('service_id', v_service.id, 'amount_minor', v_amount, 'currency', v_service.currency));
    RETURN v_id;
END;
$$;

-- provider: pending -> confirmed -> in_progress.  client: confirmed/in_progress -> completed.
-- either party: pending/confirmed -> cancelled.
CREATE OR REPLACE FUNCTION public.set_booking_status(p_booking_id UUID, p_status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_booking public.service_bookings;
    v_is_provider BOOLEAN;
    v_allowed BOOLEAN;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account';
    END IF;
    SELECT * INTO v_booking FROM public.service_bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND OR v_uid NOT IN (v_booking.client_id, v_booking.provider_id) THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;
    v_is_provider := v_uid = v_booking.provider_id;

    v_allowed := CASE p_status
        WHEN 'confirmed'   THEN v_is_provider AND v_booking.status = 'pending'
        WHEN 'in_progress' THEN v_is_provider AND v_booking.status = 'confirmed'
        WHEN 'completed'   THEN NOT v_is_provider AND v_booking.status IN ('confirmed', 'in_progress')
        WHEN 'cancelled'   THEN v_booking.status IN ('pending', 'confirmed')
        ELSE false END;
    IF NOT COALESCE(v_allowed, false) THEN
        RAISE EXCEPTION 'This booking cannot be changed that way';
    END IF;

    UPDATE public.service_bookings SET status = p_status, updated_at = now() WHERE id = v_booking.id;
    PERFORM public.write_audit_log('booking.' || p_status, 'service_booking', v_booking.id::text, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.services_enforce_integrity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.book_service(UUID, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_booking_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_service(UUID, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_booking_status(UUID, TEXT) TO authenticated;
