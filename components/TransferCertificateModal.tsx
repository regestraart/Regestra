import React, { useState, useRef } from 'react';
import { X, Send, Search, CheckCircle, Loader2, Award, ArrowRight } from 'lucide-react';
import { certDb, Certificate, CertTransfer } from '../services/certificates';
import { supabase } from '../lib/supabase';

const P = '#7c3aed';
const T = '#0d9488';

interface TransferCertificateModalProps {
  cert: Certificate;
  fromUserId: string;
  onClose: () => void;
  onTransferred: () => void;
}

type Step = 'form' | 'transferring' | 'success';

export const TransferCertificateModal: React.FC<TransferCertificateModalProps> = ({
  cert, fromUserId, onClose, onTransferred,
}) => {
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    to_name: '',
    to_username: '',
    transfer_type: 'transfer' as 'sale' | 'transfer' | 'gift' | 'external',
    sale_price: '',
    sale_date: new Date().toISOString().split('T')[0],
    artwork_medium: cert.artwork_medium || '',
    artwork_dimensions: cert.artwork_dimensions || '',
    artwork_year: cert.artwork_year || '',
    artwork_description: cert.artwork_description || '',
    note: '',
  });

  // Username search
  const [usernameResults, setUsernameResults] = useState<Array<{id: string; username: string; name: string; avatar?: string}>>([]);
  const [searchingUsername, setSearchingUsername] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{id: string; username: string; name: string} | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleUsernameInput = (value: string) => {
    setForm(prev => ({ ...prev, to_username: value }));
    setSelectedRecipient(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value.trim() || value.length < 2) { setUsernameResults([]); setShowDropdown(false); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchingUsername(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .ilike('username', `%${value.replace(/^@/, '')}%`)
          .limit(6);
        const results = (data || []).map((p: any) => ({
          id: p.id, username: p.username,
          name: p.full_name || p.username, avatar: p.avatar_url,
        }));
        setUsernameResults(results);
        setShowDropdown(results.length > 0);
      } catch { /* ignore */ }
      finally { setSearchingUsername(false); }
    }, 300);
  };

  const selectRecipient = (r: {id: string; username: string; name: string}) => {
    setSelectedRecipient(r);
    setForm(prev => ({ ...prev, to_username: r.username, to_name: prev.to_name || r.name }));
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    if (!form.to_name.trim()) { setError('Recipient name is required.'); return; }
    if (form.transfer_type === 'sale' && (!form.sale_price || parseFloat(form.sale_price) <= 0)) {
      setError('Sale price is required for a sale transfer.'); return;
    }
    setError(null);
    setStep('transferring');
    try {
      await certDb.transfer(cert.id, fromUserId, {
        to_user_id: selectedRecipient?.id ?? null,
        to_name: form.to_name.trim(),
        to_username: form.to_username.trim().replace(/^@/, '') || undefined,
        transfer_type: form.transfer_type,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        sale_date: form.sale_date,
        artwork_medium: form.artwork_medium || undefined,
        artwork_dimensions: form.artwork_dimensions || undefined,
        artwork_year: form.artwork_year || undefined,
        artwork_description: form.artwork_description || undefined,
        note: form.note || undefined,
      });
      setStep('success');
    } catch (e: any) {
      setError(e.message || 'Transfer failed.');
      setStep('form');
    }
  };

  const transferTypeLabels = {
    sale: 'Sold',
    transfer: 'Transferred',
    gift: 'Gifted',
    external: 'External Sale',
  };

  return (
    <>
      <style>{`
        @keyframes tc-spin { to { transform: rotate(360deg); } }
        @keyframes tc-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes tc-fade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .tc-backdrop {
          position: fixed; inset: 0; z-index: 1300;
          background: rgba(10,0,30,0.75); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .tc-card {
          background: #fff; border-radius: 24px; width: 100%; max-width: 560px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 24px 80px rgba(124,58,237,0.25);
          animation: tc-fade 300ms ease;
        }
        .tc-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 24px 0;
        }
        .tc-body { padding: 20px 24px 28px; }
        .tc-label {
          display: block; font-size: 0.75rem; font-weight: 700;
          color: #374151; margin-bottom: 6px; letter-spacing: 0.01em;
        }
        .tc-input {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #e5e7eb; border-radius: 10px;
          font-size: 0.88rem; color: #1a1729; background: #fff;
          outline: none; transition: border-color 150ms; box-sizing: border-box;
        }
        .tc-input:focus { border-color: ${P}; }
        .tc-section { font-size: 0.68rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin: 20px 0 12px; }
        .tc-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tc-type-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 16px; }
        .tc-type-btn {
          padding: 8px 4px; border-radius: 10px; border: 1.5px solid #e5e7eb;
          background: #fff; font-size: 0.75rem; font-weight: 700; color: #6b7280;
          cursor: pointer; text-align: center; transition: all 150ms;
        }
        .tc-type-btn.active { border-color: ${P}; background: #faf5ff; color: ${P}; }
        .tc-submit {
          width: 100%; padding: 13px; border: none; border-radius: 12px;
          background: linear-gradient(135deg, ${P}, ${T});
          color: #fff; font-size: 0.9rem; font-weight: 800;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 20px; transition: opacity 150ms;
        }
        .tc-submit:hover { opacity: 0.92; }
        .tc-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .tc-error { font-size: 0.82rem; color: #ef4444; font-weight: 600; margin-bottom: 12px; }
        .tc-close { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 8px; color: #9ca3af; }
        .tc-close:hover { background: #f3f4f6; color: #1a1729; }
      `}</style>

      <div className="tc-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="tc-card">

          {/* Header */}
          <div className="tc-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${P}, ${T})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowRight size={17} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1a1729' }}>Transfer Certificate</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 1 }}>
                  {cert.cert_number} · {cert.artwork_title}
                </div>
              </div>
            </div>
            <button className="tc-close" onClick={onClose}><X size={16} /></button>
          </div>

          <div className="tc-body">

            {/* ── FORM ── */}
            {step === 'form' && (
              <>
                {/* Artwork preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f9f8ff', border: '1px solid #ede9fe', borderRadius: 14, padding: '12px 14px', marginBottom: 20 }}>
                  {cert.artwork_image_url ? (
                    <img src={cert.artwork_image_url} alt={cert.artwork_title} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Award size={20} color={P} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1729' }}>{cert.artwork_title}</div>
                    <div style={{ fontSize: '0.75rem', color: P, marginTop: 2 }}>by {cert.artist_name}</div>
                  </div>
                </div>

                {/* Transfer type */}
                <div className="tc-section">Transfer type</div>
                <div className="tc-type-grid">
                  {(['sale', 'transfer', 'gift', 'external'] as const).map(t => (
                    <button key={t} className={`tc-type-btn ${form.transfer_type === t ? 'active' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, transfer_type: t }))}>
                      {transferTypeLabels[t]}
                    </button>
                  ))}
                </div>

                {/* Recipient */}
                <div className="tc-section">Recipient information</div>
                <div style={{ marginBottom: 14 }}>
                  <label className="tc-label">Full name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="tc-input" placeholder="Recipient's full name"
                    value={form.to_name} onChange={e => setForm(prev => ({ ...prev, to_name: e.target.value }))} />
                </div>

                {/* Username search */}
                <div style={{ marginBottom: 14, position: 'relative' }}>
                  <label className="tc-label">Regestra username <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 400 }}>(optional — search to auto-add to their collection)</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.88rem', pointerEvents: 'none' }}>@</span>
                    {searchingUsername && <Loader2 size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', animation: 'tc-spin 0.8s linear infinite' }} />}
                    {selectedRecipient && !searchingUsername && <CheckCircle size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#16a34a' }} />}
                    <input className="tc-input" style={{ paddingLeft: 26, paddingRight: 30 }} placeholder="username"
                      value={form.to_username.replace(/^@/, '')}
                      onChange={e => handleUsernameInput(e.target.value)}
                      onFocus={() => usernameResults.length > 0 && setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      autoComplete="off"
                    />
                    {showDropdown && usernameResults.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', border: '1.5px solid #ede9fe', borderRadius: 12, boxShadow: '0 8px 24px rgba(124,58,237,0.12)', marginTop: 4, overflow: 'hidden' }}>
                        {usernameResults.map(u => (
                          <div key={u.id} onMouseDown={() => selectRecipient(u)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f3ff' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#faf5ff')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, color: P }}>
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1729' }}>{u.name}</div>
                              <div style={{ fontSize: '0.75rem', color: P }}>@{u.username}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedRecipient && (
                    <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={11} /> Regestra account found — artwork will be added to their collection
                    </div>
                  )}
                </div>

                {/* Sale details */}
                <div className="tc-section">Sale / Transfer details</div>
                <div className="tc-grid2" style={{ marginBottom: 14 }}>
                  <div>
                    <label className="tc-label">
                      Sale price (USD)
                      {form.transfer_type === 'sale' && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
                    </label>
                    <input className="tc-input" type="number" min="0" step="0.01" placeholder="0.00"
                      value={form.sale_price} onChange={e => setForm(prev => ({ ...prev, sale_price: e.target.value }))} />
                  </div>
                  <div>
                    <label className="tc-label">Date</label>
                    <input className="tc-input" type="date"
                      value={form.sale_date} onChange={e => setForm(prev => ({ ...prev, sale_date: e.target.value }))} />
                  </div>
                </div>

                {/* Artwork details */}
                <div className="tc-section">Artwork details</div>
                <div className="tc-grid2" style={{ marginBottom: 12 }}>
                  <div>
                    <label className="tc-label">Medium</label>
                    <input className="tc-input" placeholder="Oil on canvas"
                      value={form.artwork_medium} onChange={e => setForm(prev => ({ ...prev, artwork_medium: e.target.value }))} />
                  </div>
                  <div>
                    <label className="tc-label">Year created</label>
                    <input className="tc-input" placeholder="2024"
                      value={form.artwork_year} onChange={e => setForm(prev => ({ ...prev, artwork_year: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="tc-label">Dimensions</label>
                  <input className="tc-input" placeholder='24" × 36"'
                    value={form.artwork_dimensions} onChange={e => setForm(prev => ({ ...prev, artwork_dimensions: e.target.value }))} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="tc-label">Artwork description</label>
                  <textarea className="tc-input" rows={3} placeholder="Describe the artwork..."
                    value={form.artwork_description}
                    onChange={e => setForm(prev => ({ ...prev, artwork_description: e.target.value }))}
                    style={{ resize: 'vertical', lineHeight: 1.5 }} />
                </div>
                <div>
                  <label className="tc-label">Note <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                  <input className="tc-input" placeholder="Any additional notes about this transfer..."
                    value={form.note} onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))} />
                </div>

                {error && <div className="tc-error" style={{ marginTop: 12 }}>{error}</div>}

                <button className="tc-submit" onClick={handleSubmit}>
                  <Send size={15} /> Transfer Certificate
                </button>
              </>
            )}

            {/* ── TRANSFERRING ── */}
            {step === 'transferring' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg, ${P}, ${T})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'tc-pulse 1.4s ease-in-out infinite' }}>
                  <ArrowRight size={28} color="#fff" />
                </div>
                <div style={{ fontWeight: 800, color: '#1a1729', marginBottom: 6 }}>Transferring certificate…</div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Updating ownership records</div>
              </div>
            )}

            {/* ── SUCCESS ── */}
            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ width: 68, height: 68, borderRadius: '50%', background: `linear-gradient(135deg, ${P}, ${T})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(124,58,237,0.25)' }}>
                  <CheckCircle size={32} color="#fff" />
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1a1729', marginBottom: 6 }}>Certificate Transferred</div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
                  {cert.artwork_title} has been transferred to <strong>{form.to_name}</strong>.
                  {selectedRecipient && ' It has been added to their collection on Regestra.'}
                </div>
                <button onClick={() => { onTransferred(); onClose(); }} style={{
                  padding: '11px 28px', borderRadius: 12, border: 'none',
                  background: `linear-gradient(135deg, ${P}, ${T})`,
                  color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                }}>
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};
