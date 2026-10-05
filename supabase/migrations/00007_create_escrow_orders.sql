-- Migration 00007: Escrow Orders Table
-- Tracks escrow transactions released by buyer Handover OTP
-- Servilist uses split-payments / licensed gateways (Paystack/Flutterwave/M-Pesa) and never holds customer funds

CREATE TABLE IF NOT EXISTS public.escrow_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    request_id UUID REFERENCES public.buyer_requests(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    order_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    safe_zone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'funded' CHECK (
        status IN ('funded', 'inspection', 'otp_verified', 'released', 'disputed', 'refunded')
    ),
    otp_code VARCHAR(10) NOT NULL,
    funded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_orders_code ON public.escrow_orders(order_code);
CREATE INDEX IF NOT EXISTS idx_escrow_orders_buyer ON public.escrow_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_orders_seller ON public.escrow_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_orders_status ON public.escrow_orders(status);

DROP TRIGGER IF EXISTS set_escrow_orders_updated_at ON public.escrow_orders;
CREATE TRIGGER set_escrow_orders_updated_at
    BEFORE UPDATE ON public.escrow_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
