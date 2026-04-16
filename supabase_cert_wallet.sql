-- ============================================================
-- Regestra Certificate Wallet Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add owner_id to certificates (who currently holds the cert)
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill: existing certs owned by the buyer if they have a profile,
-- otherwise owned by the artist
UPDATE public.certificates c
SET owner_id = COALESCE(c.buyer_profile_id, c.artist_id)
WHERE owner_id IS NULL;

-- 2. Transfer history table
CREATE TABLE IF NOT EXISTS public.cert_transfers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_id           uuid NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  from_user_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_user_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  from_name         text,
  to_name           text NOT NULL,
  to_username       text,
  transfer_type     text NOT NULL DEFAULT 'transfer', -- 'sale' | 'transfer' | 'gift' | 'external'
  sale_price        numeric(10,2),
  sale_date         date NOT NULL DEFAULT CURRENT_DATE,
  artwork_medium    text,
  artwork_dimensions text,
  artwork_year      text,
  artwork_description text,
  note              text,
  transferred_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cert_transfers_cert_id_idx ON public.cert_transfers(cert_id);
CREATE INDEX IF NOT EXISTS cert_transfers_from_user_idx ON public.cert_transfers(from_user_id);
CREATE INDEX IF NOT EXISTS cert_transfers_to_user_idx ON public.cert_transfers(to_user_id);

-- 3. RLS on cert_transfers
ALTER TABLE public.cert_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_cert_transfers" ON public.cert_transfers;
CREATE POLICY "public_read_cert_transfers"
  ON public.cert_transfers FOR SELECT USING (true);

DROP POLICY IF EXISTS "auth_insert_cert_transfers" ON public.cert_transfers;
CREATE POLICY "auth_insert_cert_transfers"
  ON public.cert_transfers FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- 4. RLS update on certificates — allow owner to update owner_id
DROP POLICY IF EXISTS "owner_transfer_certificate" ON public.certificates;
CREATE POLICY "owner_transfer_certificate"
  ON public.certificates FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = artist_id);

-- 5. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cert_transfers;

SELECT 'Certificate wallet migration complete' as result;
