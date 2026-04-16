import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, CheckCircle, Loader2, ChevronRight, Lock, Upload, MessageCircle, Bell, ShoppingBag, Award, Shield } from 'lucide-react';
import { certDb, Certificate } from '../services/certificates';
import { useUser } from '../context/UserContext';
import Logo from '../components/Logo';
import { Button } from '../components/ui/Button';
import { SearchComponent } from '../components/Search';
import MobileNavFooter from '../components/MobileNavFooter';
import ChangePasswordModal from '../components/ChangePasswordModal';

const P = '#7c3aed';
const T = '#0d9488';
const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_691b6257d4173f2ed6ec3e95/7495ad18b_RegestraLogo.png';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 30) return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

function CertCard({ cert, isLoggedIn }: { cert: Certificate; isLoggedIn: boolean }) {
  const isVerified = cert.tier === 'blockchain' || cert.tier === 'basic';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      overflow: 'hidden',
      border: '1.5px solid #f0ebff',
      boxShadow: '0 2px 16px rgba(124,58,237,0.06)',
      transition: 'transform 150ms, box-shadow 150ms',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(124,58,237,0.14)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(124,58,237,0.06)';
    }}
    >
      {/* Artwork image */}
      <div style={{ position: 'relative', height: 180, background: 'linear-gradient(135deg, #f5f0ff, #e8fdf8)', overflow: 'hidden' }}>
        {cert.artwork_image_url ? (
          <img src={cert.artwork_image_url} alt={cert.artwork_title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={LOGO} alt="Regestra" style={{ width: 48, opacity: 0.2 }} />
          </div>
        )}
        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />

        {/* Verified badge */}
        {isVerified && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 99, padding: '3px 10px',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.65rem', fontWeight: 700, color: '#16a34a',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}>
            <CheckCircle size={10} /> Verified
          </div>
        )}

        {/* Cert number */}
        <div style={{
          position: 'absolute', bottom: 10, left: 12,
          fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800,
          color: '#fff', letterSpacing: '0.05em',
        }}>
          {cert.cert_number}
        </div>

        {/* Time */}
        <div style={{
          position: 'absolute', bottom: 10, right: 12,
          fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600,
        }}>
          {timeAgo(cert.created_at)}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{
          fontSize: '0.95rem', fontWeight: 800, color: '#1a1729',
          marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {cert.artwork_title}
        </div>
        <div style={{ fontSize: '0.78rem', color: P, fontWeight: 600, marginBottom: 14 }}>
          by {cert.artist_name}
        </div>

        {/* Acquired by */}
        <div style={{
          background: '#f9f8ff', borderRadius: 10, padding: '10px 12px', marginBottom: 14,
          minHeight: 52, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          {isLoggedIn ? (
            <>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                Acquired by
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1729' }}>
                {cert.buyer_name}
              </div>
              {cert.sale_price != null && (
                <div style={{ fontSize: '0.75rem', color: T, fontWeight: 700, marginTop: 2 }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cert.sale_price)}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>
              <Lock size={11} />
              <Link to="/login" style={{ color: P, fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
              &nbsp;to see ownership
            </div>
          )}
        </div>

        {/* Verify button */}
        <Link to={`/verify/${cert.cert_number}`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '10px 0', borderRadius: 12, textDecoration: 'none',
          background: `linear-gradient(135deg, ${P}, ${T})`,
          color: '#fff', fontSize: '0.82rem', fontWeight: 700,
        }}>
          <CheckCircle size={13} /> View Certificate
        </Link>
      </div>
    </div>
  );
}

export default function CertExplorer() {
  const { currentUser, setCurrentUser } = useUser();
  const navigate = useNavigate();
  const isLoggedIn = !!currentUser;
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const handleSignOut = async () => { await setCurrentUser(null); navigate('/'); };

  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const loadFeatured = useCallback(async () => {
    setLoading(true);
    try {
      const [featured, total] = await Promise.all([
        certDb.getFeatured(24),
        certDb.getTotalCount(),
      ]);
      setCerts(featured);
      setTotalCount(total);
    } catch (e) {
      console.error('Failed to load certs', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeatured(); }, [loadFeatured]);

  useEffect(() => {
    if (!query.trim()) { loadFeatured(); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await certDb.search(query);
        setCerts(results);
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query, loadFeatured]);

  return (
    <>
      <style>{`
        @keyframes ex-fade { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        .ex-fade { animation: ex-fade 400ms ease forwards; }
        .ex-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
        @media(max-width:640px){ .ex-grid { grid-template-columns:1fr; } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f8f6ff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

        {/* Nav — matches Layout.tsx */}
        <header
          className="bg-white sticky top-0 z-50"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/"><Logo className="h-7 w-auto" /></Link>
              {currentUser ? (
                <>
                  {/* Desktop/tablet (md+): search + full nav icons */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="w-96 desktop-search-bar"><SearchComponent /></div>
                    <nav className="flex items-center gap-1">
                      <Link to="/marketplace"><Button variant="ghost" size="icon" className="rounded-full"><ShoppingBag className="w-5 h-5" /></Button></Link>
                      <Link to="/verify"><Button variant="ghost" size="icon" className="rounded-full" title="Verify Certificate"><Award className="w-5 h-5" /></Button></Link>
                      <Link to="/upload"><Button variant="ghost" size="icon" className="rounded-full"><Upload className="w-5 h-5" /></Button></Link>
                      <Link to="/messages"><Button variant="ghost" size="icon" className="rounded-full"><MessageCircle className="w-5 h-5" /></Button></Link>
                      <Button variant="ghost" size="icon" className="rounded-full"><Bell className="w-5 h-5" /></Button>
                      {currentUser?.is_admin && (
                        <Link to="/admin"><Button variant="ghost" size="icon" className="rounded-full" title="Admin Dashboard"><Shield className="w-5 h-5 text-purple-600" /></Button></Link>
                      )}
                      <Link to={`/profile/${currentUser.username}`}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <img src={currentUser.avatar} alt="profile" className="w-8 h-8 rounded-full object-cover" />
                        </Button>
                      </Link>
                    </nav>
                  </div>
                  {/* Mobile: centered search */}
                  <div className="flex md:hidden flex-1 items-center justify-center px-3">
                    <div style={{ flex: 1, maxWidth: 260 }}><SearchComponent /></div>
                  </div>
                  {/* Mobile: bell only */}
                  <div className="flex md:hidden items-center">
                    <Button variant="ghost" size="icon" className="rounded-full"><Bell className="w-6 h-6" /></Button>
                    {currentUser?.is_admin && (
                      <Link to="/admin"><Button variant="ghost" size="icon" className="rounded-full" title="Admin Dashboard"><Shield className="w-6 h-6 text-purple-600" /></Button></Link>
                    )}
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

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
              Regestra
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1a1729', letterSpacing: '-0.03em', marginBottom: 12 }}>
              Certificate Explorer
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#6b7280', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 28px' }}>
              Every artwork certificate issued on Regestra is publicly recorded and verifiable.
            </p>

            {/* Stats */}
            <div style={{ display: 'inline-flex', gap: 0, background: '#fff', borderRadius: 16, border: '1.5px solid #f0ebff', overflow: 'hidden', boxShadow: '0 2px 12px rgba(124,58,237,0.07)' }}>
              <div style={{ padding: '14px 28px', borderRight: '1px solid #f0ebff' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: P }}>{totalCount}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Certificates</div>
              </div>
              <div style={{ padding: '14px 28px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: T }}>{certs.filter(c => c.tier === 'blockchain').length}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Authenticated</div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ maxWidth: 560, margin: '0 auto 40px', position: 'relative' }}>
            <Search size={17} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
            {searching && <Loader2 size={15} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', animation: 'spin 0.8s linear infinite' }} />}
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by artwork, artist, or certificate number..."
              style={{
                width: '100%', padding: '14px 18px 14px 46px',
                background: '#fff', border: '1.5px solid #e5e7eb',
                borderRadius: 14, fontSize: '0.9rem', color: '#1a1729',
                outline: 'none', transition: 'border-color 150ms',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
              onFocus={e => (e.target.style.borderColor = P)}
              onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
            />
          </div>

          {/* Section label */}
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20, textAlign: 'center' }}>
            {query.trim() ? `Results for "${query}"` : 'Featured Certificates'}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: `linear-gradient(135deg, ${P}, ${T})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                animation: 'ex-pulse 1.4s ease-in-out infinite',
              }}>
                <Loader2 size={24} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <div style={{ color: '#9ca3af', fontWeight: 600 }}>Loading certificates...</div>
            </div>
          ) : certs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1729', marginBottom: 8 }}>No certificates found</div>
              <div style={{ color: '#9ca3af', fontSize: '0.88rem' }}>
                {query ? 'Try a different search.' : 'No certificates have been issued yet.'}
              </div>
            </div>
          ) : (
            <div className="ex-grid ex-fade">
              {certs.map(cert => (
                <CertCard key={cert.id} cert={cert} isLoggedIn={isLoggedIn} />
              ))}
            </div>
          )}

          {/* Load more */}
          {!loading && certs.length > 0 && !query && certs.length < totalCount && (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <button
                onClick={async () => {
                  const more = await certDb.getAll(24, certs.length);
                  setCerts(prev => [...prev, ...more]);
                }}
                style={{
                  padding: '12px 32px', borderRadius: 12,
                  background: `linear-gradient(135deg, ${P}, ${T})`,
                  border: 'none', color: '#fff', fontWeight: 700,
                  fontSize: '0.9rem', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                Load More <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* Footer note */}
          {!loading && !isLoggedIn && (
            <div style={{ textAlign: 'center', marginTop: 48, padding: '20px', background: '#fff', borderRadius: 16, border: '1px solid #f0ebff', maxWidth: 420, margin: '48px auto 0' }}>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                <Link to="/login" style={{ color: P, fontWeight: 700, textDecoration: 'none' }}>Log in</Link> to see full ownership details on each certificate
              </p>
            </div>
          )}
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
