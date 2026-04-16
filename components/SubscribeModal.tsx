import React, { useState } from 'react';
import { X, Check, Zap, Award, Shield, Loader2, ExternalLink } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { useUser } from '../context/UserContext';
import { subscriptionDb, TIER_PRICING, TIER_FEATURES, SubscriptionTier } from '../services/subscriptions';

const P = '#7c3aed';
const T = '#0d9488';

interface SubscribeModalProps {
  onClose: () => void;
  initialTier?: SubscriptionTier;
}

type PayMethod = 'usd' | 'reg';

export const SubscribeModal: React.FC<SubscribeModalProps> = ({ onClose, initialTier = 'creator' }) => {
  const { currentUser: user } = useUser();
  const { tier: currentTier, refresh } = useSubscription();
  const [selected, setSelected] = useState<SubscriptionTier>(initialTier);
  const [payMethod, setPayMethod] = useState<PayMethod>('usd');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const pricing = TIER_PRICING[selected];
  const price = payMethod === 'reg' ? pricing.reg_monthly : pricing.usd_monthly;
  const currency = payMethod === 'reg' ? 'REG/mo' : 'USD/mo';

  const handleSubscribe = async () => {
    if (!user?.id) return;
    if (selected === 'starter') return;
    setLoading(true);
    setError(null);
    try {
      if (payMethod === 'usd') {
        // TODO: Replace with actual Stripe checkout session creation
        // const session = await createStripeCheckout(user.id, selected);
        // window.location.href = session.url;
        //
        // For now, simulate upgrade (remove this when Stripe is integrated):
        await subscriptionDb.upgrade(user.id, selected);
        await refresh();
        setSuccess(true);
      } else {
        // REG payment flow — opens wallet connection
        // TODO: Integrate Phantom wallet + SPL token transfer
        // const txHash = await payWithRegToken(user.id, selected);
        // await subscriptionDb.upgradeWithReg(user.id, selected, txHash);
        setError('REG token payments are coming soon. Please use USD for now.');
      }
    } catch (e: any) {
      setError(e.message ?? 'Subscription failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tiers: SubscriptionTier[] = ['starter', 'creator', 'pro'];

  const tierIcon = (t: SubscriptionTier) => {
    if (t === 'pro') return <Shield size={18} />;
    if (t === 'creator') return <Award size={18} />;
    return <Zap size={18} />;
  };

  const tierColor = (t: SubscriptionTier) => {
    if (t === 'pro') return { bg: '#f0fdf4', border: '#86efac', icon: '#16a34a', text: '#166534' };
    if (t === 'creator') return { bg: '#faf5ff', border: '#c4b5fd', icon: P, text: '#4c1d95' };
    return { bg: '#f9fafb', border: '#e5e7eb', icon: '#6b7280', text: '#374151' };
  };

  return (
    <>
      <style>{`
        @keyframes sub-in { from { opacity:0 } to { opacity:1 } }
        @keyframes sub-card-in {
          from { opacity:0; transform: scale(0.92) translateY(20px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        .sub-backdrop {
          position:fixed; inset:0; z-index:1300;
          background:rgba(8,6,22,0.75);
          backdrop-filter:blur(12px);
          display:flex; align-items:center; justify-content:center;
          padding:20px;
          animation: sub-in 200ms ease forwards;
        }
        .sub-card {
          background:#fff; border-radius:28px;
          width:100%; max-width:680px;
          max-height:92vh; overflow-y:auto;
          padding:36px;
          box-shadow:0 40px 100px rgba(0,0,0,0.45);
          animation: sub-card-in 280ms cubic-bezier(0.22,1.2,0.36,1) forwards;
        }
        .sub-header {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:28px;
        }
        .sub-title { font-size:1.4rem; font-weight:900; color:#1a1729; }
        .sub-subtitle { font-size:0.83rem; color:#6b7280; margin-top:3px; }
        .sub-close {
          width:34px; height:34px; border-radius:50%;
          border:1.5px solid #e5e7eb; background:#fff;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; color:#6b7280; transition:background 150ms;
        }
        .sub-close:hover { background:#f3f4f6; }

        /* Pay method toggle */
        .pay-toggle {
          display:inline-flex;
          background:#f3f0ff; border-radius:99px;
          padding:3px; margin-bottom:24px;
        }
        .pay-opt {
          padding:7px 18px; border-radius:99px; border:none;
          font-size:0.82rem; font-weight:700; cursor:pointer;
          transition:all 150ms; background:transparent; color:#6b7280;
        }
        .pay-opt.active { background:#fff; color:${P}; box-shadow:0 1px 4px rgba(0,0,0,0.1); }
        .pay-reg-badge {
          font-size:0.7rem; font-weight:700; padding:1px 7px;
          background:#fef3c7; color:#92400e; border-radius:99px;
          margin-left:5px;
        }

        /* Tier cards */
        .tier-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:24px; }
        @media (max-width:560px) { .tier-grid { grid-template-columns:1fr; } }

        .tier-card {
          border:2px solid #e5e7eb; border-radius:18px; padding:20px 18px;
          cursor:pointer; transition:all 200ms; position:relative;
          background:#fff;
        }
        .tier-card:hover { transform:translateY(-2px); }
        .tier-card.selected { border-color:${P}; background:#faf5ff; }
        .tier-card.is-pro.selected { border-color:#16a34a; background:#f0fdf4; }
        .tier-card.current-tier::after {
          content:'Current';
          position:absolute; top:10px; right:10px;
          font-size:0.65rem; font-weight:700; padding:2px 8px;
          background:#e0e7ff; color:#3730a3; border-radius:99px;
        }

        .tier-icon-ring {
          width:36px; height:36px; border-radius:10px;
          display:flex; align-items:center; justify-content:center;
          margin-bottom:10px;
        }
        .tier-name { font-size:1rem; font-weight:800; color:#1a1729; }
        .tier-price {
          font-size:1.5rem; font-weight:900; color:#1a1729;
          margin:6px 0 2px; display:flex; align-items:baseline; gap:4px;
        }
        .tier-price-unit { font-size:0.75rem; font-weight:600; color:#9ca3af; }
        .tier-desc { font-size:0.75rem; color:#6b7280; line-height:1.4; margin-bottom:12px; }

        .tier-features { list-style:none; padding:0; margin:0; }
        .tier-feature {
          display:flex; align-items:flex-start; gap:7px;
          font-size:0.78rem; color:#374151; line-height:1.5;
          margin-bottom:5px;
        }
        .tier-feature-icon { flex-shrink:0; margin-top:1px; }

        /* CTA */
        .sub-cta {
          width:100%; padding:14px;
          background:linear-gradient(135deg, ${P}, ${T});
          border:none; border-radius:14px;
          font-size:0.95rem; font-weight:800; color:#fff;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
          transition:opacity 150ms, transform 150ms;
        }
        .sub-cta:hover { opacity:0.92; transform:translateY(-1px); }
        .sub-cta:disabled { opacity:0.55; cursor:not-allowed; transform:none; }
        .sub-cta.pro { background:linear-gradient(135deg, #059669, #0d9488); }

        .sub-reg-note {
          display:flex; align-items:center; gap:6px;
          font-size:0.75rem; color:#6b7280; margin-top:10px;
          justify-content:center;
        }

        .sub-error { font-size:0.82rem; color:#ef4444; font-weight:600; margin-top:10px; text-align:center; }

        /* Success */
        .sub-success {
          display:flex; flex-direction:column; align-items:center;
          gap:12px; padding:20px 0;
        }
        .sub-success-icon {
          width:72px; height:72px; border-radius:50%;
          background:linear-gradient(135deg, ${P}, ${T});
          display:flex; align-items:center; justify-content:center;
        }
        .sub-success-title { font-size:1.3rem; font-weight:900; color:#1a1729; }
        .sub-success-sub { font-size:0.85rem; color:#6b7280; text-align:center; max-width:320px; line-height:1.5; }
      `}</style>

      <div className="sub-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="sub-card">
          {!success ? (
            <>
              <div className="sub-header">
                <div>
                  <div className="sub-title">Upgrade your plan</div>
                  <div className="sub-subtitle">Issue verifiable certificates of authenticity on Solana</div>
                </div>
                <button className="sub-close" onClick={onClose}><X size={16} /></button>
              </div>

              {/* Pay method toggle */}
              <div className="pay-toggle">
                <button
                  className={`pay-opt ${payMethod === 'usd' ? 'active' : ''}`}
                  onClick={() => setPayMethod('usd')}
                >
                  Pay with USD
                </button>
                <button
                  className={`pay-opt ${payMethod === 'reg' ? 'active' : ''}`}
                  onClick={() => setPayMethod('reg')}
                >
                  Pay with REG
                  <span className="pay-reg-badge">20% off</span>
                </button>
              </div>

              {/* Tier grid */}
              <div className="tier-grid">
                {tiers.map(t => {
                  const p = TIER_PRICING[t];
                  const c = tierColor(t);
                  const price = payMethod === 'reg' ? p.reg_monthly : p.usd_monthly;
                  const isSelected = selected === t;
                  const isCurrent = currentTier === t;

                  return (
                    <div
                      key={t}
                      className={`tier-card ${isSelected ? 'selected' : ''} ${t === 'pro' ? 'is-pro' : ''} ${isCurrent ? 'current-tier' : ''}`}
                      onClick={() => setSelected(t)}
                    >
                      <div
                        className="tier-icon-ring"
                        style={{ background: c.bg, border: `1px solid ${c.border}` }}
                      >
                        <span style={{ color: c.icon }}>{tierIcon(t)}</span>
                      </div>
                      <div className="tier-name">{p.label}</div>
                      <div className="tier-price">
                        {price === 0 ? 'Free' : `$${price}`}
                        {price > 0 && <span className="tier-price-unit">{payMethod === 'reg' ? ' REG/mo' : '/mo'}</span>}
                      </div>

                      <ul className="tier-features">
                        {TIER_FEATURES[t].slice(0, 4).map((f, i) => (
                          <li key={i} className="tier-feature">
                            <span className="tier-feature-icon">
                              <Check size={11} color={c.icon} />
                            </span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              {selected === 'starter' ? (
                <button className="sub-cta" disabled>
                  <Check size={16} />
                  Your current plan
                </button>
              ) : (
                <button
                  className={`sub-cta ${selected === 'pro' ? 'pro' : ''}`}
                  onClick={handleSubscribe}
                  disabled={loading || selected === currentTier}
                >
                  {loading
                    ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                    : selected === currentTier
                    ? <><Check size={16} /> Current plan</>
                    : <><Award size={16} /> Upgrade to {TIER_PRICING[selected].label} — ${price}{payMethod === 'reg' ? ' REG' : ''}/mo</>
                  }
                </button>
              )}

              {payMethod === 'reg' && (
                <div className="sub-reg-note">
                  <ExternalLink size={11} />
                  REG tokens can be purchased at regestra.com/token
                </div>
              )}

              {error && <div className="sub-error">{error}</div>}

              <p style={{ fontSize: '0.72rem', color: '#9ca3af', textAlign: 'center', marginTop: 14 }}>
                Cancel anytime. No contracts.
                {payMethod === 'usd' ? ' Billed via Stripe.' : ' REG tokens burned at protocol level.'}
              </p>
            </>
          ) : (
            /* Success state */
            <>
              <div className="sub-header">
                <div>
                  <div className="sub-title">Plan upgraded</div>
                </div>
                <button className="sub-close" onClick={onClose}><X size={16} /></button>
              </div>
              <div className="sub-success">
                <div className="sub-success-icon">
                  <Check size={32} color="#fff" />
                </div>
                <div className="sub-success-title">
                  Welcome to {TIER_PRICING[selected].label}
                </div>
                <div className="sub-success-sub">
                  {selected === 'creator'
                    ? "You can now issue Certificates of Authenticity for your artwork. Buyers receive a verifiable PDF with SHA-256 hash."
                    : "You can now issue blockchain-anchored certificates on Solana. Every cert is permanently recorded on-chain with full provenance tracking."
                  }
                </div>
                <button
                  className="sub-cta"
                  style={{ maxWidth: 260 }}
                  onClick={onClose}
                >
                  <Award size={16} />
                  Start issuing certificates
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default SubscribeModal;
