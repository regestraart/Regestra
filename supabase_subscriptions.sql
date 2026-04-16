-- ============================================================
-- Regestra: Subscription Tiers
-- Run in Supabase SQL Editor after supabase_certificates.sql
-- ============================================================

-- 1. Subscription tier enum
DO $$ BEGIN
  CREATE TYPE public.subscription_tier AS ENUM ('starter', 'creator', 'pro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,

  tier                  public.subscription_tier NOT NULL DEFAULT 'starter',
  status                public.subscription_status NOT NULL DEFAULT 'active',

  -- Stripe (populate when Stripe is integrated)
  stripe_customer_id    text,
  stripe_subscription_id text,
  stripe_price_id       text,

  -- REG token payment alternative
  reg_payment_tx        text,     -- Solana tx hash if paid in REG
  paid_with_reg         boolean NOT NULL DEFAULT false,

  -- Cert usage tracking (for pay-per-cert metering if needed)
  certs_issued_this_period integer NOT NULL DEFAULT 0,
  period_start          timestamp with time zone NOT NULL DEFAULT date_trunc('month', now()),
  period_end            timestamp with time zone NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),

  current_period_start  timestamp with time zone,
  current_period_end    timestamp with time zone,
  cancel_at_period_end  boolean NOT NULL DEFAULT false,
  canceled_at           timestamp with time zone,
  trial_end             timestamp with time zone,

  created_at            timestamp with time zone NOT NULL DEFAULT now(),
  updated_at            timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_idx ON public.subscriptions (stripe_customer_id);

-- 3. Trigger
DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Auto-provision a starter subscription when a profile is created
CREATE OR REPLACE FUNCTION public.provision_starter_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'starter', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_provision_subscription ON public.profiles;
CREATE TRIGGER auto_provision_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.provision_starter_subscription();

-- 6. Backfill starter subscriptions for existing users
INSERT INTO public.subscriptions (user_id, tier, status)
SELECT id, 'starter', 'active'
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- 7. Tier limits view (handy for application queries)
CREATE OR REPLACE VIEW public.subscription_limits AS
SELECT
  user_id,
  tier,
  status,
  CASE tier
    WHEN 'starter' THEN false
    WHEN 'creator' THEN true
    WHEN 'pro'     THEN true
  END AS can_issue_certs,
  CASE tier
    WHEN 'starter' THEN false
    WHEN 'creator' THEN false
    WHEN 'pro'     THEN true
  END AS can_anchor_blockchain,
  CASE tier
    WHEN 'starter' THEN false
    WHEN 'creator' THEN true
    WHEN 'pro'     THEN true
  END AS can_view_analytics,
  CASE tier
    WHEN 'starter' THEN 5
    WHEN 'creator' THEN 999999
    WHEN 'pro'     THEN 999999
  END AS max_artwork_listings,
  paid_with_reg,
  reg_payment_tx
FROM public.subscriptions;
