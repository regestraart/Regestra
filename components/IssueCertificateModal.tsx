import React, { useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { anchorCertificateViaApi } from '../lib/solana';
import { certDb as certDbService } from '../services/certificates';
import { Award, X, Loader2, CheckCircle, Download, ExternalLink, Shield, Search } from 'lucide-react';
import { certDb, CertificatePayload, Certificate } from '../services/certificates';
import { generateCertificatePDF } from '../utils/certificatePDF';
import { supabase } from '../lib/supabase';
import { db } from '../services/db';

const P = '#7c3aed';
const T = '#0d9488';

interface IssueCertificateModalProps {
  artwork: {
    id: string;
    title: string;
    image?: string;
    description?: string;
    price?: number | null;
  };
  artist: {
    id: string;
    name: string;
    username?: string;
    solanaAddress?: string;
  };
  isAiGenerated?: boolean;  // locks medium to "AI Artwork"
  onClose: () => void;
  onCancel?: () => Promise<void>;
  onIssued: (cert: Certificate) => void;
}

type Step = 'form' | 'issuing' | 'success';

export const IssueCertificateModal: React.FC<IssueCertificateModalProps> = ({
  artwork,
  artist,
  isAiGenerated = false,
  onClose,
  onCancel,
  onIssued,
}) => {
  const [step, setStep] = useState<Step>('form');
  const [cert, setCert] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const cancelledRef = React.useRef(false);

  const handleClose = async () => {
    // If cert already issued (success step), just close normally
    if (step === 'success') { onClose(); return; }

    cancelledRef.current = true;

    // If an onCancel handler was provided (e.g. upload flow rollback), call it
    if (onCancel) {
      setCancelling(true);
      try { await onCancel(); } catch { /* ignore rollback errors */ }
      setCancelling(false);
    }

    onClose();
  };

  const [form, setForm] = useState({
    buyer_name: '',
    buyer_username: '',
    artwork_medium: isAiGenerated ? 'AI Artwork' : '',
    artwork_dimensions: '',
    artwork_year: '',
    artwork_description: artwork.description || '',
    sale_price: artwork.price != null ? String(artwork.price) : '',
    sale_date: new Date().toISOString().split('T')[0],
  });

  // Username search
  const [usernameResults, setUsernameResults] = useState<Array<{id: string; username: string; name: string; avatar?: string}>>([]);
  const [searchingUsername, setSearchingUsername] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<{id: string; username: string; name: string} | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout>>();

  const handleUsernameInput = (value: string) => {
    update('buyer_username', value);
    setSelectedBuyer(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value.trim() || value.length < 2) {
      setUsernameResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearchingUsername(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .ilike('username', `%${value.replace(/^@/, '')}%`)
          .limit(6);
        const results = (data || []).map((p: any) => ({
          id: p.id,
          username: p.username,
          name: p.full_name || p.username,
          avatar: p.avatar_url,
        }));
        setUsernameResults(results);
        setShowDropdown(results.length > 0);
      } catch { /* ignore */ }
      finally { setSearchingUsername(false); }
    }, 300);
  };

  const selectBuyer = (buyer: {id: string; username: string; name: string}) => {
    setSelectedBuyer(buyer);
    update('buyer_username', buyer.username);
    if (!form.buyer_name.trim()) update('buyer_name', buyer.name);
    setShowDropdown(false);
    setUsernameResults([]);
  };

  // Sale price is required if the artwork already has a price (listed for sale or sold)
  const salePriceRequired = artwork.price != null && artwork.price > 0;

  const { canIssueCerts, canAnchorBlockchain, isPro, atCertLimit, certsRemaining, maxCerts, tier } = useSubscription();

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (atCertLimit) {
      setError(`You've reached your ${maxCerts} certificate limit for this month on your ${tier} plan. Upgrade to issue more.`);
      return;
    }
    if (salePriceRequired && (!form.sale_price || parseFloat(form.sale_price) <= 0)) {
      setError('Sale price is required for sold artwork.');
      return;
    }
    setError(null);
    cancelledRef.current = false;
    setStep('issuing');
    try {
      const certTier = isPro ? 'blockchain' : 'basic';
      // If no buyer specified, the artist holds the certificate
      const buyerName = form.buyer_name.trim() || artist.name;
      const payload: CertificatePayload = {
        artwork_id: artwork.id,
        artist_id: artist.id,
        artwork_title: artwork.title,
        artwork_image_url: artwork.image,
        artwork_description: form.artwork_description || artwork.description,
        artwork_medium: isAiGenerated ? 'AI Artwork' : (form.artwork_medium || undefined),
        artwork_dimensions: form.artwork_dimensions || undefined,
        artwork_year: form.artwork_year || undefined,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        sale_date: form.sale_date,
        buyer_name: buyerName,
        buyer_email: form.buyer_username.trim() ? `@${form.buyer_username.trim().replace(/^@/, '')}` : undefined,
        buyer_profile_id: selectedBuyer?.id ?? null,
        artist_name: artist.name,
        artist_username: artist.username,
        tier: certTier,
      };

      // 1. Create cert record in Supabase
      const issued = await certDb.create(payload);

      // If user closed the modal during issuance, don't update UI
      if (cancelledRef.current) return;

      // 2. If buyer has a Regestra account — add artwork to their collection
      if (selectedBuyer?.id && artwork.image) {
        try {
          await db.collections.add(selectedBuyer.id, {
            id: artwork.id,
            title: artwork.title,
            artistName: artist.name,
            image: artwork.image,
            description: artwork.description,
          });
        } catch { /* non-fatal — cert is still valid */ }
      }

      // 2. If Pro tier — anchor to Solana via Metaplex
      if (isPro) {
        try {
          const anchor = await anchorCertificateViaApi({
            certNumber:          issued.cert_number,
            artworkTitle:        issued.artwork_title,
            artistName:          issued.artist_name,
            buyerName:           issued.buyer_name,
            saleDate:            issued.sale_date,
            salePrice:           issued.sale_price,
            certHash:            issued.cert_hash,
            artworkImageUrl:     issued.artwork_image_url,
            artworkMedium:       issued.artwork_medium,
            artworkDimensions:   issued.artwork_dimensions,
            artworkYear:         issued.artwork_year,
            artworkDescription:  issued.artwork_description,
          });
          // Store blockchain anchor details back to Supabase
          await certDb.updateBlockchainAnchor(
            issued.id,
            anchor.network,
            anchor.txHash
          );
          issued.blockchain_tx_hash    = anchor.txHash;
          issued.blockchain_network    = anchor.network;
          issued.blockchain_anchored_at = anchor.anchoredAt;
          issued.tier = 'blockchain';
        } catch (anchorErr: any) {
          // Non-fatal — cert is still valid, just not blockchain-anchored
          console.warn('Solana anchor failed (cert still valid):', anchorErr.message);
        }
      }

      // If user closed during the Solana anchor step, don't show success
      if (cancelledRef.current) return;

      setCert(issued);
      setStep('success');
      onIssued(issued);
    } catch (e: any) {
      setError(e.message ?? 'Failed to issue certificate.');
      setStep('form');
    }
  };

  const handleDownload = async () => {
    if (!cert) return;
    setDownloading(true);
    try {
      await generateCertificatePDF(cert);
    } catch (e: any) {
      setError('PDF generation failed: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const verifyUrl = cert
    ? `${window.location.origin}/verify/${cert.cert_number}`
    : '';

  return (
    <>
      <style>{`
        @keyframes cert-spin { to { transform: rotate(360deg); } }
        @keyframes cert-pulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        .cert-modal-backdrop {
          position: fixed; inset: 0; z-index: 1200;
          background: rgba(8,6,22,0.72);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: cert-modal-in 200ms ease forwards;
        }
        @keyframes cert-modal-in { from { opacity:0 } to { opacity:1 } }
        .cert-modal-card {
          background: #fff;
          border-radius: 24px;
          width: 100%; max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 32px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.4);
          animation: cert-card-in 280ms cubic-bezier(0.22,1.2,0.36,1) forwards;
        }
        @keyframes cert-card-in {
          from { opacity:0; transform: scale(0.9) translateY(16px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        .cert-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px;
        }
        .cert-title-row {
          display: flex; align-items: center; gap: 10px;
        }
        .cert-icon-wrap {
          width: 40px; height: 40px; border-radius: 12px;
          background: linear-gradient(135deg, ${P}, ${T});
          display: flex; align-items: center; justify-content: center;
        }
        .cert-title {
          font-size: 1.1rem; font-weight: 800; color: #1a1729;
        }
        .cert-subtitle {
          font-size: 0.8rem; color: #6b7280; margin-top: 1px;
        }
        .cert-close {
          width: 32px; height: 32px; border-radius: 50%;
          border: 1.5px solid #e5e7eb; background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #6b7280;
          transition: background 150ms;
        }
        .cert-close:hover { background: #f3f4f6; }

        .cert-artwork-row {
          display: flex; gap: 12px; align-items: center;
          background: #f9f8ff; border: 1px solid #ede9fe;
          border-radius: 14px; padding: 12px 14px;
          margin-bottom: 24px;
        }
        .cert-artwork-thumb {
          width: 52px; height: 52px; border-radius: 8px;
          object-fit: cover; flex-shrink: 0;
          background: #e9e5ff;
        }
        .cert-artwork-title {
          font-size: 0.9rem; font-weight: 700; color: #1a1729;
        }
        .cert-artwork-artist {
          font-size: 0.78rem; color: #7c3aed; margin-top: 2px;
        }

        .cert-field { margin-bottom: 16px; }
        .cert-label {
          display: block; font-size: 0.78rem; font-weight: 700;
          color: #374151; margin-bottom: 6px; letter-spacing: 0.01em;
        }
        .cert-label .cert-required { color: #ef4444; margin-left: 2px; }
        .cert-input {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #e5e7eb; border-radius: 10px;
          font-size: 0.88rem; color: #1a1729; background: #fff;
          outline: none; transition: border-color 150ms;
        }
        .cert-input:focus { border-color: ${P}; }
        .cert-input::placeholder { color: #9ca3af; }

        .cert-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .cert-section-label {
          font-size: 0.72rem; font-weight: 700; color: #9ca3af;
          text-transform: uppercase; letter-spacing: 0.07em;
          margin: 20px 0 12px;
        }

        .cert-tier-toggle {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
          margin-bottom: 20px;
        }
        .cert-tier-opt {
          border: 1.5px solid #e5e7eb; border-radius: 12px;
          padding: 12px 14px; cursor: pointer;
          transition: border-color 150ms, background 150ms;
          position: relative;
        }
        .cert-tier-opt.active {
          border-color: ${P}; background: #faf5ff;
        }
        .cert-tier-opt-title {
          font-size: 0.85rem; font-weight: 700; color: #1a1729;
          display: flex; align-items: center; gap: 6px;
        }
        .cert-tier-opt-desc {
          font-size: 0.75rem; color: #6b7280; margin-top: 4px;
          line-height: 1.4;
        }
        .cert-tier-badge {
          font-size: 0.65rem; font-weight: 700; padding: 2px 7px;
          border-radius: 99px; background: #fef3c7; color: #92400e;
          margin-left: 6px;
        }

        .cert-error {
          font-size: 0.82rem; color: #ef4444; font-weight: 600;
          margin-bottom: 12px;
        }

        .cert-submit {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, ${P}, ${T});
          border: none; border-radius: 12px;
          font-size: 0.9rem; font-weight: 800; color: #fff;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 8px;
          transition: opacity 150ms, transform 150ms;
        }
        .cert-submit:hover { opacity: 0.92; transform: translateY(-1px); }
        .cert-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* issuing state */
        .cert-issuing {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 40px 0; gap: 16px;
        }
        .cert-issuing-icon {
          width: 64px; height: 64px; border-radius: 20px;
          background: linear-gradient(135deg, ${P}, ${T});
          display: flex; align-items: center; justify-content: center;
          animation: cert-pulse 1.4s ease-in-out infinite;
        }
        .cert-issuing-text {
          font-size: 0.9rem; color: #6b7280; font-weight: 600;
        }

        /* success state */
        .cert-success {
          display: flex; flex-direction: column; align-items: center;
          gap: 4px; padding: 8px 0 4px;
        }
        .cert-success-badge {
          width: 68px; height: 68px; border-radius: 50%;
          background: linear-gradient(135deg, ${P}, ${T});
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 8px;
        }
        .cert-success-title {
          font-size: 1.2rem; font-weight: 800; color: #1a1729;
        }
        .cert-success-sub {
          font-size: 0.83rem; color: #6b7280; text-align: center;
          max-width: 340px; line-height: 1.5; margin-top: 4px;
        }
        .cert-number-box {
          background: #f9f8ff; border: 1.5px solid #ede9fe;
          border-radius: 12px; padding: 12px 20px;
          margin: 16px 0;
          font-size: 1.3rem; font-weight: 900;
          color: ${P}; letter-spacing: 0.08em;
          font-family: monospace;
        }
        .cert-hash-box {
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 10px; padding: 10px 14px;
          margin-bottom: 16px; width: 100%;
        }
        .cert-hash-label {
          font-size: 0.7rem; font-weight: 700; color: #16a34a;
          text-transform: uppercase; letter-spacing: 0.07em;
          margin-bottom: 4px;
        }
        .cert-hash-value {
          font-size: 0.7rem; font-family: monospace; color: #166534;
          word-break: break-all; line-height: 1.5;
        }
        .cert-actions {
          display: flex; gap: 10px; width: 100%; margin-top: 4px;
        }
        .cert-btn-dl {
          flex: 1; padding: 11px;
          background: linear-gradient(135deg, ${P}, ${T});
          border: none; border-radius: 11px;
          font-size: 0.85rem; font-weight: 800; color: #fff;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 7px;
          transition: opacity 150ms;
        }
        .cert-btn-dl:hover { opacity: 0.9; }
        .cert-btn-dl:disabled { opacity: 0.6; cursor: not-allowed; }
        .cert-btn-verify {
          padding: 11px 16px;
          border: 1.5px solid #e5e7eb; border-radius: 11px;
          background: #fff; font-size: 0.85rem; font-weight: 700;
          color: #374151; cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          transition: background 150ms;
        }
        .cert-btn-verify:hover { background: #f9fafb; }
        .cert-btn-close-final {
          width: 100%; padding: 11px; margin-top: 8px;
          border: 1.5px solid #e5e7eb; border-radius: 11px;
          background: #fff; font-size: 0.85rem; font-weight: 700;
          color: #6b7280; cursor: pointer;
        }
      `}</style>

      <div className="cert-modal-backdrop" onClick={e => { if (e.target === e.currentTarget && !cancelling) handleClose(); }}>
        <div className="cert-modal-card">

          {/* ── FORM ── */}
          {step === 'form' && (
            <>
              <div className="cert-header">
                <div className="cert-title-row">
                  <div className="cert-icon-wrap">
                    <Award size={20} color="#fff" />
                  </div>
                  <div>
                    <div className="cert-title">Issue Certificate</div>
                    <div className="cert-subtitle">Certificate of Authenticity</div>
                  </div>
                </div>
                <button className="cert-close" onClick={handleClose} disabled={cancelling}>{cancelling ? <Loader2 size={13} style={{animation:"spin 0.8s linear infinite"}} /> : <X size={15} />}</button>
              </div>

              {/* Artwork preview */}
              <div className="cert-artwork-row">
                {artwork.image && (
                  <img className="cert-artwork-thumb" src={artwork.image} alt={artwork.title} />
                )}
                <div>
                  <div className="cert-artwork-title">{artwork.title}</div>
                  <div className="cert-artwork-artist">by {artist.name}</div>
                </div>
              </div>

              {/* Preview network notice */}
              <div style={{
                margin: '4px 0 16px',
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid rgba(124,58,237,0.15)',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #0f0020 0%, #1a0040 60%, #001a1a 100%)',
                  padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem',
                  }}>
                    ✦
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', marginBottom: 2 }}>
                      Certificate Preview Program
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                      Regestra is currently in preview. This certificate is issued on our preview registry. When we launch publicly, you'll be able to issue a new permanent certificate — or re-upload your artwork at that time.
                    </div>
                  </div>
                </div>
              </div>
              <div className="cert-section-label">
                Buyer information
                <span style={{ fontWeight: 400, color: '#9ca3af', textTransform: 'none', letterSpacing: 0, fontSize: '0.7rem', marginLeft: 6 }}>
                  — optional, leave blank if no sale yet
                </span>
              </div>
              <div className="cert-field">
                <label className="cert-label">Buyer name</label>
                <input
                  className="cert-input"
                  placeholder="Leave blank if you're holding this certificate"
                  value={form.buyer_name}
                  onChange={e => update('buyer_name', e.target.value)}
                />
              </div>
              <div className="cert-field">
                <label className="cert-label">Buyer Regestra username <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: '#9ca3af', fontSize: '0.88rem', pointerEvents: 'none', zIndex: 1,
                  }}>@</span>
                  {searchingUsername && (
                    <Loader2 size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', animation: 'cert-spin 0.8s linear infinite' }} />
                  )}
                  {selectedBuyer && !searchingUsername && (
                    <CheckCircle size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#16a34a' }} />
                  )}
                  <input
                    className="cert-input"
                    style={{ paddingLeft: 28, paddingRight: 32 }}
                    placeholder="username"
                    value={form.buyer_username.replace(/^@/, '')}
                    onChange={e => handleUsernameInput(e.target.value)}
                    onFocus={() => usernameResults.length > 0 && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    autoComplete="off"
                  />
                  {/* Search dropdown */}
                  {showDropdown && usernameResults.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                      background: '#fff', border: '1.5px solid #ede9fe', borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(124,58,237,0.12)', marginTop: 4,
                      overflow: 'hidden',
                    }}>
                      {usernameResults.map(user => (
                        <div
                          key={user.id}
                          onMouseDown={() => selectBuyer(user)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', cursor: 'pointer',
                            borderBottom: '1px solid #f5f3ff',
                            transition: 'background 120ms',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#faf5ff')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed' }}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1729' }}>{user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#7c3aed' }}>@{user.username}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedBuyer && (
                  <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={11} /> Regestra account found — artwork will be added to their collection
                  </div>
                )}
              </div>

              {/* Sale info */}
              <div className="cert-section-label">Sale details</div>
              <div className="cert-grid-2">
                <div className="cert-field">
                  <label className="cert-label">
                    Sale price (USD)
                    {salePriceRequired && <span className="cert-required"> *</span>}
                  </label>
                  <input
                    className="cert-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.sale_price}
                    onChange={e => update('sale_price', e.target.value)}
                    style={{ borderColor: salePriceRequired && (!form.sale_price || parseFloat(form.sale_price) <= 0) ? '#fca5a5' : undefined }}
                  />
                </div>
                <div className="cert-field">
                  <label className="cert-label">Sale date</label>
                  <input
                    className="cert-input"
                    type="date"
                    value={form.sale_date}
                    onChange={e => update('sale_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Artwork details */}
              <div className="cert-section-label">Artwork details</div>
              <div className="cert-grid-2">
                <div className="cert-field">
                  <label className="cert-label">Medium</label>
                  {isAiGenerated ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'linear-gradient(135deg, #f5f0ff, #f0fdf4)', border: '1.5px solid #ede9fe', borderRadius: 10 }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, background: 'linear-gradient(135deg, #7c3aed, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        ✦ AI Artwork
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af', fontStyle: 'italic' }}>Required · Cannot be changed</span>
                    </div>
                  ) : (
                    <input
                      className="cert-input"
                      placeholder="Oil on canvas"
                      value={form.artwork_medium}
                      onChange={e => update('artwork_medium', e.target.value)}
                    />
                  )}
                </div>
                <div className="cert-field">
                  <label className="cert-label">Year created</label>
                  <input
                    className="cert-input"
                    placeholder="2024"
                    value={form.artwork_year}
                    onChange={e => update('artwork_year', e.target.value)}
                  />
                </div>
              </div>
              <div className="cert-field">
                <label className="cert-label">Dimensions</label>
                <input
                  className="cert-input"
                  placeholder='24" × 36" (61 × 91 cm)'
                  value={form.artwork_dimensions}
                  onChange={e => update('artwork_dimensions', e.target.value)}
                />
              </div>
              <div className="cert-field">
                <label className="cert-label">Artwork description</label>
                <textarea
                  className="cert-input"
                  placeholder="Describe the artwork, materials, inspiration, or any relevant details..."
                  value={form.artwork_description}
                  onChange={e => update('artwork_description', e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              {error && <div className="cert-error">{error}</div>}

              {/* Cert usage indicator */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: atCertLimit ? '#fef2f2' : '#f9f8ff',
                border: `1px solid ${atCertLimit ? '#fca5a5' : '#ede9fe'}`,
                borderRadius: 10, padding: '9px 13px', marginBottom: 12,
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: atCertLimit ? '#ef4444' : '#6b7280' }}>
                  {atCertLimit
                    ? `Monthly certificate limit reached (${maxCerts}/${maxCerts})`
                    : `${certsRemaining} certificate${certsRemaining !== 1 ? 's' : ''} remaining this month`
                  }
                </span>
                {atCertLimit && (
                  <a href="/subscription" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', textDecoration: 'none' }}>
                    Upgrade →
                  </a>
                )}
              </div>

              <button className="cert-submit" onClick={handleSubmit}>
                <Award size={16} />
                Issue Certificate
              </button>
            </>
          )}

          {/* ── ISSUING ── */}
          {step === 'issuing' && (
            <div className="cert-issuing">
              <div className="cert-issuing-icon">
                <Award size={28} color="#fff" />
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1a1729' }}>
                Generating certificate…
              </div>
              <div className="cert-issuing-text">Hashing &amp; recording on Regestra</div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && cert && (
            <>
              <div className="cert-header">
                <div className="cert-title-row">
                  <div className="cert-icon-wrap">
                    <Award size={20} color="#fff" />
                  </div>
                  <div>
                    <div className="cert-title">Certificate Issued</div>
                    <div className="cert-subtitle">Certificate of Authenticity</div>
                  </div>
                </div>
                <button className="cert-close" onClick={handleClose} disabled={cancelling}>{cancelling ? <Loader2 size={13} style={{animation:"spin 0.8s linear infinite"}} /> : <X size={15} />}</button>
              </div>

              <div className="cert-success">
                <div className="cert-success-badge">
                  <CheckCircle size={32} color="#fff" />
                </div>
                <div className="cert-success-title">Certificate Issued</div>
                <div className="cert-success-sub">
                  {cert.buyer_name && cert.buyer_name !== cert.artist_name
                    ? <>Authenticated ownership of <strong>{cert.artwork_title}</strong> has been recorded for {cert.buyer_name}.</>
                    : <>A Certificate of Authenticity for <strong>{cert.artwork_title}</strong> has been issued and is held in your wallet.</>
                  }
                </div>
                <div className="cert-number-box">{cert.cert_number}</div>

                {/* Preview network notice — warm, no technical language */}
                <div style={{
                  width: '100%', borderRadius: 16, overflow: 'hidden',
                  border: '1px solid rgba(124,58,237,0.12)', marginBottom: 20,
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #0f0020, #1a0040 60%, #001a1a)',
                    padding: '16px 18px',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem',
                    }}>
                      ✦
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                        You're part of the preview
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                        This certificate has been issued on our preview registry. Please note — preview certificates will not be automatically carried over when we launch publicly. When that time comes, you'll be able to issue a new permanent certificate for this artwork, or re-upload it then.
                      </div>
                    </div>
                  </div>
                  <div style={{
                    background: '#f9f8ff', padding: '10px 18px',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <CheckCircle size={13} color="#16a34a" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#374151' }}>
                      Your artwork is authenticated and verifiable right now at <span style={{ color: '#7c3aed', fontWeight: 700 }}>regestra.com/verify</span>
                    </span>
                  </div>
                </div>

                <div className="cert-actions">
                  <button
                    className="cert-btn-dl"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading
                      ? <Loader2 size={15} style={{ animation: 'cert-spin 0.8s linear infinite' }} />
                      : <Download size={15} />
                    }
                    Download PDF
                  </button>
                  <button
                    className="cert-btn-verify"
                    onClick={() => window.open(verifyUrl, '_blank')}
                  >
                    <ExternalLink size={14} />
                    Verify
                  </button>
                </div>
                <button className="cert-btn-close-final" onClick={onClose}>Done</button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default IssueCertificateModal;
