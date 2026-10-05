-- Migration 00020: Sprint 9 - Search Optimization & Intelligent Marketplace Matching Engine
-- Master Spec Section 1, 73 & Section 95 (Intelligent Marketplace Matching)

-- Enable pg_trgm for fuzzy string matching and text similarity if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Full-Text Search Vectors and Indexes on listings
ALTER TABLE public.listings 
    ADD COLUMN IF NOT EXISTS search_tsv TSVECTOR;

CREATE OR REPLACE FUNCTION public.listings_generate_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv := setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
                      setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B') ||
                      setweight(to_tsvector('english', coalesce(NEW.city, '')), 'C') ||
                      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_listings_search_tsv ON public.listings;
CREATE TRIGGER trg_listings_search_tsv
    BEFORE INSERT OR UPDATE ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.listings_generate_search_vector();

-- Populate existing listings
UPDATE public.listings SET search_tsv = 
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(city, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'D');

CREATE INDEX IF NOT EXISTS idx_listings_search_tsv ON public.listings USING GIN(search_tsv);
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON public.listings USING GIN(title gin_trgm_ops);

-- 2. Full-Text Search Vectors and Indexes on buyer_requests
ALTER TABLE public.buyer_requests 
    ADD COLUMN IF NOT EXISTS search_tsv TSVECTOR;

CREATE OR REPLACE FUNCTION public.buyer_requests_generate_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_tsv := setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
                      setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B') ||
                      setweight(to_tsvector('english', coalesce(NEW.city, '')), 'C') ||
                      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_buyer_requests_search_tsv ON public.buyer_requests;
CREATE TRIGGER trg_buyer_requests_search_tsv
    BEFORE INSERT OR UPDATE ON public.buyer_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.buyer_requests_generate_search_vector();

-- Populate existing buyer requests
UPDATE public.buyer_requests SET search_tsv = 
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(city, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'D');

CREATE INDEX IF NOT EXISTS idx_buyer_requests_search_tsv ON public.buyer_requests USING GIN(search_tsv);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_title_trgm ON public.buyer_requests USING GIN(title gin_trgm_ops);

-- 3. Marketplace Matches Table
CREATE TABLE IF NOT EXISTS public.marketplace_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.buyer_requests(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    match_score NUMERIC(5,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    match_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'unseen' CHECK (status IN ('unseen', 'viewed', 'quoted', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(request_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_matches_req ON public.marketplace_matches(request_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_matches_list ON public.marketplace_matches(listing_id, match_score DESC);

-- 4. Matching Algorithm Function: Finds matching listings for a buyer request
CREATE OR REPLACE FUNCTION public.find_matching_listings_for_request(p_request_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    listing_id UUID,
    title TEXT,
    amount_minor BIGINT,
    currency VARCHAR(3),
    category TEXT,
    city TEXT,
    image_url TEXT,
    match_score NUMERIC(5,2),
    match_reasons JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_req public.buyer_requests;
BEGIN
    SELECT * INTO v_req FROM public.buyer_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        l.id AS listing_id,
        l.title,
        l.amount_minor,
        l.currency,
        l.category,
        l.city,
        l.image_url,
        ROUND(
            (
                CASE WHEN l.category = v_req.category THEN 40.0 ELSE 0.0 END +
                CASE WHEN v_req.budget_minor IS NOT NULL AND l.amount_minor <= v_req.budget_minor THEN 25.0 
                     WHEN v_req.budget_minor IS NOT NULL AND l.amount_minor <= (v_req.budget_minor * 1.2) THEN 15.0
                     ELSE 5.0 END +
                CASE WHEN LOWER(l.city) = LOWER(v_req.city) THEN 20.0 ELSE 0.0 END +
                CASE WHEN l.search_tsv @@ plainto_tsquery('english', v_req.title) THEN 15.0 ELSE 0.0 END
            )::numeric, 2
        ) AS match_score,
        jsonb_build_array(
            CASE WHEN l.category = v_req.category THEN 'category_match' ELSE NULL END,
            CASE WHEN v_req.budget_minor IS NOT NULL AND l.amount_minor <= v_req.budget_minor THEN 'within_budget' ELSE NULL END,
            CASE WHEN LOWER(l.city) = LOWER(v_req.city) THEN 'city_match' ELSE NULL END,
            CASE WHEN l.search_tsv @@ plainto_tsquery('english', v_req.title) THEN 'keyword_similarity' ELSE NULL END
        ) AS match_reasons
    FROM public.listings l
    WHERE l.status = 'active'
      AND (
          l.category = v_req.category 
          OR LOWER(l.city) = LOWER(v_req.city)
          OR l.search_tsv @@ plainto_tsquery('english', v_req.title)
      )
    ORDER BY match_score DESC
    LIMIT p_limit;
END;
$$;

-- RLS
ALTER TABLE public.marketplace_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view their own matches" ON public.marketplace_matches;
CREATE POLICY "Users view their own matches" ON public.marketplace_matches
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.buyer_requests r WHERE r.id = marketplace_matches.request_id AND r.buyer_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.listings l WHERE l.id = marketplace_matches.listing_id AND l.seller_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users dismiss their own matches" ON public.marketplace_matches;
CREATE POLICY "Users dismiss their own matches" ON public.marketplace_matches
    FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.buyer_requests r WHERE r.id = marketplace_matches.request_id AND r.buyer_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.listings l WHERE l.id = marketplace_matches.listing_id AND l.seller_id = auth.uid())
    );
