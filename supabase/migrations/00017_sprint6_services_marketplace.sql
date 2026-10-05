-- Migration 00017: Sprint 6 Services Marketplace & Professional Hiring
-- Complies with Master Build Specification sections 1, 5, 20, 39, 40, 83

-- ---------------------------------------------------------------------------
-- 1. SERVICES CATALOG TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_slug VARCHAR(100) NOT NULL DEFAULT 'services',
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 150),
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL CHECK (char_length(description) >= 10),
    pricing_model VARCHAR(30) NOT NULL DEFAULT 'starting_at'
        CHECK (pricing_model IN ('fixed', 'starting_at', 'hourly', 'custom_quote')),
    base_price_minor BIGINT NOT NULL CHECK (base_price_minor >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    delivery_type VARCHAR(30) NOT NULL DEFAULT 'hybrid'
        CHECK (delivery_type IN ('remote', 'on_site_local', 'hybrid')),
    city VARCHAR(100),
    country VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
    packages JSONB, -- Array of [{ name: "Standard", priceMinor: 40000, timeline: "3 days", deliverables: "..." }]
    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'paused', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_slug);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.services TO public;
GRANT INSERT, UPDATE ON public.services TO authenticated;

DROP POLICY IF EXISTS "Anyone read active services" ON public.services;
CREATE POLICY "Anyone read active services" ON public.services
    FOR SELECT TO public
    USING (status = 'active' OR auth.uid() = provider_id OR public.has_permission('listings.moderate'));

DROP POLICY IF EXISTS "Active providers create services" ON public.services;
CREATE POLICY "Active providers create services" ON public.services
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = provider_id AND public.is_active_member());

DROP POLICY IF EXISTS "Providers update own services" ON public.services;
CREATE POLICY "Providers update own services" ON public.services
    FOR UPDATE TO authenticated
    USING (auth.uid() = provider_id OR public.has_permission('listings.moderate'))
    WITH CHECK (auth.uid() = provider_id OR public.has_permission('listings.moderate'));

-- ---------------------------------------------------------------------------
-- 2. SERVICE BOOKINGS & CONTRACTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    package_name VARCHAR(100) NOT NULL DEFAULT 'Standard',
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    scheduled_date TIMESTAMPTZ,
    status VARCHAR(40) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed')),
    deliverables_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT booking_client_provider_diff CHECK (client_id <> provider_id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.service_bookings(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON public.service_bookings(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.service_bookings(status);

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.service_bookings TO authenticated;

DROP POLICY IF EXISTS "Participants read own bookings" ON public.service_bookings;
CREATE POLICY "Participants read own bookings" ON public.service_bookings
    FOR SELECT TO authenticated
    USING (auth.uid() = client_id OR auth.uid() = provider_id OR public.has_permission('orders.read'));

DROP POLICY IF EXISTS "Clients create bookings" ON public.service_bookings;
CREATE POLICY "Clients create bookings" ON public.service_bookings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = client_id AND public.is_active_member());

DROP POLICY IF EXISTS "Participants update bookings" ON public.service_bookings;
CREATE POLICY "Participants update bookings" ON public.service_bookings
    FOR UPDATE TO authenticated
    USING (auth.uid() = client_id OR auth.uid() = provider_id OR public.has_permission('orders.manage'))
    WITH CHECK (auth.uid() = client_id OR auth.uid() = provider_id OR public.has_permission('orders.manage'));
