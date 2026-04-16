-- ============================================================
-- Regestra Artist Verification System
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add verification columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified_artist boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by text;

-- 2. Artist verification requests table
CREATE TABLE IF NOT EXISTS public.artist_verification_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_legal_name   text NOT NULL,
  website_url       text,
  instagram_url     text,
  portfolio_url     text,
  statement         text NOT NULL,
  status            text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  submitted_at      timestamptz NOT NULL DEFAULT now(),
  reviewed_at       timestamptz,
  reviewed_by       text,
  rejection_reason  text,
  UNIQUE(user_id)   -- one active request per user
);

CREATE INDEX IF NOT EXISTS avr_user_id_idx ON public.artist_verification_requests(user_id);
CREATE INDEX IF NOT EXISTS avr_status_idx  ON public.artist_verification_requests(status);

-- 3. RLS
ALTER TABLE public.artist_verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own request
DROP POLICY IF EXISTS "user_read_own_avr" ON public.artist_verification_requests;
CREATE POLICY "user_read_own_avr"
  ON public.artist_verification_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own request
DROP POLICY IF EXISTS "user_insert_avr" ON public.artist_verification_requests;
CREATE POLICY "user_insert_avr"
  ON public.artist_verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending request
DROP POLICY IF EXISTS "user_update_own_avr" ON public.artist_verification_requests;
CREATE POLICY "user_update_own_avr"
  ON public.artist_verification_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admin function to approve a verification request
CREATE OR REPLACE FUNCTION public.approve_artist_verification(
  p_request_id uuid,
  p_admin_email text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.artist_verification_requests
  WHERE id = p_request_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Update request status
  UPDATE public.artist_verification_requests
  SET status = 'approved', reviewed_at = now(), reviewed_by = p_admin_email
  WHERE id = p_request_id;

  -- Mark profile as verified
  UPDATE public.profiles
  SET is_verified_artist = true, verified_at = now(), verified_by = p_admin_email
  WHERE id = v_user_id;
END;
$$;

-- Admin function to reject a verification request
CREATE OR REPLACE FUNCTION public.reject_artist_verification(
  p_request_id uuid,
  p_admin_email text,
  p_reason text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.artist_verification_requests
  SET
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = p_admin_email,
    rejection_reason = p_reason
  WHERE id = p_request_id;
END;
$$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.artist_verification_requests;

SELECT 'Artist verification system migration complete' as result;
