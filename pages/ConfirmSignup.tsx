import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const P = '#7c3aed';
const T = '#0d9488';
const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_691b6257d4173f2ed6ec3e95/7495ad18b_RegestraLogo.png';

export default function ConfirmSignup() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'ready' | 'confirming' | 'done' | 'error'>('ready');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmationUrl, setConfirmationUrl] = useState('');

  useEffect(() => {
    // Extract confirmation_url from query params
    const params = new URLSearchParams(window.location.search);
    const url = params.get('confirmation_url');
    if (url) {
      setConfirmationUrl(decodeURIComponent(url));
    } else {
      setStatus('error');
      setErrorMsg('Invalid confirmation link. Please request a new one.');
    }
  }, []);

  const handleConfirm = async () => {
    if (!confirmationUrl) return;
    setStatus('confirming');

    try {
      // Extract token_hash and type from the confirmation URL
      const url = new URL(confirmationUrl);
      const tokenHash = url.searchParams.get('token_hash') || url.searchParams.get('token');
      const type = url.searchParams.get('type') || 'signup';

      let session = null;

      if (tokenHash) {
        // Use verifyOtp with token_hash
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        });
        if (error) throw error;
        session = data.session;
      } else {
        // Fallback: redirect to the confirmation URL directly
        window.location.href = confirmationUrl;
        return;
      }

      if (session) {
        // Mark for onboarding
        localStorage.setItem('rg_needs_onboarding', session.user.id);
        setStatus('done');
        setTimeout(() => navigate('/onboarding', { replace: true }), 1500);
      } else {
        throw new Error('Could not establish session.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Confirmation failed. The link may have expired.');
    }
  };

  return (
    <>
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0f0020 0%, #1a0040 40%, #001a1a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        <div style={{
          width: '100%', maxWidth: 460,
          background: '#fff', borderRadius: 28,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        }}>
          {/* Top gradient bar */}
          <div style={{ height: 5, background: `linear-gradient(90deg, ${P}, ${T})` }} />

          <div style={{ padding: '40px 36px 36px', textAlign: 'center' }}>
            <img src={LOGO} alt="Regestra" style={{ height: 48, margin: '0 auto 20px' }} />

            {status === 'error' ? (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: '#fef2f2', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 20px',
                }}>
                  <AlertCircle size={32} color="#ef4444" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1a1729', marginBottom: 10 }}>
                  Something went wrong
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
                  {errorMsg}
                </p>
                <a href="/sign-up" style={{
                  display: 'inline-block', padding: '12px 32px',
                  background: `linear-gradient(135deg, ${P}, ${T})`,
                  color: '#fff', borderRadius: 12, fontWeight: 700,
                  fontSize: '0.9rem', textDecoration: 'none',
                }}>
                  Back to Sign Up
                </a>
              </>
            ) : status === 'done' ? (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: '#f0fdf4', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 20px',
                }}>
                  <CheckCircle size={32} color="#16a34a" />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1a1729', marginBottom: 10 }}>
                  Email confirmed!
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.6 }}>
                  Taking you to set up your profile...
                </p>
              </>
            ) : (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: '#f5f0ff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 20px',
                }}>
                  <span style={{ fontSize: 28 }}>✉️</span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1a1729', marginBottom: 10 }}>
                  Confirm your email
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
                  Click the button below to verify your email address and complete your Regestra signup.
                </p>
                <button
                  onClick={handleConfirm}
                  disabled={status === 'confirming'}
                  style={{
                    width: '100%', padding: '14px',
                    background: `linear-gradient(135deg, ${P}, ${T})`,
                    color: '#fff', border: 'none', borderRadius: 14,
                    fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: status === 'confirming' ? 0.8 : 1,
                  }}
                >
                  {status === 'confirming' ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'cs-spin 0.8s linear infinite' }} />
                      Confirming...
                    </>
                  ) : (
                    '✓ Confirm my email & get started'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
