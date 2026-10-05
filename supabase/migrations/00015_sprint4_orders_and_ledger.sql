-- Migration 00015: Sprint 4 Orders, Payments, Escrow and Double-entry Ledger
-- Complies with Master Build Specification sections 9, 10, 11, 24, 25, 26, 44, 45, 46, 74, 75

-- ---------------------------------------------------------------------------
-- 1. ORDERS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),
    delivery_fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (delivery_fee_minor >= 0),
    escrow_fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (escrow_fee_minor >= 0),
    total_minor BIGINT NOT NULL CHECK (total_minor > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending_payment'
        CHECK (status IN (
            'pending_payment',
            'payment_confirmed',
            'in_escrow',
            'processing',
            'dispatched',
            'delivered',
            'completed',
            'cancelled',
            'disputed',
            'refunded'
        )),
    fulfillment_type VARCHAR(20) NOT NULL DEFAULT 'delivery'
        CHECK (fulfillment_type IN ('delivery', 'pickup')),
    shipping_address JSONB,
    verification_otp_code VARCHAR(10) NOT NULL,
    verification_otp_hash TEXT NOT NULL,
    otp_verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT orders_buyer_seller_diff CHECK (buyer_id <> seller_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;

DROP POLICY IF EXISTS "Participants read own orders" ON public.orders;
CREATE POLICY "Participants read own orders" ON public.orders
    FOR SELECT TO authenticated
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_permission('orders.read'));

DROP POLICY IF EXISTS "Active buyers create orders" ON public.orders;
CREATE POLICY "Active buyers create orders" ON public.orders
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = buyer_id AND public.is_active_member());

DROP POLICY IF EXISTS "Participants or staff update orders" ON public.orders;
CREATE POLICY "Participants or staff update orders" ON public.orders
    FOR UPDATE TO authenticated
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_permission('orders.manage'))
    WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_permission('orders.manage'));

-- ---------------------------------------------------------------------------
-- 2. ORDER ITEMS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price_minor BIGINT NOT NULL CHECK (unit_price_minor >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.order_items TO authenticated;

DROP POLICY IF EXISTS "Read items for accessible orders" ON public.order_items;
CREATE POLICY "Read items for accessible orders" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
              AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR public.has_permission('orders.read'))
        )
    );

DROP POLICY IF EXISTS "Insert items for owned order" ON public.order_items;
CREATE POLICY "Insert items for owned order" ON public.order_items
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id AND o.buyer_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- 3. PAYMENTS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    reference VARCHAR(150) UNIQUE NOT NULL,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    status VARCHAR(40) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'successful', 'failed', 'refunded')),
    provider_channel VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;

DROP POLICY IF EXISTS "Participants read payments" ON public.payments;
CREATE POLICY "Participants read payments" ON public.payments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id
              AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR public.has_permission('payments.read'))
        )
    );

DROP POLICY IF EXISTS "Buyers initiate payments" ON public.payments;
CREATE POLICY "Buyers initiate payments" ON public.payments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id AND o.buyer_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- 4. DOUBLE-ENTRY ESCROW LEDGER (Section 11, 46)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    account_type VARCHAR(50) NOT NULL
        CHECK (account_type IN (
            'buyer_wallet',
            'seller_escrow_payable',
            'platform_escrow_holding',
            'platform_commission',
            'dispute_reserve'
        )),
    entry_type VARCHAR(20) NOT NULL
        CHECK (entry_type IN ('debit', 'credit')),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    reference VARCHAR(150),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_order ON public.ledger_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON public.ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON public.ledger_entries(account_type);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.ledger_entries TO authenticated;

DROP POLICY IF EXISTS "Users read own ledger entries or staff read all" ON public.ledger_entries;
CREATE POLICY "Users read own ledger entries or staff read all" ON public.ledger_entries
    FOR SELECT TO authenticated
    USING (auth.uid() = account_id OR public.has_permission('payments.read'));
