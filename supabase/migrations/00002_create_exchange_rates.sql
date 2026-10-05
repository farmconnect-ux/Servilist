-- Migration 00002: Exchange Rates Table
-- Stores mid-market exchange rates between base USD and African currencies
-- Conversion is for display only; all prices are stored in native currency minor units

CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    target_currency VARCHAR(3) NOT NULL,
    rate NUMERIC(16, 6) NOT NULL CHECK (rate > 0),
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exchange_rate_pair UNIQUE(base_currency, target_currency)
);

-- Seed baseline rates for African currencies and USD
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, fetched_at)
VALUES
    ('USD', 'USD', 1.0, now()),
    ('USD', 'NGN', 1500.0, now()),
    ('USD', 'KES', 130.0, now()),
    ('USD', 'GHS', 15.5, now()),
    ('USD', 'ZAR', 18.5, now()),
    ('USD', 'EGP', 48.0, now()),
    ('USD', 'RWF', 1350.0, now()),
    ('USD', 'TZS', 2600.0, now()),
    ('USD', 'UGX', 3700.0, now()),
    ('USD', 'XOF', 600.0, now())
ON CONFLICT (base_currency, target_currency)
DO UPDATE SET rate = EXCLUDED.rate, fetched_at = EXCLUDED.fetched_at;
