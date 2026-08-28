CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  amount numeric NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  kit_id text,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  customer_document text NOT NULL,
  address_cep text NOT NULL,
  address_street text NOT NULL,
  address_number text NOT NULL,
  address_complement text,
  address_neighborhood text NOT NULL,
  address_city text NOT NULL,
  address_state text NOT NULL,
  pix_qrcode text,
  pix_qrcode_image text,
  pix_copy_paste text,
  expires_at timestamptz,
  paid_at timestamptz,
  fbp text,
  fbc text,
  fbclid text,
  event_source_url text,
  client_ip_address text,
  client_user_agent text,
  capi_purchase_sent_at timestamptz,
  capi_attempts integer NOT NULL DEFAULT 0,
  capi_last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX orders_transaction_id_idx ON public.orders (transaction_id);
CREATE INDEX orders_created_at_idx ON public.orders (created_at DESC);
