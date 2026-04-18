import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, AlertTriangle, Search, ChevronRight, Upload, MessageCircle, Bell, ShoppingBag, Award, Shield } from 'lucide-react';
import { certDb, Certificate } from '../services/certificates';
import { VerifiedArtistBadge } from '../components/VerifiedArtistBadge';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import Logo from '../components/Logo';
import { Button } from '../components/ui/Button';
import { SearchComponent } from '../components/Search';
import MobileNavFooter from '../components/MobileNavFooter';
import ChangePasswordModal from '../components/ChangePasswordModal';
import ProfileDropdown from '../components/ProfileDropdown';

const P = '#7c3aed';
const T = '#0d9488';
const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_691b6257d4173f2ed6ec3e95/7495ad18b_RegestraLogo.png';

type VerifyState = 'loading' | 'valid' | 'invalid' | 'revoked' | 'notfound' | 'error' | 'idle';

export default function VerifyCertificate() {
  const { currentUser, setCurrentUser } = useUser();
  const navigate = useNavigate();
  const { certNumber } = useParams<{ certNumber: string }>();
  const [state, setState] = useState<VerifyState>(certNumber ? 'loading' : 'idle');
  const [cert, setCert] = useState<Certificate | null>(null);
  const [message, setMessage] = useState('');
  const [manualInput, setManualInput] = useState(certNumber ?? '');
  const [history, setHistory] = useState<Certificate[]>([]);
  const [isVerifiedArtist, setIsVerifiedArtist] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showMobileProfileDropdown, setShowMobileProfileDropdown] = useState(false);
  const mobileProfileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileProfileDropdownRef.current && !mobileProfileDropdownRef.current.contains(e.target as Node)) {
        setShowMobileProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => { await setCurrentUser(null); navigate('/'); };

  const verify = async (num: string) => {
    if (!num.trim()) return;
    setState('loading');
    try {
      const result = await certDb.verify(num.trim().toUpperCase());
      setCert(result.cert);
      setMessage(result.message);
      if (!result.cert) setState('notfound');
      else if (result.cert.is_revoked) setState('revoked');
      else if (result.valid) setState('valid');
      else setState('invalid');

      // Load provenance history for this artwork
      if (result.cert?.artwork_id) {
        certDb.getAllByArtwork(result.cert.artwork_id)
          .then(h => setHistory(h))
          .catch(() => setHistory([]));
      }

      // Check if artist is verified
      if (result.cert?.artist_id) {
        supabase.from('profiles').select('is_verified_artist').eq('id', result.cert.artist_id).maybeSingle()
          .then(({ data }) => setIsVerifiedArtist(data?.is_verified_artist ?? false))
          .catch(() => {});
      }
    } catch (e: any) {
      setState('error');
      setMessage(e.message ?? 'Verification failed.');
    }
  };

  useEffect(() => { if (certNumber) verify(certNumber); }, [certNumber]);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formatPrice = (p: number | null | undefined) =>
    p == null ? null : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p);

  const isValid = state === 'valid';
  const isLoading = state === 'loading';

  return (
    <>
      <style>{`
        @keyframes vc-spin { to { transform: rotate(360deg); } }
        @keyframes vc-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes vc-fade { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes vc-check { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
        .vc-fade { animation: vc-fade 500ms cubic-bezier(0.16,1,0.3,1) forwards; }
        .vc-check { animation: vc-check 400ms cubic-bezier(0.34,1.56,0.64,1) forwards; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#f8f6ff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>

        {/* Nav — matches Layout.tsx */}
        <header
          className="bg-white sticky top-0 z-50"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link to="/"><Logo className="h-9 w-auto" /></Link>
              {currentUser ? (
                <>
                  {/* Desktop/tablet (md+): search + full nav icons */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="w-96 desktop-search-bar"><SearchComponent /></div>
                    <nav className="flex items-center gap-1">
                      <Link to="/marketplace"><Button variant="ghost" size="icon" className="rounded-full"><ShoppingBag className="w-6 h-6" /></Button></Link>
                      <Link to="/verify"><Button variant="ghost" size="icon" className="rounded-full" title="Verify Certificate"><Award className="w-6 h-6 text-purple-600" /></Button></Link>
                      <Link to="/upload"><Button variant="ghost" size="icon" className="rounded-full"><Upload className="w-6 h-6" /></Button></Link>
                      <Link to="/messages"><Button variant="ghost" size="icon" className="rounded-full"><MessageCircle className="w-6 h-6" /></Button></Link>
                      <Button variant="ghost" size="icon" className="rounded-full"><Bell className="w-6 h-6" /></Button>
                      {currentUser?.is_admin && (
                        <Link to="/admin"><Button variant="ghost" size="icon" className="rounded-full" title="Admin Dashboard"><Shield className="w-6 h-6 text-purple-600" /></Button></Link>
                      )}
                      <Link to={`/profile/${currentUser.username}`}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <img src={currentUser.avatar} alt="profile" className="w-10 h-10 rounded-full object-cover" />
                        </Button>
                      </Link>
                    </nav>
                  </div>
                  {/* Mobile: centered search */}
                  <div className="flex md:hidden flex-1 items-center justify-center px-3">
                    <div style={{ flex: 1, maxWidth: 260 }}><SearchComponent /></div>
                  </div>
                  {/* Mobile: bell + avatar */}
                  <div className="flex md:hidden items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="rounded-full"><Bell className="w-6 h-6" /></Button>
                    {currentUser?.is_admin && (
                      <Link to="/admin"><Button variant="ghost" size="icon" className="rounded-full" title="Admin Dashboard"><Shield className="w-6 h-6 text-purple-600" /></Button></Link>
                    )}
                    <div className="relative" ref={mobileProfileDropdownRef}>
                      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowMobileProfileDropdown(p => !p)}>
                        <img src={currentUser.avatar} alt="profile" className="w-8 h-8 rounded-full object-cover" />
                      </Button>
                      {showMobileProfileDropdown && (
                        <ProfileDropdown
                          user={currentUser}
                          onSignOut={handleSignOut}
                          onNavigate={() => setShowMobileProfileDropdown(false)}
                          onChangePasswordClick={() => { setShowMobileProfileDropdown(false); setShowChangePasswordModal(true); }}
                        />
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <nav className="flex items-center gap-5">
                  <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Log In</Link>
                  <Link to="/sign-up">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-full px-6">Sign Up</Button>
                  </Link>
                </nav>
              )}
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px' }}>

          {/* Page title */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
              Regestra
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1a1729', letterSpacing: '-0.03em', marginBottom: 10 }}>
              Certificate Verification
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
              Verify the authenticity of any artwork certificate issued on Regestra.
            </p>
          </div>

          {/* Search */}
          <div style={{
            background: '#fff', borderRadius: 20, padding: 24,
            boxShadow: '0 4px 24px rgba(124,58,237,0.08)',
            border: '1px solid #f0ebff', marginBottom: 32,
          }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>
              Certificate Number
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                value={manualInput}
                onChange={e => setManualInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && verify(manualInput)}
                placeholder="e.g. RG-2026-ABCDEF"
                style={{
                  flex: '1 1 180px', minWidth: 0, padding: '12px 16px',
                  border: '1.5px solid #e5e7eb', borderRadius: 12,
                  fontSize: '1rem', fontFamily: 'monospace', fontWeight: 700,
                  color: '#1a1729', letterSpacing: '0.04em', outline: 'none',
                  transition: 'border-color 150ms',
                }}
                onFocus={e => (e.target.style.borderColor = P)}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
              <button
                onClick={() => verify(manualInput)}
                disabled={isLoading || !manualInput.trim()}
                style={{
                  flex: '1 1 auto', padding: '12px 22px', borderRadius: 12, border: 'none',
                  background: `linear-gradient(135deg, ${P}, ${T})`,
                  color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                {isLoading
                  ? <Loader2 size={16} style={{ animation: 'vc-spin 0.8s linear infinite' }} />
                  : <><Search size={15} /> Verify</>
                }
              </button>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: `linear-gradient(135deg, ${P}, ${T})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                animation: 'vc-pulse 1.4s ease-in-out infinite',
                boxShadow: '0 8px 32px rgba(124,58,237,0.25)',
              }}>
                <Loader2 size={30} color="#fff" style={{ animation: 'vc-spin 1s linear infinite' }} />
              </div>
              <p style={{ color: '#9ca3af', fontWeight: 600, fontSize: '0.9rem' }}>Checking certificate...</p>
            </div>
          )}

          {/* Not found / Error */}
          {(state === 'notfound' || state === 'error') && (
            <div className="vc-fade" style={{
              background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #fee2e2',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: '#fef2f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <XCircle size={36} color="#ef4444" />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1a1729', marginBottom: 8 }}>
                Certificate Not Found
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6 }}>
                This certificate number doesn't exist in the Regestra registry. Please check the number and try again.
              </p>
            </div>
          )}

          {/* Revoked */}
          {state === 'revoked' && cert && (
            <div className="vc-fade" style={{
              background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #fef3c7',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: '#fffbeb',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <AlertTriangle size={36} color="#f59e0b" />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1a1729', marginBottom: 8 }}>
                Certificate Revoked
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6 }}>
                This certificate for <strong>{cert.artwork_title}</strong> has been revoked
                {cert.revoked_at ? ` on ${formatDate(cert.revoked_at)}` : ''}.
              </p>
            </div>
          )}

          {/* Valid / Invalid certificate */}
          {(state === 'valid' || state === 'invalid') && cert && (
            <div className="vc-fade" style={{
              background: '#fff', borderRadius: 24, overflow: 'hidden',
              boxShadow: '0 8px 48px rgba(124,58,237,0.12)',
              border: `1.5px solid ${isValid ? '#ede9fe' : '#fca5a5'}`,
            }}>

              {/* Status banner */}
              <div style={{
                background: isValid
                  ? `linear-gradient(135deg, ${P} 0%, ${T} 100%)`
                  : 'linear-gradient(135deg, #ef4444, #f97316)',
                padding: '28px 32px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div className="vc-check" style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {isValid
                    ? <CheckCircle size={30} color="#fff" />
                    : <XCircle size={30} color="#fff" />
                  }
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', marginBottom: 4 }}>
                    {isValid ? 'Authentic Artwork' : 'Verification Failed'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    {isValid
                      ? 'This certificate has been verified by Regestra'
                      : 'This certificate could not be verified'
                    }
                  </div>
                </div>
              </div>

              {/* Artwork image */}
              {cert.artwork_image_url && (
                <div style={{ height: 240, overflow: 'hidden', position: 'relative' }}>
                  <img src={cert.artwork_image_url} alt={cert.artwork_title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                    }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, transparent 50%)',
                  }} />
                </div>
              )}

              {/* Certificate details */}
              <div style={{ padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 32px) clamp(16px, 4vw, 32px)' }}>

                {/* Artwork title + artist */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1a1729', letterSpacing: '-0.02em', marginBottom: 6 }}>
                    {cert.artwork_title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.9rem', color: P, fontWeight: 600 }}>
                      by {cert.artist_name}
                    </span>
                    {isVerifiedArtist && <VerifiedArtistBadge size="sm" showLabel={true} />}
                  </div>
                </div>

                {/* Certificate number */}
                <div style={{
                  background: '#f9f8ff', borderRadius: 14, padding: '14px 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 20,
                }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                      Certificate Number
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 900, color: P, letterSpacing: '0.08em' }}>
                      {cert.cert_number}
                    </div>
                  </div>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `linear-gradient(135deg, ${P}, ${T})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <img src={LOGO} alt="Regestra" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                  </div>
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: 12, marginBottom: 20 }}>
                  {/* Issued by (always the artist) */}
                  <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Issued by</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1729' }}>
                      {cert.artist_name}
                    </div>
                  </div>
                  {/* Current owner — buyer if sold, otherwise artist holds it */}
                  <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                      {cert.buyer_name && cert.buyer_name !== cert.artist_name ? 'Current Owner' : 'Held by Artist'}
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1729' }}>
                      {cert.buyer_name || cert.artist_name}
                    </div>
                    {cert.buyer_email && cert.buyer_name !== cert.artist_name && (
                      <div style={{ fontSize: '0.75rem', color: P, marginTop: 2 }}>{cert.buyer_email}</div>
                    )}
                  </div>
                  <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Date Issued</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1729' }}>
                      {formatDate(cert.sale_date)}
                    </div>
                  </div>
                  {cert.sale_price != null && (
                    <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Sale Price</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: T }}>
                        {formatPrice(cert.sale_price)}
                      </div>
                    </div>
                  )}
                  {cert.artwork_medium && (
                    <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Medium</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1729' }}>
                        {cert.artwork_medium}
                      </div>
                    </div>
                  )}
                  {cert.artwork_dimensions && (
                    <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Dimensions</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1729' }}>
                        {cert.artwork_dimensions}
                      </div>
                    </div>
                  )}
                  {cert.artwork_year && (
                    <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Year Created</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1729' }}>
                        {cert.artwork_year}
                      </div>
                    </div>
                  )}
                </div>

                {/* Artwork description */}
                {cert.artwork_description && (
                  <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>About this work</div>
                    <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.7, margin: 0 }}>
                      {cert.artwork_description}
                    </p>
                  </div>
                )}

                {/* Verified badge */}
                {isValid && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4, #faf5ff)',
                    border: '1.5px solid #bbf7d0', borderRadius: 14,
                    padding: '14px 18px', marginBottom: 24,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d' }}>
                        Verified by Regestra
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                        Issued on {formatDate(cert.created_at)} · Certificate is genuine and unaltered
                      </div>
                    </div>
                  </div>
                )}

                {/* Provenance history */}
                {history.length > 1 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
                      Ownership History
                    </div>
                    <div style={{ position: 'relative' }}>
                      {/* Timeline line */}
                      <div style={{ position: 'absolute', left: 15, top: 8, bottom: 8, width: 2, background: 'linear-gradient(to bottom, #ede9fe, #d1fae5)', borderRadius: 99 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {history.map((h, i) => {
                          const isCurrent = h.cert_number === cert.cert_number;
                          const isLast = i === history.length - 1;
                          return (
                            <div key={h.id} style={{ display: 'flex', gap: 16, paddingBottom: isLast ? 0 : 16 }}>
                              {/* Dot */}
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                background: isCurrent ? `linear-gradient(135deg, ${P}, ${T})` : '#f0ebff',
                                border: `2px solid ${isCurrent ? P : '#ede9fe'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                zIndex: 1,
                              }}>
                                <CheckCircle size={14} color={isCurrent ? '#fff' : P} />
                              </div>
                              {/* Info */}
                              <div style={{
                                flex: 1, background: isCurrent ? '#f9f8ff' : '#fff',
                                border: `1.5px solid ${isCurrent ? '#ede9fe' : '#f3f4f6'}`,
                                borderRadius: 12, padding: '10px 14px',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1a1729' }}>
                                    {h.buyer_name}
                                    {isCurrent && (
                                      <span style={{ marginLeft: 8, fontSize: '0.62rem', fontWeight: 700, color: P, background: '#ede9fe', padding: '2px 7px', borderRadius: 99 }}>
                                        Current
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600 }}>
                                    {formatDate(h.sale_date)}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  {h.sale_price != null && (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: T }}>
                                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(h.sale_price)}
                                    </span>
                                  )}
                                  <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#9ca3af' }}>
                                    {h.cert_number}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer — Regestra branding + explorer link */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 20, borderTop: '1px solid #f0ebff',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={LOGO} alt="Regestra" style={{ height: 28, width: 'auto' }} />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1a1729' }}>Regestra</div>
                      <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>regestra.com</div>
                    </div>
                  </div>
                  <Link to="/explorer" style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: '0.78rem', fontWeight: 700, color: P,
                    textDecoration: 'none',
                    padding: '8px 14px', borderRadius: 99,
                    background: '#f5f0ff', border: '1px solid #ede9fe',
                  }}>
                    View Explorer <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Idle state — nothing shown */}
          {state === 'idle' && null}

        </div>
      </div>

      {currentUser && (
        <MobileNavFooter
          hasUnreadMessages={false}
          onChangePasswordClick={() => setShowChangePasswordModal(true)}
          onSignOut={handleSignOut}
        />
      )}
      {showChangePasswordModal && <ChangePasswordModal onClose={() => setShowChangePasswordModal(false)} />}
    </>
  );
}
