-- Migration 00016: Sprint 5 - reviews, reports, disputes and seller verification
-- Master spec sections 12, 13, 27, 28, 47, 48, 70, 76, 77, 85, 86, 95, 120.
--
-- Members read these tables under row-level security and write nothing
-- directly. Every change goes through a function that takes the member from
-- the session and works out the rest:
--
--   submit_review()        a party to a completed order rates the other party
--   moderate_review()      staff hide or restore a review
--   file_report()          any active member flags a listing, profile, review, message, order or request
--   resolve_report()       staff close a report, optionally hiding what was reported
--   open_dispute()         a party to a paid order asks staff to step in
--   resolve_dispute()      staff release the order to the seller or mark it for refund
--   submit_verification()  a seller asks to be verified
--   review_verification()  staff approve or reject, which sets the verified badge

-- ---------------------------------------------------------------------------
-- 1. Reviews
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 2000),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT review_one_per_order_participant UNIQUE (order_id, reviewer_id),
    CONSTRAINT review_not_self CHECK (reviewer_id <> reviewee_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON public.reviews(listing_id, status);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;

DROP POLICY IF EXISTS "Public read published reviews" ON public.reviews;
CREATE POLICY "Public read published reviews" ON public.reviews
    FOR SELECT
    USING (status = 'published' OR auth.uid() = reviewer_id OR public.has_permission('reviews.moderate'));

-- A member's rating is the average of their published reviews
CREATE OR REPLACE FUNCTION public.recalc_profile_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    UPDATE public.profiles
       SET rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews
                               WHERE reviewee_id = NEW.reviewee_id AND status = 'published'), 5.0),
           reviews_count = (SELECT COUNT(*) FROM public.reviews
                             WHERE reviewee_id = NEW.reviewee_id AND status = 'published'),
           updated_at = now()
     WHERE id = NEW.reviewee_id;
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.recalc_profile_rating() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_recalc_profile_rating ON public.reviews;
CREATE TRIGGER trg_recalc_profile_rating
AFTER INSERT OR UPDATE OF status, rating ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recalc_profile_rating();

CREATE OR REPLACE FUNCTION public.submit_review(p_order_id UUID, p_rating INT, p_comment TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_order public.orders;
    v_id UUID;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to leave a review';
    END IF;
    IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND OR v_uid NOT IN (v_order.buyer_id, v_order.seller_id) THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    IF v_order.status <> 'completed' THEN
        RAISE EXCEPTION 'You can review once the order is completed';
    END IF;
    IF EXISTS (SELECT 1 FROM public.reviews WHERE order_id = v_order.id AND reviewer_id = v_uid) THEN
        RAISE EXCEPTION 'You have already reviewed this order';
    END IF;

    INSERT INTO public.reviews (order_id, reviewer_id, reviewee_id, listing_id, rating, comment)
    VALUES (v_order.id, v_uid,
            CASE WHEN v_uid = v_order.buyer_id THEN v_order.seller_id ELSE v_order.buyer_id END,
            v_order.listing_id, p_rating, NULLIF(btrim(p_comment), ''))
    RETURNING id INTO v_id;

    PERFORM public.write_audit_log('review.created', 'review', v_id::text,
        jsonb_build_object('order_id', v_order.id, 'rating', p_rating));
    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.moderate_review(p_review_id UUID, p_status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    IF NOT public.has_permission('reviews.moderate') THEN
        RAISE EXCEPTION 'Not authorised' USING ERRCODE = '42501';
    END IF;
    IF p_status NOT IN ('published', 'hidden') THEN
        RAISE EXCEPTION 'Unknown review status';
    END IF;
    UPDATE public.reviews SET status = p_status, updated_at = now() WHERE id = p_review_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Review not found';
    END IF;
    PERFORM public.write_audit_log('review.' || p_status, 'review', p_review_id::text, '{}'::jsonb);
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL
        CHECK (target_type IN ('listing', 'profile', 'review', 'message', 'order', 'request')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 100),
    description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
    is_dispute BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    action_taken TEXT NOT NULL DEFAULT 'none',
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_note TEXT CHECK (resolution_note IS NULL OR char_length(resolution_note) <= 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id, created_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reports FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.reports TO authenticated;

DROP POLICY IF EXISTS "Reporters view own reports or staff view all" ON public.reports;
CREATE POLICY "Reporters view own reports or staff view all" ON public.reports
    FOR SELECT TO authenticated
    USING (auth.uid() = reporter_id OR public.has_permission('reports.manage'));

CREATE OR REPLACE FUNCTION public.file_report(
    p_target_type TEXT,
    p_target_id UUID,
    p_reason TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_exists BOOLEAN;
    v_id UUID;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to send a report';
    END IF;

    -- The thing reported must exist, and for private things the reporter must be part of it
    v_exists := CASE p_target_type
        WHEN 'listing' THEN EXISTS (SELECT 1 FROM public.listings WHERE id = p_target_id)
        WHEN 'profile' THEN EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target_id AND id <> v_uid)
        WHEN 'review'  THEN EXISTS (SELECT 1 FROM public.reviews WHERE id = p_target_id)
        WHEN 'request' THEN EXISTS (SELECT 1 FROM public.buyer_requests WHERE id = p_target_id)
        WHEN 'message' THEN EXISTS (SELECT 1 FROM public.messages
                                     WHERE id = p_target_id AND v_uid IN (sender_id, recipient_id))
        WHEN 'order'   THEN EXISTS (SELECT 1 FROM public.orders
                                     WHERE id = p_target_id AND v_uid IN (buyer_id, seller_id))
        ELSE false END;
    IF NOT COALESCE(v_exists, false) THEN
        RAISE EXCEPTION 'Nothing to report was found';
    END IF;

    IF EXISTS (SELECT 1 FROM public.reports
                WHERE reporter_id = v_uid AND target_type = p_target_type AND target_id = p_target_id
                  AND status IN ('pending', 'under_review')) THEN
        RAISE EXCEPTION 'You have already reported this. Our team is looking at it.';
    END IF;
    IF (SELECT count(*) FROM public.reports
         WHERE reporter_id = v_uid AND created_at > now() - INTERVAL '24 hours') >= 20 THEN
        RAISE EXCEPTION 'You have sent many reports today. Please try again tomorrow.';
    END IF;

    INSERT INTO public.reports (reporter_id, target_type, target_id, reason, description)
    VALUES (v_uid, p_target_type, p_target_id, btrim(p_reason), NULLIF(btrim(p_description), ''))
    RETURNING id INTO v_id;

    PERFORM public.write_audit_log('report.created', 'report', v_id::text,
        jsonb_build_object('target_type', p_target_type, 'target_id', p_target_id));
    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_report(
    p_report_id UUID,
    p_status TEXT,
    p_note TEXT DEFAULT NULL,
    p_action TEXT DEFAULT 'none'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_report public.reports;
BEGIN
    IF NOT public.has_permission('reports.manage') THEN
        RAISE EXCEPTION 'Not authorised' USING ERRCODE = '42501';
    END IF;
    IF p_status NOT IN ('under_review', 'resolved', 'dismissed') THEN
        RAISE EXCEPTION 'Unknown report status';
    END IF;
    IF p_action NOT IN ('none', 'hide_target') THEN
        RAISE EXCEPTION 'Unknown action';
    END IF;

    SELECT * INTO v_report FROM public.reports WHERE id = p_report_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report not found';
    END IF;
    IF v_report.is_dispute AND p_status IN ('resolved', 'dismissed') THEN
        RAISE EXCEPTION 'A dispute is closed by resolving the order';
    END IF;

    IF p_action = 'hide_target' THEN
        IF v_report.target_type = 'listing' AND public.has_permission('listings.moderate') THEN
            UPDATE public.listings SET status = 'removed' WHERE id = v_report.target_id;
        ELSIF v_report.target_type = 'review' AND public.has_permission('reviews.moderate') THEN
            UPDATE public.reviews SET status = 'hidden', updated_at = now() WHERE id = v_report.target_id;
        ELSE
            RAISE EXCEPTION 'Only listings and reviews can be hidden from a report';
        END IF;
    END IF;

    UPDATE public.reports
       SET status = p_status,
           action_taken = p_action,
           resolution_note = NULLIF(btrim(p_note), ''),
           resolved_by = CASE WHEN p_status = 'under_review' THEN NULL ELSE auth.uid() END,
           resolved_at = CASE WHEN p_status = 'under_review' THEN NULL ELSE now() END
     WHERE id = v_report.id;

    PERFORM public.write_audit_log('report.' || p_status, 'report', v_report.id::text,
        jsonb_build_object('action', p_action, 'target_type', v_report.target_type, 'target_id', v_report.target_id));
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Disputes on paid orders
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.open_dispute(p_order_id UUID, p_reason TEXT, p_description TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_order public.orders;
    v_id UUID;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to open a dispute';
    END IF;
    IF p_description IS NULL OR char_length(btrim(p_description)) < 10 THEN
        RAISE EXCEPTION 'Please describe the problem';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND OR v_uid NOT IN (v_order.buyer_id, v_order.seller_id) THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    IF v_order.status NOT IN ('in_escrow', 'dispatched', 'delivered') THEN
        RAISE EXCEPTION 'Only a paid order that is not yet completed can be disputed';
    END IF;

    UPDATE public.orders SET status = 'disputed', updated_at = now() WHERE id = v_order.id;
    INSERT INTO public.reports (reporter_id, target_type, target_id, reason, description, is_dispute)
    VALUES (v_uid, 'order', v_order.id, btrim(p_reason), btrim(p_description), true)
    RETURNING id INTO v_id;

    PERFORM public.write_audit_log('order.disputed', 'order', v_order.id::text,
        jsonb_build_object('report_id', v_id, 'reason', p_reason));
    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_dispute(p_order_id UUID, p_outcome TEXT, p_note TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_order public.orders;
    v_payout BIGINT;
BEGIN
    IF NOT public.has_permission('disputes.manage') THEN
        RAISE EXCEPTION 'Not authorised' USING ERRCODE = '42501';
    END IF;
    IF p_outcome NOT IN ('release', 'refund') THEN
        RAISE EXCEPTION 'Choose release or refund';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND OR v_order.status <> 'disputed' THEN
        RAISE EXCEPTION 'This order is not in dispute';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.payments WHERE order_id = v_order.id AND status = 'successful') THEN
        RAISE EXCEPTION 'This order has no confirmed payment';
    END IF;

    IF p_outcome = 'release' THEN
        UPDATE public.orders SET status = 'completed', completed_at = now(), updated_at = now()
         WHERE id = v_order.id;
        v_payout := v_order.subtotal_minor + v_order.delivery_fee_minor - v_order.seller_commission_minor;
        INSERT INTO public.ledger_entries (order_id, account_id, account_type, entry_type, amount_minor, currency, description)
        VALUES (v_order.id, NULL, 'provider_escrow', 'debit', v_order.total_minor, v_order.currency,
                'Released after dispute for order ' || v_order.order_number),
               (v_order.id, v_order.seller_id, 'seller_payable', 'credit', v_payout, v_order.currency,
                'Due to seller for order ' || v_order.order_number);
        IF v_order.total_minor - v_payout > 0 THEN
            INSERT INTO public.ledger_entries (order_id, account_id, account_type, entry_type, amount_minor, currency, description)
            VALUES (v_order.id, NULL, 'platform_fees', 'credit', v_order.total_minor - v_payout, v_order.currency,
                    'Fees for order ' || v_order.order_number);
        END IF;
    ELSE
        -- The refund itself is made with the payment provider; this records that it is owed
        UPDATE public.orders SET status = 'refunded', updated_at = now() WHERE id = v_order.id;
        UPDATE public.payments SET status = 'refund_due', failure_reason = 'Refund after dispute', updated_at = now()
         WHERE order_id = v_order.id AND status = 'successful';
        INSERT INTO public.ledger_entries (order_id, account_id, account_type, entry_type, amount_minor, currency, description)
        VALUES (v_order.id, NULL, 'provider_escrow', 'debit', v_order.total_minor, v_order.currency,
                'Refund owed after dispute for order ' || v_order.order_number),
               (v_order.id, v_order.buyer_id, 'buyer_payment', 'credit', v_order.total_minor, v_order.currency,
                'Refund owed to buyer for order ' || v_order.order_number);
        UPDATE public.listings SET status = 'active' WHERE id = v_order.listing_id AND status = 'sold';
    END IF;

    UPDATE public.reports
       SET status = 'resolved', action_taken = p_outcome, resolution_note = NULLIF(btrim(p_note), ''),
           resolved_by = auth.uid(), resolved_at = now()
     WHERE target_type = 'order' AND target_id = v_order.id AND is_dispute
       AND status IN ('pending', 'under_review');

    PERFORM public.write_audit_log('dispute.' || p_outcome, 'order', v_order.id::text,
        jsonb_build_object('note', p_note));
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Seller verification
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL CHECK (char_length(business_name) BETWEEN 2 AND 200),
    registration_number TEXT CHECK (registration_number IS NULL OR char_length(registration_number) <= 100),
    tax_id TEXT CHECK (tax_id IS NULL OR char_length(tax_id) <= 100),
    document_url TEXT CHECK (document_url IS NULL OR document_url ~ '^https://'),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 1000),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.vendor_verifications(status);
CREATE INDEX IF NOT EXISTS idx_verifications_vendor ON public.vendor_verifications(vendor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_verifications_one_pending
    ON public.vendor_verifications(vendor_id) WHERE status = 'pending';

ALTER TABLE public.vendor_verifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vendor_verifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.vendor_verifications TO authenticated;

DROP POLICY IF EXISTS "Vendors manage own verification" ON public.vendor_verifications;
CREATE POLICY "Vendors manage own verification" ON public.vendor_verifications
    FOR SELECT TO authenticated
    USING (auth.uid() = vendor_id OR public.has_permission('verifications.manage'));

CREATE OR REPLACE FUNCTION public.submit_verification(
    p_business_name TEXT,
    p_registration_number TEXT DEFAULT NULL,
    p_tax_id TEXT DEFAULT NULL,
    p_document_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_id UUID;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to request verification';
    END IF;
    IF EXISTS (SELECT 1 FROM public.vendor_verifications WHERE vendor_id = v_uid AND status = 'pending') THEN
        RAISE EXCEPTION 'Your verification request is already being reviewed';
    END IF;
    INSERT INTO public.vendor_verifications (vendor_id, business_name, registration_number, tax_id, document_url)
    VALUES (v_uid, btrim(p_business_name), NULLIF(btrim(p_registration_number), ''),
            NULLIF(btrim(p_tax_id), ''), NULLIF(btrim(p_document_url), ''))
    RETURNING id INTO v_id;
    PERFORM public.write_audit_log('verification.submitted', 'vendor_verification', v_id::text, '{}'::jsonb);
    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_verification(p_verification_id UUID, p_approve BOOLEAN, p_reason TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_row public.vendor_verifications;
BEGIN
    IF NOT public.has_permission('verifications.manage') THEN
        RAISE EXCEPTION 'Not authorised' USING ERRCODE = '42501';
    END IF;
    SELECT * INTO v_row FROM public.vendor_verifications WHERE id = p_verification_id FOR UPDATE;
    IF NOT FOUND OR v_row.status <> 'pending' THEN
        RAISE EXCEPTION 'This request is not waiting for review';
    END IF;
    IF NOT p_approve AND NULLIF(btrim(p_reason), '') IS NULL THEN
        RAISE EXCEPTION 'Give the reason for rejecting';
    END IF;

    UPDATE public.vendor_verifications
       SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
           rejection_reason = CASE WHEN p_approve THEN NULL ELSE btrim(p_reason) END,
           reviewed_by = auth.uid(), reviewed_at = now()
     WHERE id = v_row.id;
    IF p_approve THEN
        UPDATE public.profiles SET is_verified = true, updated_at = now() WHERE id = v_row.vendor_id;
    END IF;
    PERFORM public.write_audit_log(
        'verification.' || CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
        'vendor_verification', v_row.id::text, jsonb_build_object('vendor_id', v_row.vendor_id));
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Who may call what (staff functions check their permission inside)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.submit_review(UUID, INT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.moderate_review(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.file_report(TEXT, UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resolve_report(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.open_dispute(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resolve_dispute(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_verification(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_verification(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_review(UUID, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_review(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.file_report(TEXT, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_report(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_dispute(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_dispute(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_verification(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_verification(UUID, BOOLEAN, TEXT) TO authenticated;
