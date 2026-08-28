ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS capi_purchase_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS capi_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS capi_last_error text;