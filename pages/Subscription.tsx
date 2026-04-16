import React, { useState, useEffect } from 'react';
import { Award, Shield, Zap, Check, ExternalLink, AlertCircle, Loader2, Sparkles, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';
import { useUser } from '../context/UserContext';
import { SubscribeModal } from '../components/SubscribeModal';
import { TIER_PRICING, TIER_FEATURES, SubscriptionTier, subscriptionDb } from '../services/subscriptions';
import { verificationDb, VerificationRequest } from '../services/verification';
import { VerifiedArtistBadge } from '../components/VerifiedArtistBadge';

const P = '#7c3aed';
const T = '#0d9488';

export default function SubscriptionPage() {
  const { currentUser: user } = useUser();
  const { tier, isActive, loading, refresh, isDevAccount } = useSubscription();
  const [showModal, setShowModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [verifRequest, setVerifRequest] = useState<VerificationRequest | null | undefined>(undefined);

  // Load verification status for artists
  useEffect(() => {
    if (!user?.id || user.role !== 'artist' || isDevAccount) return;
    verificationDb.getMyRequest(user.id)
      .then(req => setVerifRequest(req))
      .catch(() => setVerifRequest(null));
  }, [user?.id, user?.role, isDevAccount]);

  // Artist is verified if their request is approved
  const isVerifiedArtist = verifRequest?.status === 'approved';
  // Artist needs verification before upgrading
  const needsVerification = user?.role === 'artist' && !isDevAccount && !isVerifiedArtist;

  const handleCancel = async () => {
    if (!user?.id || !window.confirm('Cancel your subscription? You keep access until the end of the billing period.')) return;
    setCanceling(true);
    setCancelError(null);
    try {
      await subscriptionDb.cancel(user.id);
      await refresh();
    } catch (e: any) {
      setCancelError(e.message ?? 'Failed to cancel subscription.');
    } finally {
      setCanceling(false);
    }
  };

  const tiers: SubscriptionTier[] = ['starter', 'creator', 'pro'];

  const tierConfig = {
    starter: {
      icon: <Zap size={20} />,
      iconBg: '#f9fafb',
      iconColor: '#9ca3af',
      border: '#e5e7eb',
      checkColor: '#9ca3af',
    },
    creator: {
      icon: <Award size={20} />,
      iconBg: '#faf5ff',
      iconColor: P,
      border: '#c4b5fd',
      checkColor: P,
    },
    pro: {
      icon: <Shield size={20} />,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      border: '#86efac',
      checkColor: '#16a34a',
    },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={28} color={P} style={{ animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes sub-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
      `}</style>

      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 40%, #6366f1 100%)',
        padding: '48px 24px 56px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -40, right: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12, fontWeight: 800 }}>
            Your Plan
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 12 }}>
            Regestra Membership
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 700, maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Issue authenticated certificates, build your collection, and connect with the art community.
          </p>

          {/* Current plan badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px 24px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: tier === 'pro' ? 'linear-gradient(135deg, #059669, #0d9488)' : tier === 'creator' ? `linear-gradient(135deg, ${P}, ${T})` : 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {tier === 'pro' ? <Shield size={18} color="#fff" /> : tier === 'creator' ? <Award size={18} color="#fff" /> : <Zap size={18} color="rgba(255,255,255,0.6)" />}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                {isDevAccount ? `${TIER_PRICING[tier].label} Plan` : 'Starter Plan'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginTop: 1 }}>
                {isDevAccount ? 'Dev account · Full access' : 'Free · Preview period'}
              </div>
            </div>
          </div>

          {cancelError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fca5a5', fontSize: '0.82rem', justifyContent: 'center', marginTop: 12 }}>
              <AlertCircle size={13} /> {cancelError}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Preview notice */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 40%, #6366f1 100%)',
          borderRadius: 18, padding: '18px 22px',
          display: 'flex', alignItems: 'center', gap: 14,
          marginBottom: 40,
          border: '1px solid rgba(124,58,237,0.2)',
        }}>
          <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>✦</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', marginBottom: 3 }}>
              All features are free during our preview
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700, lineHeight: 1.5 }}>
              Regestra is currently in preview. Every user has full access at no cost. Paid plans will become available when we launch publicly.
            </div>
          </div>
        </div>

        {/* Verification gate banner — artists only, not verified */}
        {needsVerification && (
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 40%, #6366f1 100%)',
            borderRadius: 18, padding: '18px 22px',
            display: 'flex', alignItems: 'center', gap: 14,
            marginBottom: 32,
            border: '1px solid rgba(124,58,237,0.2)',
          }}>
            <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>✦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                Verification required to upgrade
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700, lineHeight: 1.5 }}>
                {verifRequest?.status === 'pending'
                  ? 'Your verification request is under review. Paid plans will unlock once approved.'
                  : 'Artist accounts must be verified before accessing paid plans. Visit your profile to apply.'}
              </div>
            </div>
            {verifRequest?.status === 'pending' ? (
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontWeight: 800, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, padding: '4px 12px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                Under review
              </div>
            ) : (
              <Link to={`/profile/${user?.username}`} style={{
                fontSize: '0.78rem', fontWeight: 700, color: '#fff',
                background: `linear-gradient(135deg, ${P}, ${T})`,
                border: 'none', borderRadius: 10, padding: '8px 16px',
                textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <Shield size={13} /> Apply for Verification
              </Link>
            )}
          </div>
        )}

        {/* Plans grid */}
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20, textAlign: 'center' }}>
          All Plans
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 16, marginBottom: 48, alignItems: 'stretch' }}>
          {tiers.map(t => {
            const p = TIER_PRICING[t];
            const cfg = tierConfig[t];
            const isFree = t === 'starter';
            const isCurrent = isDevAccount ? tier === t : isFree;
            const isLocked = !isDevAccount && !isFree;
            const isProTier = t === 'pro';

            return (
              <div key={t} style={{
                background: isCurrent ? '#fff' : isLocked ? '#fafafa' : '#fff',
                border: `1.5px solid ${isCurrent ? (isProTier && isDevAccount ? '#86efac' : P) : isLocked ? '#e5e7eb' : cfg.border}`,
                borderRadius: 20,
                padding: '24px 20px',
                position: 'relative',
                boxShadow: isCurrent ? `0 0 0 3px ${isProTier && isDevAccount ? 'rgba(34,197,94,0.1)' : 'rgba(124,58,237,0.08)'}` : 'none',
                display: 'flex',
                flexDirection: 'column',
                opacity: isLocked ? 0.72 : 1,
              }}>
                {/* Badge */}
                {isCurrent ? (
                  <div style={{
                    position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                    background: isProTier && isDevAccount ? 'linear-gradient(135deg, #059669, #0d9488)' : `linear-gradient(135deg, ${P}, ${T})`,
                    color: '#fff', fontSize: '0.65rem', fontWeight: 800,
                    padding: '3px 12px', borderRadius: '0 0 10px 10px',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>
                    {isDevAccount ? 'Current' : 'Your Plan'}
                  </div>
                ) : isLocked ? (
                  <div style={{
                    position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                    background: '#e5e7eb',
                    color: '#9ca3af', fontSize: '0.65rem', fontWeight: 800,
                    padding: '3px 12px', borderRadius: '0 0 10px 10px',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>
                    Coming Soon
                  </div>
                ) : null}

                {/* Icon + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11,
                    background: cfg.iconBg, border: `1px solid ${cfg.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ color: isLocked ? '#9ca3af' : cfg.iconColor }}>{cfg.icon}</span>
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: isLocked ? '#9ca3af' : '#1a1729' }}>{p.label}</div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: isLocked ? '#9ca3af' : '#1a1729', letterSpacing: '-0.03em' }}>
                    {p.usd_monthly === 0 ? 'Free' : `$${p.usd_monthly}`}
                  </span>
                  {p.usd_monthly > 0 && (
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#9ca3af', marginLeft: 3 }}>/mo</span>
                  )}
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flexGrow: 1 }}>
                  {TIER_FEATURES[t].map((f, i) => (
                    <li key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      fontSize: '0.82rem',
                      color: isLocked ? '#9ca3af' : '#374151',
                      fontWeight: 400,
                      marginBottom: 8, lineHeight: 1.5,
                    }}>
                      <Check
                        size={13}
                        color={isLocked ? '#d1d5db' : cfg.checkColor}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  onClick={() => isDevAccount && !isCurrent ? setShowModal(true) : undefined}
                  disabled={isCurrent || isLocked || needsVerification}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 12,
                    fontSize: '0.85rem', fontWeight: 700,
                    border: 'none',
                    cursor: (isDevAccount && !isCurrent && !isLocked) ? 'pointer' : 'default',
                    transition: 'opacity 150ms, transform 150ms',
                    background: isCurrent
                      ? (isProTier && isDevAccount ? '#f0fdf4' : '#f5f3ff')
                      : isLocked || needsVerification
                      ? '#f3f4f6'
                      : isProTier
                      ? 'linear-gradient(135deg, #059669, #0d9488)'
                      : `linear-gradient(135deg, ${P}, ${T})`,
                    color: isCurrent
                      ? (isProTier && isDevAccount ? '#16a34a' : P)
                      : (isLocked || needsVerification) ? '#9ca3af' : '#fff',
                  }}
                >
                  {isCurrent ? 'Current plan'
                    : isLocked ? 'Coming soon'
                    : needsVerification ? 'Verify to unlock'
                    : `Upgrade to ${p.label}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* REG token section */}
        <div style={{
          background: '#fafafa',
          border: '1.5px solid #e5e7eb', borderRadius: 20, padding: '28px 32px',
          opacity: 0.8,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={20} color="#9ca3af" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1a1729' }}>
                    Pay with REG and save 20%
                  </div>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 800, color: '#9ca3af',
                    background: '#e5e7eb', borderRadius: 99, padding: '2px 10px',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    Coming Soon
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', lineHeight: 1.6, maxWidth: 520 }}>
                  REG is the Regestra platform utility token. Pay for any subscription with REG credits and receive a fixed 20% discount versus standard rates.
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxWidth: 380 }}>
            {tiers.filter(t => t !== 'starter').map(t => {
              const p = TIER_PRICING[t];
              return (
                <div key={t} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#9ca3af' }}>${p.usd_monthly}/mo</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', marginTop: 2 }}>${p.reg_monthly} REG/mo</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <SubscribeModal
          onClose={() => setShowModal(false)}
          initialTier={tier === 'starter' ? 'creator' : 'pro'}
        />
      )}
    </>
  );
}
