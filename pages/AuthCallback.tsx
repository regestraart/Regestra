
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { AlertCircle, ArrowLeft, RefreshCw, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshCurrentUser } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Verifying identity...');

  useEffect(() => {
    let mounted = true;

    const handleAuth = async () => {
        if (!isSupabaseConfigured) {
            if (mounted) setError("Supabase is not configured. Please check your environment variables.");
            return;
        }

        const rawUrl = window.location.href;
        console.debug("Auth Callback: Processing URL...", rawUrl);

        const getParam = (name: string) => {
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has(name)) return searchParams.get(name);
            const hashParts = rawUrl.split('?');
            if (hashParts.length > 1) {
                const hashParams = new URLSearchParams(hashParts[1]);
                if (hashParams.has(name)) return hashParams.get(name);
            }
            return null;
        };
        
        const isRecovery = rawUrl.toLowerCase().includes('type=recovery');
        const code = getParam('code');
        const error_description = getParam('error_description');

        // Flow 1: Handle explicit errors from Supabase
        if (error_description) {
            if (mounted) setError(error_description);
            return;
        }

        // Flow 2: Handle password recovery
        if (isRecovery) {
            setStatus('Preparing secure update...');
            setTimeout(() => {
                if (mounted) navigate('/update-password', { replace: true });
            }, 100);
            return;
        }

        // Flow 3: Handle PKCE code exchange (standard Supabase email confirmation)
        if (code) {
            try {
                setStatus('Verifying your account...');
                const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) throw exchangeError;

                if (data.session) {
                    await refreshCurrentUser();
                    // Check if this user needs onboarding
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('onboarding_completed')
                        .eq('id', data.session.user.id)
                        .maybeSingle();
                    
                    if (!profile?.onboarding_completed) {
                        if (mounted) navigate('/onboarding', { replace: true });
                    } else {
                        if (mounted) navigate('/', { replace: true });
                    }
                } else {
                    throw new Error("Could not establish a session with the provided code.");
                }
            } catch (err: any) {
                console.error("Auth Callback Exchange Error:", err);
                if (mounted) setError(err.message || "Failed to verify your account. The link may be invalid or expired.");
            }
            return;
        }

        // Flow 4: Session already exists — check onboarding status
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await refreshCurrentUser();
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('onboarding_completed')
                    .eq('id', session.user.id)
                    .maybeSingle();
                
                if (!profile?.onboarding_completed) {
                    if (mounted) navigate('/onboarding', { replace: true });
                } else {
                    if (mounted) navigate('/', { replace: true });
                }
                return;
            }
        } catch (err) { /* Ignore and fall through */ }

        // Fallback
        if (mounted) {
            setError("Invalid authentication link. Please request a new one.");
        }
    };

    handleAuth();
    return () => { mounted = false; };
  }, [navigate, refreshCurrentUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center animate-slide-up">
          <div className="mx-auto flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Security Check</h2>
          <p className="text-gray-600 mb-8 leading-relaxed text-sm">{error}</p>
          <div className="space-y-4">
            <Link to="/forgot-password">
              <Button className="w-full rounded-2xl h-14 text-lg font-bold shadow-lg">
                <RefreshCw className="w-5 h-5 mr-2" /> Request New Link
              </Button>
            </Link>
            <Link to="/login" className="flex items-center justify-center text-sm font-bold text-gray-400 hover:text-purple-600 transition-colors uppercase tracking-widest pt-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6">
      <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-purple-100 flex items-center justify-center animate-pulse">
               <ShieldCheck className="w-10 h-10 text-purple-600" />
          </div>
          <div className="absolute -top-1 -right-1">
             <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          </div>
      </div>
      <div className="text-center px-4">
        <p className="text-gray-900 font-bold text-xl tracking-tight">{status}</p>
        <p className="text-sm text-gray-500 mt-2 font-medium">Establishing secure connection...</p>
      </div>
    </div>
  );
}
