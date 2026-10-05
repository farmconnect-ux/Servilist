-- Migration 00016: Sprint 5 Reviews, Moderation Reports, Vendor Verifications & Disputes
-- Complies with Master Build Specification sections 12, 13, 27, 28, 47, 48, 70, 76, 77, 85, 86, 95

-- ---------------------------------------------------------------------------
-- 1. REVIEWS & RATINGS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT CHECK (char_length(comment) <= 2000),
    status VARCHAR(30) NOT NULL DEFAULT 'published'
        CHECK (status IN ('published', 'flagged', 'hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT review_one_per_order_participant UNIQUE (order_id, reviewer_id),
    CONSTRAINT review_not_self CHECK (reviewer_id <> reviewee_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON public.reviews(listing_id, status);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;

DROP POLICY IF EXISTS "Public read published reviews" ON public.reviews;
CREATE POLICY "Public read published reviews" ON public.reviews
    FOR SELECT TO public
    USING (status = 'published' OR auth.uid() = reviewer_id OR public.has_permission('reviews.moderate'));

DROP POLICY IF EXISTS "Buyers leave reviews on completed orders" ON public.reviews;
CREATE POLICY "Buyers leave reviews on completed orders" ON public.reviews
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = reviewer_id
        AND public.is_active_member()
        AND EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = reviews.order_id
              AND o.status = 'completed'
              AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Reviewers update own reviews or staff moderate" ON public.reviews;
CREATE POLICY "Reviewers update own reviews or staff moderate" ON public.reviews
    FOR UPDATE TO authenticated
    USING (auth.uid() = reviewer_id OR public.has_permission('reviews.moderate'))
    WITH CHECK (auth.uid() = reviewer_id OR public.has_permission('reviews.moderate'));

-- Trigger: recalculate profile rating average and review count
CREATE OR REPLACE FUNCTION public.recalc_profile_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.profiles
    SET rating = COALESCE((
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM public.reviews
            WHERE reviewee_id = NEW.reviewee_id AND status = 'published'
        ), 5.0),
        reviews_count = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE reviewee_id = NEW.reviewee_id AND status = 'published'
        ),
        updated_at = now()
    WHERE id = NEW.reviewee_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_profile_rating ON public.reviews;
CREATE TRIGGER trg_recalc_profile_rating
AFTER INSERT OR UPDATE OF status, rating ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.recalc_profile_rating();

-- ---------------------------------------------------------------------------
-- 2. MODERATION REPORTS & CONTENT FLAGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(30) NOT NULL
        CHECK (target_type IN ('listing', 'profile', 'review', 'message', 'order', 'request')),
    target_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL,
    description TEXT CHECK (char_length(description) <= 2000),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;

DROP POLICY IF EXISTS "Members create reports" ON public.reports;
CREATE POLICY "Members create reports" ON public.reports
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reporter_id AND public.is_active_member());

DROP POLICY IF EXISTS "Reporters view own reports or staff view all" ON public.reports;
CREATE POLICY "Reporters view own reports or staff view all" ON public.reports
    FOR SELECT TO authenticated
    USING (auth.uid() = reporter_id OR public.has_permission('reports.manage'));

DROP POLICY IF EXISTS "Staff moderate reports" ON public.reports;
CREATE POLICY "Staff moderate reports" ON public.reports
    FOR UPDATE TO authenticated
    USING (public.has_permission('reports.manage'))
    WITH CHECK (public.has_permission('reports.manage'));

-- ---------------------------------------------------------------------------
-- 3. VENDOR VERIFICATION & KYC
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    registration_number TEXT,
    tax_id TEXT,
    document_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.vendor_verifications(status);
CREATE INDEX IF NOT EXISTS idx_verifications_vendor ON public.vendor_verifications(vendor_id);

ALTER TABLE public.vendor_verifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.vendor_verifications TO authenticated;

DROP POLICY IF EXISTS "Vendors manage own verification" ON public.vendor_verifications;
CREATE POLICY "Vendors manage own verification" ON public.vendor_verifications
    FOR SELECT TO authenticated
    USING (auth.uid() = vendor_id OR public.has_permission('verifications.manage'));

DROP POLICY IF EXISTS "Vendors submit verification" ON public.vendor_verifications;
CREATE POLICY "Vendors submit verification" ON public.vendor_verifications
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = vendor_id AND public.is_active_member());

DROP POLICY IF EXISTS "Staff update verification" ON public.vendor_verifications;
CREATE POLICY "Staff update verification" ON public.vendor_verifications
    FOR UPDATE TO authenticated
    USING (public.has_permission('verifications.manage'))
    WITH CHECK (public.has_permission('verifications.manage'));
