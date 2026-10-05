-- Sprint 9: faster search, and matching between requests and listings.
--
-- Nothing here changes a table the live site uses. The first draft added a
-- column and a trigger to listings and buyer_requests; instead, search gets
-- indexes only, and matches are worked out when asked for, so there is no
-- stored "match" that could go stale or be edited.
--
-- Both matching functions run with the caller's own access (SECURITY INVOKER),
-- so row-level security decides what they can see, and each one only answers
-- for the signed-in member's own request or own listings.

-- Makes "title contains ..." searches use an index
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm
    ON public.listings USING GIN (title extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_title_trgm
    ON public.buyer_requests USING GIN (title extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_services_title_trgm
    ON public.services USING GIN (title extensions.gin_trgm_ops);

-- Listings that fit one of the caller's own requests.
-- A listing must be in the request's category. It then ranks higher when its
-- title or description shares words with the request, when it is within the
-- budget (same currency only: amounts in different currencies are never
-- compared), and when it is in the same city.
CREATE OR REPLACE FUNCTION public.match_listings_for_request(p_request_id UUID, p_limit INT DEFAULT 6)
RETURNS TABLE (listing_id UUID, score INT, reasons TEXT[])
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO ''
AS $$
    WITH req AS (
        SELECT r.*,
               -- any of the request's words, not all of them
               NULLIF(replace(plainto_tsquery('english', r.title)::text, '&', '|'), '') AS words
          FROM public.buyer_requests r
         WHERE r.id = p_request_id AND r.buyer_id = auth.uid()
    ),
    scored AS (
        SELECT l.id,
               (req.words IS NOT NULL
                AND to_tsvector('english', l.title || ' ' || COALESCE(l.description, ''))
                    @@ to_tsquery('english', req.words)) AS shares_words,
               (req.budget_amount_minor IS NOT NULL AND l.currency = req.currency
                AND l.amount_minor <= req.budget_amount_minor) AS within_budget,
               COALESCE(lower(btrim(l.city)) = lower(btrim(req.city)), false) AS same_city
          FROM public.listings l
          JOIN req ON l.category = req.category
         WHERE l.status = 'active'
           AND l.seller_id <> req.buyer_id
           AND (l.format <> 'auction' OR l.auction_end_at > now())
    )
    SELECT s.id,
           40 + s.shares_words::int * 30 + s.within_budget::int * 20 + s.same_city::int * 10,
           array_remove(ARRAY['category',
                              CASE WHEN s.shares_words THEN 'words' END,
                              CASE WHEN s.within_budget THEN 'budget' END,
                              CASE WHEN s.same_city THEN 'city' END], NULL)
      FROM scored s
     ORDER BY 2 DESC, s.id
     LIMIT LEAST(GREATEST(COALESCE(p_limit, 6), 1), 20);
$$;

-- Open requests that fit what the caller sells: requests in a category where
-- the caller has an active listing. They rank higher when the buyer's budget
-- covers one of those listings (same currency) and when the city matches.
CREATE OR REPLACE FUNCTION public.match_requests_for_seller(p_limit INT DEFAULT 6)
RETURNS TABLE (request_id UUID, score INT, reasons TEXT[])
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO ''
AS $$
    WITH mine AS (
        SELECT l.category, l.currency, l.amount_minor, lower(btrim(l.city)) AS city
          FROM public.listings l
         WHERE l.seller_id = auth.uid() AND l.status = 'active'
    ),
    scored AS (
        SELECT r.id, r.created_at,
               bool_or(r.budget_amount_minor IS NOT NULL AND mine.currency = r.currency
                       AND mine.amount_minor <= r.budget_amount_minor) AS within_budget,
               COALESCE(bool_or(mine.city = lower(btrim(r.city))), false) AS same_city
          FROM public.buyer_requests r
          JOIN mine ON mine.category = r.category
         WHERE r.status = 'open' AND r.buyer_id <> auth.uid()
         GROUP BY r.id, r.created_at
    )
    SELECT s.id,
           50 + s.within_budget::int * 30 + s.same_city::int * 20,
           array_remove(ARRAY['category',
                              CASE WHEN s.within_budget THEN 'budget' END,
                              CASE WHEN s.same_city THEN 'city' END], NULL)
      FROM scored s
     ORDER BY 2 DESC, s.created_at DESC
     LIMIT LEAST(GREATEST(COALESCE(p_limit, 6), 1), 20);
$$;

REVOKE ALL ON FUNCTION public.match_listings_for_request(UUID, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.match_requests_for_seller(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_listings_for_request(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_requests_for_seller(INT) TO authenticated;
