-- Migration 00015: Sprint 4 - orders, payments and the ledger
-- Master spec sections 9, 10, 11, 24, 25, 26, 44, 45, 46, 74, 75, 120.
--
-- The server decides every amount and every status. Members have read access
-- to their own orders and payments and no direct write access to any table
-- here. Everything is written by the functions below:
--
--   create_order()            buyer    price, seller and currency come from the listing or accepted offer
--   start_payment()           buyer    opens a payment attempt for the order's exact total
--   confirm_payment()         server   called only after the provider has verified the charge
--   fail_payment()            server
--   set_order_stage()         seller   dispatched / delivered
--   complete_order_with_code() seller  the buyer's handover code releases the order
--   cancel_order()            buyer    while unpaid
--
-- "server" functions require the payments server secret. Its hash is stored in
-- private.server_secrets, a schema the API does not expose; the secret itself
-- lives only in the app server's environment (PAYMENTS_SERVER_SECRET).
-- Until a secret is set, no payment can be confirmed.

-- ---------------------------------------------------------------------------
-- 0. Private settings
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.server_secrets (
    name TEXT PRIMARY KEY,
    secret_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
REVOKE ALL ON private.server_secrets FROM PUBLIC, anon, authenticated;

-- Run once in the SQL editor, with a long random value of your own:
--   SELECT private.set_server_secret('payments', '<the same value as PAYMENTS_SERVER_SECRET>');
CREATE OR REPLACE FUNCTION private.set_server_secret(p_name TEXT, p_secret TEXT)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    IF p_secret IS NULL OR char_length(p_secret) < 32 THEN
        RAISE EXCEPTION 'The secret must be at least 32 characters';
    END IF;
    INSERT INTO private.server_secrets (name, secret_hash)
    VALUES (p_name, encode(sha256(convert_to(p_secret, 'UTF8')), 'hex'))
    ON CONFLICT (name) DO UPDATE SET secret_hash = EXCLUDED.secret_hash, updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION private.set_server_secret(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.require_server_secret(p_name TEXT, p_secret TEXT)
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $$
DECLARE
    v_hash TEXT;
BEGIN
    SELECT secret_hash INTO v_hash FROM private.server_secrets WHERE name = p_name;
    IF v_hash IS NULL OR p_secret IS NULL
       OR v_hash <> encode(sha256(convert_to(p_secret, 'UTF8')), 'hex') THEN
        RAISE EXCEPTION 'Not authorised' USING ERRCODE = '42501';
    END IF;
END;
$$;
REVOKE ALL ON FUNCTION private.require_server_secret(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- Fees are settings, not code. Basis points: 200 = 2%.
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value_int BIGINT NOT NULL,
    description TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.platform_settings TO anon, authenticated;
DROP POLICY IF EXISTS "Anyone reads platform settings" ON public.platform_settings;
CREATE POLICY "Anyone reads platform settings" ON public.platform_settings FOR SELECT USING (true);

INSERT INTO public.platform_settings (key, value_int, description) VALUES
    ('buyer_protection_fee_bps', 200, 'Buyer protection fee added at checkout, in basis points of the item price'),
    ('seller_commission_bps', 0, 'Commission taken from the seller when an order completes, in basis points'),
    ('order_payment_window_minutes', 30, 'How long an unpaid order holds the item')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 1. Orders
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1001;
REVOKE ALL ON SEQUENCE public.order_number_seq FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    currency VARCHAR(10) NOT NULL,
    subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor > 0),
    delivery_fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (delivery_fee_minor >= 0),
    buyer_fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (buyer_fee_minor >= 0),
    seller_commission_minor BIGINT NOT NULL DEFAULT 0 CHECK (seller_commission_minor >= 0),
    total_minor BIGINT NOT NULL CHECK (total_minor > 0),
    status TEXT NOT NULL DEFAULT 'pending_payment'
        CHECK (status IN ('pending_payment', 'in_escrow', 'dispatched', 'delivered',
                          'completed', 'cancelled', 'disputed', 'refunded')),
    fulfillment_type TEXT NOT NULL DEFAULT 'pickup' CHECK (fulfillment_type IN ('delivery', 'pickup')),
    shipping_address JSONB,
    notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 500),
    payment_due_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT orders_buyer_seller_diff CHECK (buyer_id <> seller_id),
    CONSTRAINT orders_total_adds_up
        CHECK (total_minor = subtotal_minor + delivery_fee_minor + buyer_fee_minor)
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
-- An accepted offer can be checked out once
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_one_per_offer
    ON public.orders(offer_id) WHERE offer_id IS NOT NULL AND status <> 'cancelled';

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.orders FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.orders TO authenticated;

DROP POLICY IF EXISTS "Participants read own orders" ON public.orders;
CREATE POLICY "Participants read own orders" ON public.orders
    FOR SELECT TO authenticated
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_permission('orders.read'));

-- The handover code is the buyer's alone; the seller never reads it, they are told it.
CREATE TABLE IF NOT EXISTS public.order_handover_codes (
    order_id UUID PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_handover_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_handover_codes FROM PUBLIC, anon, authenticated;
GRANT SELECT (order_id, buyer_id, code, created_at) ON public.order_handover_codes TO authenticated;
DROP POLICY IF EXISTS "Buyer reads own handover code" ON public.order_handover_codes;
CREATE POLICY "Buyer reads own handover code" ON public.order_handover_codes
    FOR SELECT TO authenticated USING (auth.uid() = buyer_id);

-- ---------------------------------------------------------------------------
-- 2. Payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL CHECK (provider IN ('paystack', 'flutterwave')),
    reference TEXT UNIQUE NOT NULL,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(10) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'successful', 'failed', 'abandoned', 'refund_due', 'refunded')),
    provider_transaction_id TEXT,
    provider_channel TEXT,
    failure_reason TEXT,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
-- An order is paid at most once
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_one_success
    ON public.payments(order_id) WHERE status = 'successful';

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.payments TO authenticated;

DROP POLICY IF EXISTS "Participants read payments" ON public.payments;
CREATE POLICY "Participants read payments" ON public.payments
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = payments.order_id
          AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR public.has_permission('payments.read'))
    ));

-- ---------------------------------------------------------------------------
-- 3. Ledger: a record of where each order's money stands with the provider.
--    Servilist does not hold funds; 'provider_escrow' is money held by the
--    licensed payment provider.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    account_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    account_type TEXT NOT NULL
        CHECK (account_type IN ('buyer_payment', 'provider_escrow', 'seller_payable', 'platform_fees')),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(10) NOT NULL,
    reference TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_order ON public.ledger_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON public.ledger_entries(account_id);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ledger_entries FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ledger_entries TO authenticated;

DROP POLICY IF EXISTS "Members read own ledger entries" ON public.ledger_entries;
CREATE POLICY "Members read own ledger entries" ON public.ledger_entries
    FOR SELECT TO authenticated
    USING (auth.uid() = account_id OR public.has_permission('payments.read'));

-- ---------------------------------------------------------------------------
-- 4. create_order
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order(
    p_listing_id UUID DEFAULT NULL,
    p_offer_id UUID DEFAULT NULL,
    p_fulfillment_type TEXT DEFAULT 'pickup',
    p_shipping_address JSONB DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_listing public.listings;
    v_offer public.offers;
    v_subtotal BIGINT;
    v_fee BIGINT;
    v_commission BIGINT;
    v_window INT;
    v_held INT;
    v_id UUID;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to place an order';
    END IF;
    IF num_nonnulls(p_listing_id, p_offer_id) <> 1 THEN
        RAISE EXCEPTION 'An order starts from one listing or one accepted offer';
    END IF;
    IF p_fulfillment_type NOT IN ('delivery', 'pickup') THEN
        RAISE EXCEPTION 'Choose delivery or pickup';
    END IF;
    IF p_fulfillment_type = 'delivery' AND p_shipping_address IS NULL THEN
        RAISE EXCEPTION 'A delivery address is required';
    END IF;

    IF p_offer_id IS NOT NULL THEN
        SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
        IF NOT FOUND OR v_offer.buyer_id <> v_uid THEN
            RAISE EXCEPTION 'Offer not found';
        END IF;
        IF v_offer.status <> 'accepted' THEN
            RAISE EXCEPTION 'Only an accepted offer can be checked out';
        END IF;
        p_listing_id := v_offer.listing_id;
    END IF;

    -- Lock the listing so two buyers cannot take the last item at once
    SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR UPDATE;
    IF NOT FOUND OR v_listing.status <> 'active' THEN
        RAISE EXCEPTION 'This listing is not available';
    END IF;
    IF v_listing.seller_id = v_uid THEN
        RAISE EXCEPTION 'You cannot buy your own listing';
    END IF;
    IF v_listing.format = 'auction' OR v_listing.listing_type = 'auction' THEN
        RAISE EXCEPTION 'Auction items are bought by winning the auction';
    END IF;

    SELECT value_int INTO v_window FROM public.platform_settings WHERE key = 'order_payment_window_minutes';
    v_window := COALESCE(v_window, 30);

    -- Unpaid orders past their payment window no longer hold the item
    UPDATE public.orders SET status = 'cancelled', updated_at = now()
     WHERE listing_id = v_listing.id AND status = 'pending_payment' AND payment_due_at <= now();

    SELECT COALESCE(sum(quantity), 0) INTO v_held FROM public.orders
     WHERE listing_id = v_listing.id
       AND status IN ('pending_payment', 'in_escrow', 'dispatched', 'delivered', 'disputed');
    IF v_held >= COALESCE(v_listing.quantity, 1) THEN
        RAISE EXCEPTION 'Another buyer is completing this purchase. Try again shortly.';
    END IF;

    v_subtotal := CASE WHEN p_offer_id IS NOT NULL THEN v_offer.amount_minor ELSE v_listing.amount_minor END;
    IF v_subtotal IS NULL OR v_subtotal <= 0 THEN
        RAISE EXCEPTION 'This listing has no price';
    END IF;
    SELECT (v_subtotal * value_int) / 10000 INTO v_fee
      FROM public.platform_settings WHERE key = 'buyer_protection_fee_bps';
    SELECT (v_subtotal * value_int) / 10000 INTO v_commission
      FROM public.platform_settings WHERE key = 'seller_commission_bps';
    v_fee := COALESCE(v_fee, 0);
    v_commission := COALESCE(v_commission, 0);

    INSERT INTO public.orders (order_number, buyer_id, seller_id, listing_id, offer_id, title, currency,
                               subtotal_minor, delivery_fee_minor, buyer_fee_minor, seller_commission_minor,
                               total_minor, fulfillment_type, shipping_address, notes, payment_due_at)
    VALUES ('SV-' || to_char(now(), 'YYMM') || '-' || nextval('public.order_number_seq'),
            v_uid, v_listing.seller_id, v_listing.id, p_offer_id, v_listing.title, v_listing.currency,
            v_subtotal, 0, v_fee, v_commission, v_subtotal + v_fee,
            p_fulfillment_type,
            CASE WHEN p_fulfillment_type = 'delivery' THEN p_shipping_address END,
            NULLIF(btrim(p_notes), ''),
            now() + make_interval(mins => v_window))
    RETURNING id INTO v_id;

    PERFORM public.write_audit_log('order.created', 'order', v_id::text,
        jsonb_build_object('listing_id', v_listing.id, 'offer_id', p_offer_id,
                           'total_minor', v_subtotal + v_fee, 'currency', v_listing.currency));
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. start_payment: one open attempt per order, for the order's exact total
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_payment(p_order_id UUID, p_provider TEXT)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_order public.orders;
    v_payment public.payments;
BEGIN
    IF v_uid IS NULL OR NOT public.is_active_member() THEN
        RAISE EXCEPTION 'Sign in with an active account to pay';
    END IF;
    IF p_provider IS NULL OR p_provider NOT IN ('paystack', 'flutterwave') THEN
        RAISE EXCEPTION 'Unknown payment provider';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND OR v_order.buyer_id <> v_uid THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    IF v_order.status <> 'pending_payment' THEN
        RAISE EXCEPTION 'This order is not waiting for payment';
    END IF;
    IF v_order.payment_due_at <= now() THEN
        RAISE EXCEPTION 'This order has expired. Please order again.';
    END IF;

    UPDATE public.payments SET status = 'abandoned', updated_at = now()
     WHERE order_id = v_order.id AND status = 'pending';

    INSERT INTO public.payments (order_id, provider, reference, amount_minor, currency)
    VALUES (v_order.id, p_provider,
            'sv_' || replace(v_order.id::text, '-', '') || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
            v_order.total_minor, v_order.currency)
    RETURNING * INTO v_payment;
    RETURN v_payment;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. confirm_payment / fail_payment: server only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_payment(
    p_server_secret TEXT,
    p_reference TEXT,
    p_provider TEXT,
    p_amount_minor BIGINT,
    p_currency TEXT,
    p_provider_transaction_id TEXT DEFAULT NULL,
    p_channel TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_payment public.payments;
    v_order public.orders;
    v_listing public.listings;
    v_sold INT;
BEGIN
    PERFORM private.require_server_secret('payments', p_server_secret);

    SELECT * INTO v_payment FROM public.payments WHERE reference = p_reference FOR UPDATE;
    IF NOT FOUND OR v_payment.provider <> p_provider THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;
    IF v_payment.status = 'successful' THEN
        RETURN 'already_confirmed';
    END IF;
    -- What the provider charged must be exactly what the order costs
    IF p_amount_minor IS DISTINCT FROM v_payment.amount_minor
       OR upper(p_currency) IS DISTINCT FROM upper(v_payment.currency) THEN
        UPDATE public.payments
           SET status = 'refund_due', failure_reason = 'Amount or currency did not match the order',
               provider_transaction_id = p_provider_transaction_id, updated_at = now()
         WHERE id = v_payment.id;
        PERFORM public.write_audit_log('payment.amount_mismatch', 'payment', v_payment.id::text,
            jsonb_build_object('charged_minor', p_amount_minor, 'charged_currency', p_currency));
        RETURN 'amount_mismatch';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = v_payment.order_id FOR UPDATE;
    IF EXISTS (SELECT 1 FROM public.payments WHERE order_id = v_order.id AND status = 'successful') THEN
        -- A second charge for an order that is already paid: record it for refund
        UPDATE public.payments
           SET status = 'refund_due', failure_reason = 'Duplicate charge for a paid order', confirmed_at = now(),
               provider_transaction_id = p_provider_transaction_id, provider_channel = p_channel, updated_at = now()
         WHERE id = v_payment.id;
        PERFORM public.write_audit_log('payment.duplicate', 'payment', v_payment.id::text,
            jsonb_build_object('order_id', v_order.id, 'reference', p_reference));
        RETURN 'duplicate_refund_due';
    END IF;

    UPDATE public.payments
       SET status = 'successful', confirmed_at = now(), provider_transaction_id = p_provider_transaction_id,
           provider_channel = p_channel, updated_at = now()
     WHERE id = v_payment.id;

    INSERT INTO public.ledger_entries (order_id, account_id, account_type, entry_type, amount_minor, currency, reference, description)
    VALUES (v_order.id, v_order.buyer_id, 'buyer_payment', 'debit', v_payment.amount_minor, v_payment.currency, p_reference,
            'Buyer paid for order ' || v_order.order_number),
           (v_order.id, NULL, 'provider_escrow', 'credit', v_payment.amount_minor, v_payment.currency, p_reference,
            'Held by ' || p_provider || ' for order ' || v_order.order_number);

    -- Paid after the order was cancelled or expired: keep the money safe and flag it
    IF v_order.status <> 'pending_payment' THEN
        UPDATE public.orders SET status = 'disputed', paid_at = now(), updated_at = now(),
               notes = concat_ws(' ', notes, '[Paid after the order closed: review for refund]')
         WHERE id = v_order.id;
        PERFORM public.write_audit_log('order.paid_after_close', 'order', v_order.id::text,
            jsonb_build_object('reference', p_reference));
        RETURN 'paid_after_close';
    END IF;

    UPDATE public.orders SET status = 'in_escrow', paid_at = now(), updated_at = now() WHERE id = v_order.id;

    INSERT INTO public.order_handover_codes (order_id, buyer_id, code)
    VALUES (v_order.id, v_order.buyer_id, lpad(((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 7))::bit(28)::int) % 1000000)::text, 6, '0'))
    ON CONFLICT (order_id) DO NOTHING;

    -- Take the listing off the market once every unit is paid for
    SELECT * INTO v_listing FROM public.listings WHERE id = v_order.listing_id FOR UPDATE;
    IF FOUND THEN
        SELECT COALESCE(sum(quantity), 0) INTO v_sold FROM public.orders
         WHERE listing_id = v_listing.id AND status IN ('in_escrow', 'dispatched', 'delivered', 'completed', 'disputed');
        IF v_sold >= COALESCE(v_listing.quantity, 1) AND v_listing.status = 'active' THEN
            UPDATE public.listings SET status = 'sold' WHERE id = v_listing.id;
        END IF;
    END IF;

    PERFORM public.write_audit_log('order.paid', 'order', v_order.id::text,
        jsonb_build_object('reference', p_reference, 'provider', p_provider, 'amount_minor', v_payment.amount_minor));
    RETURN 'confirmed';
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_payment(p_server_secret TEXT, p_reference TEXT, p_reason TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    PERFORM private.require_server_secret('payments', p_server_secret);
    UPDATE public.payments
       SET status = 'failed', failure_reason = left(COALESCE(p_reason, 'Declined by the provider'), 300), updated_at = now()
     WHERE reference = p_reference AND status = 'pending';
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. After payment: seller stages, handover code, cancellation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_order_stage(p_order_id UUID, p_stage TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_order public.orders;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND OR v_uid IS NULL OR v_order.seller_id <> v_uid THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    IF NOT ((p_stage = 'dispatched' AND v_order.status = 'in_escrow')
         OR (p_stage = 'delivered' AND v_order.status IN ('in_escrow', 'dispatched'))) THEN
        RAISE EXCEPTION 'This order cannot move to that stage';
    END IF;
    UPDATE public.orders SET status = p_stage, updated_at = now() WHERE id = v_order.id;
    PERFORM public.write_audit_log('order.' || p_stage, 'order', v_order.id::text, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_order_with_code(p_order_id UUID, p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_order public.orders;
    v_code public.order_handover_codes;
    v_payout BIGINT;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND OR v_uid IS NULL OR v_order.seller_id <> v_uid THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    IF v_order.status NOT IN ('in_escrow', 'dispatched', 'delivered') THEN
        RAISE EXCEPTION 'This order is not awaiting handover';
    END IF;

    SELECT * INTO v_code FROM public.order_handover_codes WHERE order_id = v_order.id FOR UPDATE;
    IF NOT FOUND OR v_code.failed_attempts >= 5 THEN
        RAISE EXCEPTION 'Too many wrong codes. Contact support to release this order.';
    END IF;
    IF p_code IS NULL OR btrim(p_code) <> v_code.code THEN
        UPDATE public.order_handover_codes SET failed_attempts = failed_attempts + 1 WHERE order_id = v_order.id;
        RETURN false;
    END IF;

    UPDATE public.orders SET status = 'completed', completed_at = now(), updated_at = now() WHERE id = v_order.id;

    v_payout := v_order.subtotal_minor + v_order.delivery_fee_minor - v_order.seller_commission_minor;
    INSERT INTO public.ledger_entries (order_id, account_id, account_type, entry_type, amount_minor, currency, description)
    VALUES (v_order.id, NULL, 'provider_escrow', 'debit', v_order.total_minor, v_order.currency,
            'Released for order ' || v_order.order_number),
           (v_order.id, v_order.seller_id, 'seller_payable', 'credit', v_payout, v_order.currency,
            'Due to seller for order ' || v_order.order_number);
    IF v_order.total_minor - v_payout > 0 THEN
        INSERT INTO public.ledger_entries (order_id, account_id, account_type, entry_type, amount_minor, currency, description)
        VALUES (v_order.id, NULL, 'platform_fees', 'credit', v_order.total_minor - v_payout, v_order.currency,
                'Fees for order ' || v_order.order_number);
    END IF;

    PERFORM public.write_audit_log('order.completed', 'order', v_order.id::text,
        jsonb_build_object('seller_payable_minor', v_payout));
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_order public.orders;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND OR v_uid IS NULL OR v_order.buyer_id <> v_uid THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    IF v_order.status <> 'pending_payment' THEN
        RAISE EXCEPTION 'Only an unpaid order can be cancelled here';
    END IF;
    UPDATE public.orders SET status = 'cancelled', updated_at = now() WHERE id = v_order.id;
    UPDATE public.payments SET status = 'abandoned', updated_at = now()
     WHERE order_id = v_order.id AND status = 'pending';
    PERFORM public.write_audit_log('order.cancelled', 'order', v_order.id::text, '{}'::jsonb);
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Who may call what
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.create_order(UUID, UUID, TEXT, JSONB, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.start_payment(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_order_stage(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_order_with_code(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_order(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order(UUID, UUID, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_payment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_order_stage(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_order_with_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order(UUID) TO authenticated;

-- The payment provider's webhook arrives without a member session, so these two
-- are callable by anyone and guarded by the server secret instead.
REVOKE ALL ON FUNCTION public.confirm_payment(TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_payment(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_payment(TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_payment(TEXT, TEXT, TEXT) TO anon, authenticated;
