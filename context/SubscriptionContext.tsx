import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { supabase } from '../lib/supabase';
import { TIER_FEATURES, TIER_PRICING, SubscriptionTier } from '../services/subscriptions';

// Dev emails always get Pro — add more as needed
const DEV_PRO_EMAILS = ['regestradev@gmail.com'];

// Monthly cert limits per tier
export const CERT_LIMITS: Record<SubscriptionTier, number> = {
  starter: 5,
  creator: 25,
  pro:     50,
};

// Artwork listing limits per tier
export const LISTING_LIMITS: Record<SubscriptionTier, number> = {
  starter: 10,
  creator: 50,
  pro:     100,
};

export interface TierLimits {
  can_issue_certs: boolean;
  can_anchor_blockchain: boolean;
  can_view_analytics: boolean;
  max_artwork_listings: number;
}

function limitsForTier(tier: SubscriptionTier): TierLimits {
  return {
    can_issue_certs:       true,
    can_anchor_blockchain: tier === 'pro',
    can_view_analytics:    tier === 'creator' || tier === 'pro',
    max_artwork_listings:  LISTING_LIMITS[tier],
  };
}

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  isActive: boolean;
  loading: boolean;
  canIssueCerts: boolean;
  canAnchorBlockchain: boolean;
  canViewAnalytics: boolean;
  isCreatorOrAbove: boolean;
  isPro: boolean;
  isDevAccount: boolean;
  // Usage
  certsIssuedThisMonth: number;
  artworkCount: number;
  maxCerts: number;
  maxListings: number;
  certsRemaining: number;
  listingsRemaining: number;
  atCertLimit: boolean;
  atListingLimit: boolean;
  refresh: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  tier: 'starter',
  isActive: false,
  loading: true,
  canIssueCerts: false,
  canAnchorBlockchain: false,
  canViewAnalytics: false,
  isCreatorOrAbove: false,
  isPro: false,
  isDevAccount: false,
  certsIssuedThisMonth: 0,
  artworkCount: 0,
  maxCerts: 5,
  maxListings: 10,
  certsRemaining: 5,
  listingsRemaining: 10,
  atCertLimit: false,
  atListingLimit: false,
  refresh: () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useUser();
  const [tier, setTier] = useState<SubscriptionTier>('starter');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [certsIssuedThisMonth, setCertsIssuedThisMonth] = useState(0);
  const [artworkCount, setArtworkCount] = useState(0);
  const [cycleStart, setCycleStart] = useState<string | null>(null);

  const refresh = () => setRefreshTick(t => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      if (!currentUser?.id) {
        setTier('starter');
        setIsActive(false);
        setLoading(false);
        return;
      }

      // Check dev email
      try {
        const email = (currentUser.email ?? '').toLowerCase();
        if (DEV_PRO_EMAILS.includes(email)) {
          if (!cancelled) {
            setTier('pro');
            setIsActive(true);
            // Count artworks this month for dev account
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const artworkResult = await supabase
              .from('artworks')
              .select('id', { count: 'exact', head: true })
              .eq('artist_id', currentUser.id)
              .eq('profile_visible', true)
              .gte('created_at', monthStart);
            setArtworkCount(artworkResult.count ?? 0);
            setLoading(false);
          }
          return;
        }
      } catch { /* continue to DB lookup */ }

      // Load subscription + usage counts in parallel
      try {
        const [subResult, certResult] = await Promise.all([
          supabase.from('subscriptions').select('tier, status, created_at').eq('user_id', currentUser.id).maybeSingle(),
          // Certs issued this calendar month
          supabase.from('certificates')
            .select('id', { count: 'exact', head: true })
            .eq('artist_id', currentUser.id)
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        ]);

        if (!cancelled) {
          const sub = subResult.data;
          let activeTier: SubscriptionTier = 'starter';
          let activeStatus = false;
          let billingCycleStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

          if (sub && !subResult.error) {
            activeTier = (sub.tier as SubscriptionTier) ?? 'starter';
            activeStatus = sub.status === 'active' || sub.status === 'trialing';

            // Calculate current 30-day billing cycle start from subscription creation date
            if (sub.created_at) {
              const subStart = new Date(sub.created_at);
              const now = new Date();
              const msPerCycle = 30 * 24 * 60 * 60 * 1000;
              const cyclesElapsed = Math.floor((now.getTime() - subStart.getTime()) / msPerCycle);
              const currentCycleStart = new Date(subStart.getTime() + cyclesElapsed * msPerCycle);
              billingCycleStart = currentCycleStart.toISOString();
            }
          }

          // Count artworks uploaded in the current billing cycle
          const artworkResult = await supabase
            .from('artworks')
            .select('id', { count: 'exact', head: true })
            .eq('artist_id', currentUser.id)
            .eq('profile_visible', true)
            .gte('created_at', billingCycleStart);

          setTier(activeTier);
          setIsActive(activeStatus);
          setCycleStart(billingCycleStart);
          setCertsIssuedThisMonth(certResult.count ?? 0);
          setArtworkCount(artworkResult.count ?? 0);
        }
      } catch {
        if (!cancelled) { setTier('starter'); setIsActive(false); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [currentUser?.id, refreshTick]);

  const limits = limitsForTier(tier);
  const isDevAccount = DEV_PRO_EMAILS.includes((currentUser?.email ?? '').toLowerCase());

  const maxCerts = isDevAccount ? 9999 : CERT_LIMITS[tier];
  const maxListings = isDevAccount ? 9999 : LISTING_LIMITS[tier];
  const certsRemaining = Math.max(0, maxCerts - certsIssuedThisMonth);
  const listingsRemaining = Math.max(0, maxListings - artworkCount);

  const value: SubscriptionContextValue = {
    tier,
    isActive,
    loading,
    canIssueCerts:       limits.can_issue_certs,
    canAnchorBlockchain: limits.can_anchor_blockchain,
    canViewAnalytics:    limits.can_view_analytics,
    isCreatorOrAbove:    tier === 'creator' || tier === 'pro',
    isPro:               tier === 'pro',
    isDevAccount,
    certsIssuedThisMonth,
    artworkCount,
    maxCerts,
    maxListings,
    certsRemaining,
    listingsRemaining,
    atCertLimit:    !isDevAccount && certsIssuedThisMonth >= maxCerts,
    atListingLimit: !isDevAccount && artworkCount >= maxListings,
    refresh,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}

// Re-export for backwards compatibility
export type { SubscriptionTier };
export { TIER_FEATURES, TIER_PRICING };
