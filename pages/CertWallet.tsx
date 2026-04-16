import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Loader2, X, ExternalLink } from 'lucide-react';
import { certDb, Certificate, CertTransfer } from '../services/certificates';
import { useUser } from '../context/UserContext';
import { TransferCertificateModal } from '../components/TransferCertificateModal';

const P = '#7c3aed';
const T = '#0d9488';

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function CertCard({
  cert,
  isOwned,
  onClick,
}: {
  cert: Certificate;
  isOwned: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '3/4',
        background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 40%, #6366f1 100%)',
        boxShadow: hovered
          ? '0 24px 64px rgba(124,58,237,0.3)'
          : '0 4px 20px rgba(0,0,0,0.15)',
        transform: hovered ? 'translateY(-6px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: 'all 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Artwork image */}
      {cert.artwork_image_url ? (
        <img
          src={cert.artwork_image_url}
          alt={cert.artwork_title}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onError={e => {
            const el = e.target as HTMLImageElement;
            el.style.display = 'none';
          }}
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 40%, #6366f1 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ opacity: 0.15, fontSize: '4rem' }}>✦</div>
        </div>
      )}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(90,30,180,0.85) 0%, rgba(90,30,180,0.3) 40%, rgba(0,0,0,0.05) 100%)',
        opacity: hovered ? 1 : 0.85,
        transition: 'opacity 350ms',
      }} />

      {/* Verified badge */}
      {cert.tier === 'blockchain' && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 99, padding: '4px 10px',
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: '0.62rem', fontWeight: 700, color: '#fff',
        }}>
          <CheckCircle size={9} color="#4ade80" /> Verified
        </div>
      )}

      {/* Bottom info */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '20px 18px 18px',
      }}>
        <div style={{
          fontSize: '1rem', fontWeight: 800, color: '#fff',
          letterSpacing: '-0.01em', lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 4,
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          {cert.artwork_title}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
          by {cert.artist_name}
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.35)', marginTop: 6, letterSpacing: '0.04em',
        }}>
          {cert.cert_number}
        </div>
      </div>

      {/* Hover — tap to view */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: hovered ? 1 : 0, transition: 'opacity 250ms',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 14, padding: '10px 20px',
          fontSize: '0.82rem', fontWeight: 700, color: '#fff',
          letterSpacing: '0.02em',
        }}>
          View Certificate
        </div>
      </div>
    </div>
  );
}

function CertDetailPanel({
  cert,
  isOwned,
  history,
  loadingHistory,
  onTransfer,
  onClose,
}: {
  cert: Certificate;
  isOwned: boolean;
  history: CertTransfer[];
  loadingHistory: boolean;
  onTransfer: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        background: 'rgba(100,40,200,0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
        animation: 'wbg-in 250ms ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        style={{
          background: '#fff',
          borderRadius: '28px 28px 0 0',
          width: '100%', maxWidth: 680,
          maxHeight: '85vh', overflowY: 'auto',
          animation: 'wpanel-in 350ms cubic-bezier(0.34, 1.2, 0.64, 1)',
          padding: '0 0 40px',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 8px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#e5e7eb' }} />
        </div>

        {/* Artwork image header */}
        <div style={{ position: 'relative', height: 220, overflow: 'hidden', margin: '0 24px', borderRadius: 20 }}>
          {cert.artwork_image_url ? (
            <img src={cert.artwork_image_url} alt={cert.artwork_title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 40%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '3rem', opacity: 0.2 }}>✦</div>
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, transparent 50%)', borderRadius: 20 }} />

          {/* Close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 12,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(80,20,160,0.3)', backdropFilter: 'blur(4px)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={14} color="#fff" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 28px 0' }}>

          {/* Title + cert number */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1a1729', letterSpacing: '-0.02em', marginBottom: 4 }}>
              {cert.artwork_title}
            </h2>
            <div style={{ fontSize: '0.85rem', color: P, fontWeight: 600, marginBottom: 8 }}>
              by {cert.artist_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 800, color: '#9ca3af', letterSpacing: '0.05em' }}>
                {cert.cert_number}
              </span>
              {cert.tier === 'blockchain' && (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 99, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <CheckCircle size={9} /> Verified
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Issued by</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1729' }}>{cert.artist_name}</div>
            </div>
            <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                {cert.buyer_name && cert.buyer_name !== cert.artist_name ? 'Current Owner' : 'Held by Artist'}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1729' }}>
                {cert.buyer_name || cert.artist_name}
              </div>
              {cert.buyer_email && cert.buyer_name !== cert.artist_name && (
                <div style={{ fontSize: '0.72rem', color: P, marginTop: 1 }}>{cert.buyer_email}</div>
              )}
            </div>
            <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Date Issued</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1729' }}>{formatDate(cert.sale_date)}</div>
            </div>
            {cert.sale_price != null && (
              <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Sale Price</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: T }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cert.sale_price)}
                </div>
              </div>
            )}
            {cert.artwork_medium && (
              <div style={{ background: '#f9f8ff', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Medium</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1729' }}>{cert.artwork_medium}</div>
              </div>
            )}
          </div>

          {/* Transfer history */}
          {(loadingHistory || history.length > 0) && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                Ownership History
              </div>
              {loadingHistory ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                  <Loader2 size={18} color={P} style={{ animation: 'wspin 0.8s linear infinite' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {history.slice(0, 3).map((h, i) => (
                    <div key={h.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: '#f9f8ff', borderRadius: 12, padding: '10px 14px',
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === history.length - 1 ? `linear-gradient(135deg, ${P}, ${T})` : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ArrowRight size={11} color={i === history.length - 1 ? '#fff' : P} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a1729' }}>
                          {h.from_name} → {h.to_name}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 1 }}>{formatDate(h.transferred_at)}</div>
                      </div>
                      {h.sale_price != null && (
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: T }}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(h.sale_price)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to={`/verify/${cert.cert_number}`} style={{
              flex: 1, padding: '12px', borderRadius: 14, textDecoration: 'none',
              background: '#f5f0ff', color: P, fontWeight: 700, fontSize: '0.85rem',
              textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <ExternalLink size={13} /> View Certificate
            </Link>
            {isOwned && (
              <button onClick={onTransfer} style={{
                flex: 1, padding: '12px', borderRadius: 14, border: 'none',
                background: `linear-gradient(135deg, ${P}, ${T})`,
                color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <ArrowRight size={13} /> Transfer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CertWallet() {
  const { currentUser } = useUser();
  const currentUserRef = React.useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  const [activeTab, setActiveTab] = useState<'owned' | 'issued'>('owned');
  const [owned, setOwned] = useState<Certificate[]>([]);
  const [issued, setIssued] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [history, setHistory] = useState<CertTransfer[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [transferCert, setTransferCert] = useState<Certificate | null>(null);

  const load = useCallback(async () => {
    const cu = currentUserRef.current;
    if (!cu?.id) return;
    setLoading(true);
    try {
      const [o, i] = await Promise.all([
        certDb.getOwned(cu.id),
        certDb.getIssued(cu.id),
      ]);
      setOwned(o);
      setIssued(i);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []); // stable — currentUser accessed via ref

  useEffect(() => { load(); }, [load]);

  const handleSelect = async (cert: Certificate) => {
    setSelectedCert(cert);
    setHistory([]);
    setLoadingHistory(true);
    try {
      const h = await certDb.getTransferHistory(cert.id);
      setHistory(h);
    } catch { /* ignore */ }
    finally { setLoadingHistory(false); }
  };

  const displayCerts = activeTab === 'owned' ? owned : issued;
  const isOwned = activeTab === 'owned';

  if (!currentUser) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: '2rem', marginBottom: 16 }}>✦</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1a1729', marginBottom: 8 }}>Regestra Wallet</h2>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>Log in to view your certificates.</p>
        <Link to="/login" style={{ padding: '11px 28px', borderRadius: 12, background: `linear-gradient(135deg, ${P}, ${T})`, color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
          Log in
        </Link>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes wspin { to { transform: rotate(360deg); } }
        @keyframes wbg-in { from{opacity:0} to{opacity:1} }
        @keyframes wpanel-in { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes wcard-in { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .w-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        @media(max-width:720px){ .w-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:440px){ .w-grid { grid-template-columns:1fr; } }
      `}</style>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 80px' }}>

        {/* Hero banner */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 40%, #6366f1 100%)',
          padding: '48px 32px 40px',
          position: 'relative', overflow: 'hidden',
          marginBottom: 40,
        }}>
          {/* Glow */}
          <div style={{ position: 'absolute', top: -60, left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, right: '20%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>
                {currentUser.name}
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 6 }}>
                Regestra Wallet
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 700, lineHeight: 1.5 }}>
                Your artwork certificates and ownership records
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 24px', borderRight: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff' }}>{owned.length}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Owned</div>
              </div>
              <div style={{ padding: '14px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff' }}>{issued.length}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Issued</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 24px' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', background: '#f3f0ff', borderRadius: 14, padding: 4, gap: 2 }}>
              {([['owned', 'Owned', owned.length], ['issued', 'Issued', issued.length]] as const).map(([tab, label, count]) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '8px 20px', borderRadius: 10, border: 'none',
                  background: activeTab === tab ? '#fff' : 'transparent',
                  color: activeTab === tab ? P : '#9ca3af',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  boxShadow: activeTab === tab ? '0 1px 6px rgba(124,58,237,0.12)' : 'none',
                  transition: 'all 200ms',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  {label}
                  {count > 0 && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, background: activeTab === tab ? P : '#e5e7eb', color: activeTab === tab ? '#fff' : '#9ca3af', padding: '1px 6px', borderRadius: 99, minWidth: 18, textAlign: 'center' }}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <Link to="/explorer" style={{ fontSize: '0.78rem', color: P, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, opacity: 0.7 }}>
              Explorer →
            </Link>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <Loader2 size={28} color={P} style={{ animation: 'wspin 0.8s linear infinite' }} />
            </div>
          ) : displayCerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 24, border: '1.5px dashed #e5e7eb' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✦</div>
              <div style={{ fontWeight: 800, color: '#1a1729', marginBottom: 6, fontSize: '1rem' }}>
                {activeTab === 'owned' ? 'No certificates in your wallet' : 'No certificates issued yet'}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: 20 }}>
                {activeTab === 'owned'
                  ? 'Certificates transferred to you will appear here.'
                  : 'Issue a Certificate of Authenticity when uploading artwork.'}
              </p>
              {activeTab === 'issued' && (
                <Link to="/upload" style={{ padding: '9px 20px', borderRadius: 10, background: `linear-gradient(135deg, ${P}, ${T})`, color: '#fff', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                  Upload Artwork
                </Link>
              )}
            </div>
          ) : (
            <div className="w-grid">
              {displayCerts.map((cert, i) => (
                <div key={cert.id} style={{ animation: `wcard-in 400ms ease ${i * 50}ms both` }}>
                  <CertCard cert={cert} isOwned={isOwned} onClick={() => handleSelect(cert)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedCert && (
        <CertDetailPanel
          cert={selectedCert}
          isOwned={isOwned}
          history={history}
          loadingHistory={loadingHistory}
          onTransfer={() => { setTransferCert(selectedCert); setSelectedCert(null); }}
          onClose={() => setSelectedCert(null)}
        />
      )}

      {/* Transfer modal */}
      {transferCert && currentUser && (
        <TransferCertificateModal
          cert={transferCert}
          fromUserId={currentUser.id}
          onClose={() => setTransferCert(null)}
          onTransferred={() => { setTransferCert(null); load(); }}
        />
      )}
    </>
  );
}
