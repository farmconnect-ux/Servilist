-- Migration 00019: Sprint 8 - Delivery Fulfilment & Business Storefronts
-- Master Spec Section 93 (Phase 8: Delivery) & Section 94 (Phase 9: Business Marketplace)

-- 1. Business Profiles / Storefronts Table
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    registration_number VARCHAR(100), -- CAC registration / Tax Identification Number
    tagline TEXT,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    support_email VARCHAR(255),
    support_phone VARCHAR(30),
    website_url TEXT,
    verified_tier VARCHAR(30) NOT NULL DEFAULT 'unverified' 
        CHECK (verified_tier IN ('unverified', 'tier_1_identity', 'tier_2_business_cac', 'tier_3_enterprise')),
    return_policy TEXT,
    operating_hours JSONB DEFAULT '{"monday_friday": "8:00 AM - 6:00 PM", "saturday": "10:00 AM - 4:00 PM", "sunday": "Closed"}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_owner ON public.business_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_slug ON public.business_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_business_profiles_tier ON public.business_profiles(verified_tier);

-- 2. Deliveries & Shipping Tracking Table
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    courier_provider VARCHAR(50) NOT NULL DEFAULT 'seller_direct'
        CHECK (courier_provider IN ('gig_logistics', 'kwik_delivery', 'dhl', 'fedex', 'seller_direct', 'pickup')),
    tracking_code VARCHAR(100),
    status VARCHAR(40) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned')),
    sender_address JSONB,
    recipient_address JSONB,
    estimated_delivery_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    proof_of_delivery_url TEXT,
    tracking_events JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { status, timestamp, location, description }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_tracking_code ON public.deliveries(tracking_code);

-- RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view business profiles" ON public.business_profiles;
CREATE POLICY "Public view business profiles" ON public.business_profiles
    FOR SELECT TO public
    USING (is_active = true);

DROP POLICY IF EXISTS "Owners manage their business profile" ON public.business_profiles;
CREATE POLICY "Owners manage their business profile" ON public.business_profiles
    FOR ALL TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Order participants view delivery tracking" ON public.deliveries;
CREATE POLICY "Order participants view delivery tracking" ON public.deliveries
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = deliveries.order_id
            AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Sellers update order delivery" ON public.deliveries;
CREATE POLICY "Sellers update order delivery" ON public.deliveries
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = deliveries.order_id
            AND o.seller_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = deliveries.order_id
            AND o.seller_id = auth.uid()
        )
    );
