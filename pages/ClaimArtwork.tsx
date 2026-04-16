import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Award, Search, CheckCircle, XCircle, Loader2, AlertCircle, Upload, Image as ImageIcon, Shield, ExternalLink } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { certDb, Certificate } from '../services/certificates';
import { db } from '../services/db';

const P = '#7c3aed';
const T = '#0d9488';

type ClaimStep = 'lookup' | 'verify' | 'upload_image' | 'claiming' | 'success' | 'error';

export default function ClaimArtwork() {
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [step, setStep] = useState<ClaimStep>('lookup');
  const [certNumber, setCertNumber] = useState('');
  const [cert, setCert] = useState<Certificate | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Custom image upload (for when artwork image isn't stored or user wants to update it)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!certNumber.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const result = await certDb.getByCertNumber(certNumber.trim().toUpperCase());
      if (!result) {
        setLookupError('Certificate not found. Please check the number and try again.');
        return;
      }
      if (result.is_revoked) {
        setLookupError('This certificate has been revoked and cannot be claimed.');
        return;
      }
      setCert(result);
      setStep('verify');
    } catch (e: any) {
      setLookupError(e.message || 'Lookup failed. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  // Verify that the current user is the rightful owner
  const verifyOwnership = (): { valid: boolean; reason: string } => {
    if (!cert || !currentUser) return { valid: false, reason: 'Not logged in.' };

    const username = currentUser.username?.toLowerCase() ?? '';
    const name = currentUser.name?.toLowerCase() ?? '';
    const certBuyerUsername = cert.buyer_email?.replace(/^@/, '').toLowerCase() ?? '';
    const certBuyerName = cert.buyer_name?.toLowerCase() ?? '';
    const certBuyerProfileId = cert.buyer_profile_id;

    // Check 1: profile ID matches directly
    if (certBuyerProfileId && certBuyerProfileId === currentUser.id) {
      return { valid: true, reason: 'Profile ID match' };
    }
    // Check 2: username on cert matches
    if (certBuyerUsername && username === certBuyerUsername) {
      return { valid: true, reason: 'Username match' };
    }
    // Check 3: name on cert matches (case-insensitive)
    if (certBuyerName && name === certBuyerName) {
      return { valid: true, reason: 'Name match' };
    }
    // Check 4: they are the artist (re-claiming their own work)
    if (cert.artist_id === currentUser.id) {
      return { valid: true, reason: 'Artist reclaim' };
    }

    return {
      valid: false,
      reason: `The certificate was issued to "${cert.buyer_name}"${cert.buyer_email ? ` (${cert.buyer_email})` : ''}. Your profile name or username must match to claim this artwork.`,
    };
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleClaim = async () => {
    if (!cert || !currentUser) return;
    setStep('claiming');
    setClaimError(null);

    try {
      let imageUrl = cert.artwork_image_url;

      // Upload new image if provided
      if (imageFile) {
        const uploaded = await db.storage.uploadImage('artworks', imageFile);
        imageUrl = uploaded;
      }

      // Check if already in collection
      const existing = await db.collections.getById(currentUser.id, cert.artwork_id ?? cert.id);
      if (existing) {
        // Already there — just navigate to profile
        setStep('success');
        return;
      }

      // Add to collection
      await db.collections.add(currentUser.id, {
        id: cert.artwork_id ?? cert.id,
        title: cert.artwork_title,
        artistName: cert.artist_name,
        image: imageUrl ?? '/placeholder-artwork.jpg',
        description: cert.artwork_description,
      });

      setStep('success');
    } catch (e: any) {
      setClaimError(e.message || 'Failed to claim artwork. Please try again.');
      setStep('verify');
    }
  };

  const ownership = cert ? verifyOwnership() : null;
  const hasStoredImage = !!cert?.artwork_image_url;

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ff', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 40, maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(124,58,237,0.1)' }}>
          <Award size={48} color={P} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1a1729', marginBottom: 8 }}>Claim Your Artwork</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 24 }}>You need to be logged in to claim artwork ownership.</p>
          <Link to="/login" style={{ display: 'inline-block', padding: '12px 28px', background: `linear-gradient(135deg, ${P}, ${T})`, color: '#fff', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>
            Log in to continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes claim-spin { to { transform: rotate(360deg); } }
        @keyframes claim-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.06);opacity:.85} }
        .claim-page { min-height:100vh; background: linear-gradient(135deg,#faf5ff,#f0fdf4); padding:40px 20px 80px; }
        .claim-card { background:#fff; border-radius:24px; max-width:560px; margin:0 auto; padding:36px; box-shadow:0 8px 40px rgba(124,58,237,0.1); }
        .claim-header { text-align:center; margin-bottom:28px; }
        .claim-icon { width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,${P},${T});display:flex;align-items:center;justify-content:center;margin:0 auto 14px; }
        .claim-title { font-size:1.4rem;font-weight:900;color:#1a1729; }
        .claim-sub { font-size:0.85rem;color:#6b7280;margin-top:6px;line-height:1.5; }
        .claim-input { width:100%;padding:12px 16px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:1rem;font-family:monospace;font-weight:700;letter-spacing:0.06em;color:#1a1729;text-transform:uppercase;outline:none;transition:border-color 150ms; }
        .claim-input:focus { border-color:${P}; }
        .claim-btn { width:100%;padding:13px;background:linear-gradient(135deg,${P},${T});border:none;border-radius:12px;font-size:0.95rem;font-weight:800;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 150ms; }
        .claim-btn:hover { opacity:0.9; }
        .claim-btn:disabled { opacity:0.55;cursor:not-allowed; }
        .claim-btn-outline { width:100%;padding:12px;background:#fff;border:1.5px solid #e5e7eb;border-radius:12px;font-size:0.9rem;font-weight:700;color:#6b7280;cursor:pointer;margin-top:10px;transition:background 150ms; }
        .claim-btn-outline:hover { background:#f9fafb; }
        .cert-preview { background:#f9f8ff;border:1.5px solid #ede9fe;border-radius:16px;padding:18px;margin:20px 0; }
        .cert-row { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px; }
        .cert-field-label { font-size:0.65rem;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px; }
        .cert-field-value { font-size:0.85rem;font-weight:600;color:#1a1729; }
        .ownership-ok { background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin:12px 0;font-size:0.83rem;font-weight:700;color:#16a34a; }
        .ownership-fail { background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;padding:12px 14px;margin:12px 0;font-size:0.83rem;color:#dc2626; }
        .image-upload-zone { border:2px dashed #ede9fe;border-radius:14px;padding:24px;text-align:center;cursor:pointer;transition:border-color 150ms,background 150ms; }
        .image-upload-zone:hover { border-color:${P};background:#faf5ff; }
        .error-box { background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:8px;font-size:0.83rem;color:#dc2626;font-weight:600;margin-bottom:16px; }
        .step-indicator { display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:24px; }
        .step-dot { width:8px;height:8px;border-radius:50%;background:#e5e7eb;transition:background 200ms; }
        .step-dot.active { background:${P}; }
        .step-dot.done { background:${T}; }
      `}</style>

      <div className="claim-page">
        {/* Step indicator */}
        <div className="step-indicator">
          {['lookup','verify','success'].map((s, i) => (
            <div key={s} className={`step-dot ${step === s ? 'active' : ['success','claiming'].includes(step) && i < 2 ? 'done' : step === 'verify' && i === 0 ? 'done' : ''}`} />
          ))}
        </div>

        <div className="claim-card">

          {/* ── STEP 1: Lookup ── */}
          {step === 'lookup' && (
            <>
              <div className="claim-header">
                <div className="claim-icon"><Award size={28} color="#fff" /></div>
                <div className="claim-title">Claim Your Artwork</div>
                <div className="claim-sub">
                  Enter your Certificate of Authenticity number to add the artwork to your collection.
                  This works even if the artwork was transferred off-platform or removed from your collection.
                </div>
              </div>

              {lookupError && (
                <div className="error-box"><AlertCircle size={15} />{lookupError}</div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  Certificate Number
                </label>
                <input
                  className="claim-input"
                  placeholder="RG-2025-XXXXXX"
                  value={certNumber}
                  onChange={e => setCertNumber(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleLookup()}
                />
              </div>

              <button className="claim-btn" onClick={handleLookup} disabled={lookupLoading || !certNumber.trim()}>
                {lookupLoading
                  ? <Loader2 size={16} style={{ animation: 'claim-spin 0.8s linear infinite' }} />
                  : <Search size={16} />
                }
                Look Up Certificate
              </button>

              <div style={{ marginTop: 20, padding: '14px 16px', background: '#f9f8ff', borderRadius: 12, fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.6 }}>
                <strong style={{ color: '#1a1729' }}>Where to find your cert number:</strong>
                <ul style={{ marginTop: 6, paddingLeft: 16 }}>
                  <li>On your PDF certificate (e.g. RG-2025-ABCDEF)</li>
                  <li>In the email from the artist</li>
                  <li>On the QR code label on the physical artwork</li>
                </ul>
              </div>
            </>
          )}

          {/* ── STEP 2: Verify & Claim ── */}
          {step === 'verify' && cert && (
            <>
              <div className="claim-header">
                <div className="claim-icon" style={{ animation: 'none' }}><Shield size={28} color="#fff" /></div>
                <div className="claim-title">Verify Ownership</div>
                <div className="claim-sub">Certificate found. Confirm this is your artwork.</div>
              </div>

              {claimError && (
                <div className="error-box"><AlertCircle size={15} />{claimError}</div>
              )}

              {/* Certificate preview */}
              <div className="cert-preview">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {cert.artwork_image_url ? (
                    <img src={cert.artwork_image_url} alt={cert.artwork_title} style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ImageIcon size={22} color={P} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1729' }}>{cert.artwork_title}</div>
                    <div style={{ fontSize: '0.78rem', color: P, marginTop: 2 }}>by {cert.artist_name}</div>
                  </div>
                </div>

                <div className="cert-row">
                  <div>
                    <div className="cert-field-label">Certificate</div>
                    <div className="cert-field-value" style={{ fontFamily: 'monospace', color: P }}>{cert.cert_number}</div>
                  </div>
                  <div>
                    <div className="cert-field-label">Sale date</div>
                    <div className="cert-field-value">{new Date(cert.sale_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  </div>
                  <div>
                    <div className="cert-field-label">Issued to</div>
                    <div className="cert-field-value">{cert.buyer_name}</div>
                  </div>
                  {cert.sale_price != null && (
                    <div>
                      <div className="cert-field-label">Sale price</div>
                      <div className="cert-field-value">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cert.sale_price)}</div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <Link to={`/verify/${cert.cert_number}`} target="_blank" style={{ fontSize: '0.72rem', color: P, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                    <ExternalLink size={11} /> Verify on Regestra
                  </Link>
                  {cert.blockchain_tx_hash && (
                    <a href={`https://solscan.io/tx/${cert.blockchain_tx_hash}${cert.blockchain_network?.includes('devnet') ? '?cluster=devnet' : ''}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                      <Shield size={11} /> On-chain record
                    </a>
                  )}
                </div>
              </div>

              {/* Ownership check */}
              {ownership?.valid ? (
                <div className="ownership-ok">
                  <CheckCircle size={16} />
                  Your profile matches the certificate. You can claim this artwork.
                </div>
              ) : (
                <div className="ownership-fail">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <XCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong>Ownership mismatch</strong>
                      <div style={{ marginTop: 3, fontWeight: 400 }}>{ownership?.reason}</div>
                      <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#9ca3af' }}>
                        If you changed your name or username since the cert was issued, contact the artist to have a new cert issued with your current details.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Image upload — only shown if no image stored or user wants to provide one */}
              {ownership?.valid && !hasStoredImage && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                    Artwork image <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional — upload a photo of the physical artwork)</span>
                  </div>
                  {imagePreview ? (
                    <div style={{ position: 'relative' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }} />
                      <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                        style={{ position: 'absolute', top: 8, right: 8, background: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="image-upload-zone">
                      <Upload size={24} color={P} style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '0.83rem', fontWeight: 700, color: '#374151' }}>Upload artwork photo</div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>JPG, PNG up to 20MB</div>
                      <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
              )}

              {ownership?.valid && (
                <button className="claim-btn" onClick={handleClaim}>
                  <Award size={16} />
                  Add to My Collection
                </button>
              )}

              <button className="claim-btn-outline" onClick={() => { setStep('lookup'); setCert(null); setLookupError(null); }}>
                Search a different certificate
              </button>
            </>
          )}

          {/* ── STEP: Claiming ── */}
          {step === 'claiming' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="claim-icon" style={{ animation: 'claim-pulse 1.4s ease-in-out infinite', margin: '0 auto 16px' }}>
                <Award size={28} color="#fff" />
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1a1729' }}>Claiming artwork…</div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 6 }}>Adding to your collection</div>
            </div>
          )}

          {/* ── STEP: Success ── */}
          {step === 'success' && cert && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${P}, ${T})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} color="#fff" />
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1a1729', marginBottom: 6 }}>Artwork Claimed</div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
                <strong>{cert.artwork_title}</strong> has been added to your collection with its Certificate of Authenticity.
              </div>
              <button className="claim-btn" onClick={() => navigate(`/profile/${currentUser.username}`)}>
                View My Collection
              </button>
              <button className="claim-btn-outline" onClick={() => { setStep('lookup'); setCert(null); setCertNumber(''); }}>
                Claim another artwork
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
