-- Migration 00013: Sprint 2 Categories Hierarchy, Enhanced Listings and Listing Images
-- Complies with Master Build Specification sections 5, 18, 19, 20, 52, 53

-- ---------------------------------------------------------------------------
-- 1. CATEGORIES TABLE WITH UNLIMITED HIERARCHY (section 18)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(sort_order);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO authenticated;

DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE OR (auth.uid() IS NOT NULL AND public.has_permission('categories.manage')));

DROP POLICY IF EXISTS "Staff can manage categories" ON public.categories;
CREATE POLICY "Staff can manage categories" ON public.categories
    FOR ALL TO authenticated
    USING (public.has_permission('categories.manage'))
    WITH CHECK (public.has_permission('categories.manage'));

-- Seed default categories for African commerce
INSERT INTO public.categories (name, slug, description, icon, sort_order) VALUES
    ('Electronics', 'electronics', 'Phones, computers, televisions, gadgets and sound systems', '📱', 1),
    ('Solar & Power', 'solar', 'Inverters, lithium batteries, solar panels, and backup systems', '☀️', 2),
    ('Vehicles', 'vehicles', 'Cars, motorbikes, trucks, auto parts and accessories', '🚗', 3),
    ('Property & Housing', 'property', 'Apartments for rent, lands, shortlets and commercial spaces', '🏠', 4),
    ('Local Services', 'services', 'Skilled trades, handymen, mechanics, developers and cleaners', '🛠️', 5),
    ('Agriculture & Food', 'agriculture', 'Farm produce, livestock, seeds, fertilizers and machinery', '🌾', 6),
    ('Fashion & Beauty', 'fashion', 'Clothing, footwear, traditional attire, jewelry and cosmetics', '👗', 7),
    ('Home & Furniture', 'home', 'Home decor, furniture, appliances and kitchenware', '🛋️', 8),
    ('Construction & Hardware', 'construction', 'Cement, building materials, plumbing and electrical fixtures', '🏗️', 9),
    ('Community & Barter', 'community', 'Free items, item exchanges, swaps and donations', '🤝', 10)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- Subcategories under Electronics
DO $$
DECLARE
    v_electronics_id UUID;
BEGIN
    SELECT id INTO v_electronics_id FROM public.categories WHERE slug = 'electronics';
    IF v_electronics_id IS NOT NULL THEN
        INSERT INTO public.categories (parent_id, name, slug, description, icon, sort_order) VALUES
            (v_electronics_id, 'Mobile Phones & Tablets', 'phones-tablets', 'Smartphones, iPhones, tablets and accessories', '📱', 1),
            (v_electronics_id, 'Laptops & Computers', 'laptops-computers', 'MacBooks, Windows laptops, desktops and monitors', '💻', 2),
            (v_electronics_id, 'Audio & Sound', 'audio-sound', 'Headphones, Bluetooth speakers and hi-fi audio', '🎧', 3)
        ON CONFLICT (slug) DO NOTHING;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. ENHANCE LISTINGS TABLE (sections 5, 19)
-- ---------------------------------------------------------------------------
ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS slug VARCHAR(300),
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS listing_type VARCHAR(40) DEFAULT 'fixed_price',
    ADD COLUMN IF NOT EXISTS condition VARCHAR(40) DEFAULT 'used_good',
    ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS negotiable BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill existing listings with slug if missing
UPDATE public.listings
SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(id::text from 1 for 8)
WHERE slug IS NULL;

-- Backfill category_id from category text if null
UPDATE public.listings l
SET category_id = c.id
FROM public.categories c
WHERE l.category_id IS NULL AND l.category = c.slug;

CREATE INDEX IF NOT EXISTS idx_listings_slug ON public.listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON public.listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_published_at ON public.listings(published_at);

-- ---------------------------------------------------------------------------
-- 3. LISTING IMAGES TABLE (section 20, 72)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON public.listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_order ON public.listing_images(listing_id, sort_order);

ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.listing_images TO anon, authenticated;
GRANT ALL ON public.listing_images TO authenticated;

DROP POLICY IF EXISTS "Public can view listing images" ON public.listing_images;
CREATE POLICY "Public can view listing images" ON public.listing_images
    FOR SELECT TO anon, authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "Sellers can manage own listing images" ON public.listing_images;
CREATE POLICY "Sellers can manage own listing images" ON public.listing_images
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = listing_images.listing_id
              AND listings.seller_id = auth.uid()
        ) OR public.has_permission('listings.moderate')
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = listing_images.listing_id
              AND listings.seller_id = auth.uid()
        ) OR public.has_permission('listings.moderate')
    );
