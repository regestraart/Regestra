import { supabase } from '../lib/supabase';

export type SubscriptionTier = 'starter' | 'creator' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  reg_payment_tx?: string;
  paid_with_reg: boolean;
  certs_issued_this_period: number;
  period_start: string;
  period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  trial_end?: string;
  created_at: string;
}

export interface TierLimits {
  can_issue_certs: boolean;
  can_anchor_blockchain: boolean;
  can_view_analytics: boolean;
  max_artwork_listings: number;
}

// Pricing
export const TIER_PRICING = {
  starter: { usd_monthly: 0,   reg_monthly: 0,   label: 'Starter', },
  creator: { usd_monthly: 10,  reg_monthly: 8,   label: 'Creator', },
  pro:     { usd_monthly: 25,  reg_monthly: 20,  label: 'Pro',     },
} as const;

export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  starter: [
    'Basic artist profile',
    'Community feed & discovery',
    '10 artwork listings',
    '5 certificate issuances per month',
    'Resale royalty tracking',
    'Discount when paying with REG',
  ],
  creator: [
    'Verified Artist badge',
    'Basic artist profile',
    'Community feed & discovery',
    '50 artwork listings',
    '25 certificate issuances per month',
    'Analytics dashboard',
    'Resale royalty tracking',
    'Discount when paying with REG',
  ],
  pro: [
    'Verified Artist badge',
    'Basic artist profile',
    'Community feed & discovery',
    '100 artwork listings',
    '50 certificate issuances per month',
    'Analytics dashboard',
    'Automatic copyright registration',
    'Resale royalty tracking',
    'Discount when paying with REG',
  ],
};

export const subscriptionDb = {
  async get(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Subscription | null;
  },

  async getLimits(userId: string): Promise<TierLimits> {
    const sub = await this.get(userId);
    const tier = sub?.tier ?? 'starter';
    return {
      can_issue_certs:       true, // all tiers can issue certs
      can_anchor_blockchain: tier === 'pro',
      can_view_analytics:    tier === 'creator' || tier === 'pro',
      max_artwork_listings:  tier === 'starter' ? 10 : tier === 'creator' ? 50 : 100,
    };
  },

  // Called after successful Stripe payment
  async upgrade(userId: string, tier: SubscriptionTier, stripeData?: {
    stripe_customer_id: string;
    stripe_subscription_id: string;
    stripe_price_id: string;
  }): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        tier,
        status: 'active',
        ...stripeData,
        paid_with_reg: false,
      })
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as Subscription;
  },

  // Called after REG token payment confirmed on-chain
  async upgradeWithReg(userId: string, tier: SubscriptionTier, regTxHash: string): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        tier,
        status: 'active',
        paid_with_reg: true,
        reg_payment_tx: regTxHash,
      })
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as Subscription;
  },

  async cancel(userId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        status: 'active', // remains active until period ends
      })
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  },

  async incrementCertCount(userId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_cert_count', { p_user_id: userId });
    // Fallback if RPC doesn't exist yet
    if (error) {
      const { error: e2 } = await supabase
        .from('subscriptions')
        .update({ certs_issued_this_period: supabase.rpc('certs_issued_this_period') as any })
        .eq('user_id', userId);
      // Silent fail — cert was issued, tracking is secondary
    }
  },
};
