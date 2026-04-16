-- ============================================================
-- Regestra: Certificate of Authenticity
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  id            uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_number   text NOT NULL UNIQUE,           -- human-readable: RG-2025-XXXXXX
  artwork_id    uuid NOT NULL REFERENCES public.artworks ON DELETE RESTRICT,
  artist_id     uuid NOT NULL REFERENCES public.profiles ON DELETE RESTRICT,
  artwork_title text NOT NULL,
  artwork_image_url text,
  artwork_description text,
  artwork_medium text,
  artwork_dimensions text,
  artwork_year  text,
  sale_price    numeric(10,2),
  sale_date     date NOT NULL DEFAULT CURRENT_DATE,

  -- Buyer info (on-platform or manually entered)
  buyer_profile_id uuid REFERENCES public.profiles ON DELETE SET NULL,
  buyer_name    text NOT NULL,
  buyer_email   text,

  -- Artist snapshot at time of cert
  artist_name   text NOT NULL,
  artist_username text,

  -- Integrity
  cert_hash     text NOT NULL,                  -- SHA-256 of canonical cert payload
  is_revoked    boolean NOT NULL DEFAULT false,
  revoked_at    timestamp with time zone,
  revoked_reason text,

  -- Blockchain anchoring (nullable — filled when anchored)
  blockchain_network  text,                     -- e.g. 'polygon-amoy', 'polygon'
  blockchain_tx_hash  text,
  blockchain_anchored_at timestamp with time zone,

  -- Tier
  tier          text NOT NULL DEFAULT 'basic',  -- 'basic' | 'blockchain'

  created_at    timestamp with time zone NOT NULL DEFAULT now(),
  updated_at    timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS certificates_artwork_id_idx  ON public.certificates (artwork_id);
CREATE INDEX IF NOT EXISTS certificates_artist_id_idx   ON public.certificates (artist_id);
CREATE INDEX IF NOT EXISTS certificates_cert_number_idx ON public.certificates (cert_number);
CREATE INDEX IF NOT EXISTS certificates_buyer_email_idx ON public.certificates (buyer_email);

-- 3. Update trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS certificates_updated_at ON public.certificates;
CREATE TRIGGER certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Row Level Security
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Artists can read their own certs
CREATE POLICY "artists_read_own_certs"
  ON public.certificates FOR SELECT
  USING (auth.uid() = artist_id);

-- Buyers can read certs where they are buyer
CREATE POLICY "buyers_read_own_certs"
  ON public.certificates FOR SELECT
  USING (auth.uid() = buyer_profile_id);

-- Public verification: anyone can read by cert_number (for verify page)
CREATE POLICY "public_verify_by_cert_number"
  ON public.certificates FOR SELECT
  USING (true);   -- read-only; write is artist-only below

-- Artists can insert certs for their own artworks
CREATE POLICY "artists_insert_cert"
  ON public.certificates FOR INSERT
  WITH CHECK (auth.uid() = artist_id);

-- Artists can update (revoke) their own certs
CREATE POLICY "artists_update_cert"
  ON public.certificates FOR UPDATE
  USING (auth.uid() = artist_id);

-- 5. Cert number generator function
-- Generates RG-YYYY-XXXXXX (6 random uppercase alphanumeric chars)
CREATE OR REPLACE FUNCTION public.generate_cert_number()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i      int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN 'RG-' || to_char(now(), 'YYYY') || '-' || result;
END;
$$;

-- 6. Admin metrics patch — add cert counts to existing admin_metrics RPC if it exists
-- (safe no-op if function doesn't exist yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'admin_metrics'
  ) THEN
    -- Drop and recreate is handled by your admin migration separately
    RAISE NOTICE 'admin_metrics exists — add cert_count manually if needed';
  END IF;
END $$;
