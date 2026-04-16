import React, { useState } from 'react';
import { X, Shield, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { verificationDb, VerificationRequest } from '../services/verification';

const P = '#7c3aed';
const T = '#0d9488';

interface VerificationModalProps {
  userId: string;
  existingRequest?: VerificationRequest | null;
  onClose: () => void;
  onSubmitted: (req: VerificationRequest) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  userId, existingRequest, onClose, onSubmitted,
}) => {
  const [form, setForm] = useState({
    full_legal_name: existingRequest?.full_legal_name || '',
    website_url: existingRequest?.website_url || '',
    instagram_url: existingRequest?.instagram_url || '',
    portfolio_url: existingRequest?.portfolio_url || '',
    statement: existingRequest?.statement || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const update = (field: string, val: string) =>
    setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async () => {
    if (!form.full_legal_name.trim()) { setError('Please enter your full legal name.'); return; }
    if (!form.statement.trim()) { setError('Please write a short statement.'); return; }
    setError(null);
    setSubmitting(true);
    try {
      const req = await verificationDb.submit(userId, {
        full_legal_name: form.full_legal_name.trim(),
        website_url: form.website_url.trim() || undefined,
        instagram_url: form.instagram_url.trim() || undefined,
        portfolio_url: form.portfolio_url.trim() || undefined,
        statement: form.statement.trim(),
      });
      setDone(true);
      onSubmitted(req);
    } catch (e: any) {
      setError(e.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes vm-fade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes vm-spin { to{transform:rotate(360deg)} }
        .vm-backdrop {
          position:fixed; inset:0; z-index:1400;
          background:rgba(10,0,30,0.7); backdrop-filter:blur(5px);
          display:flex; align-items:center; justify-content:center; padding:20px;
        }
        .vm-card {
          background:#fff; border-radius:24px; width:100%; max-width:520px;
          max-height:90vh; overflow-y:auto;
          box-shadow:0 24px 80px rgba(124,58,237,0.2);
          animation:vm-fade 300ms ease;
        }
        .vm-input {
          width:100%; padding:10px 14px;
          border:1.5px solid #e5e7eb; border-radius:10px;
          font-size:0.88rem; color:#1a1729; outline:none;
          transition:border-color 150ms; box-sizing:border-box;
          font-family:inherit;
        }
        .vm-input:focus { border-color:${P}; }
        .vm-label {
          display:block; font-size:0.75rem; font-weight:700;
          color:#374151; margin-bottom:6px;
        }
        .vm-field { margin-bottom:14px; }
        .vm-section {
          font-size:0.68rem; font-weight:700; color:#9ca3af;
          text-transform:uppercase; letter-spacing:0.1em; margin:20px 0 12px;
        }
      `}</style>

      <div className="vm-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="vm-card">

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'22px 24px 0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:`linear-gradient(135deg, ${P}, ${T})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Shield size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize:'1rem', fontWeight:800, color:'#1a1729' }}>Artist Verification</div>
                <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:1 }}>Apply for a Verified Artist badge</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:4, borderRadius:8, color:'#9ca3af' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ padding:'16px 24px 28px' }}>

            {done ? (
              /* Success */
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:`linear-gradient(135deg, ${P}, ${T})`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 32px rgba(124,58,237,0.25)' }}>
                  <CheckCircle size={30} color="#fff" />
                </div>
                <div style={{ fontSize:'1.1rem', fontWeight:900, color:'#1a1729', marginBottom:8 }}>Application Submitted</div>
                <p style={{ fontSize:'0.85rem', color:'#6b7280', lineHeight:1.6, marginBottom:24 }}>
                  Thank you! Your verification request is under review. We'll update your profile once a decision has been made.
                </p>
                <button onClick={onClose} style={{ padding:'10px 28px', borderRadius:12, border:'none', background:`linear-gradient(135deg, ${P}, ${T})`, color:'#fff', fontWeight:700, cursor:'pointer' }}>
                  Done
                </button>
              </div>
            ) : existingRequest?.status === 'pending' ? (
              /* Already submitted */
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ width:56, height:56, borderRadius:16, background:'#f5f0ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                  <Shield size={26} color={P} />
                </div>
                <div style={{ fontSize:'1rem', fontWeight:800, color:'#1a1729', marginBottom:6 }}>Application Under Review</div>
                <p style={{ fontSize:'0.85rem', color:'#6b7280', lineHeight:1.6, marginBottom:6 }}>
                  Your verification request was submitted on {new Date(existingRequest.submitted_at).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}.
                </p>
                <p style={{ fontSize:'0.82rem', color:'#9ca3af' }}>We'll notify you once a decision has been made.</p>
              </div>
            ) : existingRequest?.status === 'rejected' ? (
              /* Rejected — can reapply */
              <>
                <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:12, padding:'12px 14px', marginBottom:20, fontSize:'0.82rem', color:'#dc2626' }}>
                  <strong>Previous application was not approved.</strong>
                  {existingRequest.rejection_reason && <div style={{ marginTop:4, color:'#6b7280' }}>Reason: {existingRequest.rejection_reason}</div>}
                  <div style={{ marginTop:6, color:'#9ca3af' }}>You're welcome to reapply with updated information.</div>
                </div>
                {renderForm()}
              </>
            ) : (
              renderForm()
            )}
          </div>
        </div>
      </div>
    </>
  );

  function renderForm() {
    return (
      <>
        <p style={{ fontSize:'0.82rem', color:'#6b7280', lineHeight:1.6, marginBottom:16 }}>
          Verification confirms you are who you say you are. Verified artists receive a badge on their profile and certificates.
        </p>

        <div className="vm-section">Your identity</div>
        <div className="vm-field">
          <label className="vm-label">Full legal name <span style={{ color:'#ef4444' }}>*</span></label>
          <input className="vm-input" placeholder="As it appears on official ID"
            value={form.full_legal_name} onChange={e => update('full_legal_name', e.target.value)} />
        </div>

        <div className="vm-section">Your online presence <span style={{ fontWeight:400, textTransform:'none', fontSize:'0.68rem' }}>(at least one recommended)</span></div>
        <div className="vm-field">
          <label className="vm-label">Website</label>
          <input className="vm-input" placeholder="https://yourwebsite.com"
            value={form.website_url} onChange={e => update('website_url', e.target.value)} />
        </div>
        <div className="vm-field">
          <label className="vm-label">Instagram</label>
          <input className="vm-input" placeholder="https://instagram.com/yourusername"
            value={form.instagram_url} onChange={e => update('instagram_url', e.target.value)} />
        </div>
        <div className="vm-field">
          <label className="vm-label">Portfolio or other link</label>
          <input className="vm-input" placeholder="Behance, Artstation, gallery link..."
            value={form.portfolio_url} onChange={e => update('portfolio_url', e.target.value)} />
        </div>

        <div className="vm-section">Your statement</div>
        <div className="vm-field">
          <label className="vm-label">Tell us about yourself and your work <span style={{ color:'#ef4444' }}>*</span></label>
          <textarea className="vm-input" rows={4}
            placeholder="Who are you as an artist? What kind of work do you create? Why should Regestra verify you?"
            value={form.statement} onChange={e => update('statement', e.target.value)}
            style={{ resize:'vertical', lineHeight:1.6 }} />
          <div style={{ fontSize:'0.68rem', color:'#9ca3af', marginTop:4, textAlign:'right' }}>
            {form.statement.length}/500
          </div>
        </div>

        {error && (
          <div style={{ fontSize:'0.82rem', color:'#ef4444', fontWeight:600, marginBottom:12 }}>{error}</div>
        )}

        <button onClick={handleSubmit} disabled={submitting} style={{
          width:'100%', padding:'12px', borderRadius:12, border:'none',
          background:`linear-gradient(135deg, ${P}, ${T})`,
          color:'#fff', fontWeight:800, fontSize:'0.9rem',
          cursor:submitting ? 'not-allowed' : 'pointer',
          opacity:submitting ? 0.7 : 1,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
          {submitting
            ? <><Loader2 size={16} style={{ animation:'vm-spin 0.8s linear infinite' }} /> Submitting...</>
            : <><Shield size={15} /> Submit Verification Request</>
          }
        </button>
      </>
    );
  }
};
