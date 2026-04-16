import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { OnboardingQuiz, UserPreferences } from '../components/OnboardingQuiz';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const P = '#7c3aed';
const T = '#0d9488';

export default function Welcome() {
  const { currentUser, refreshCurrentUser } = useUser();
  const navigate = useNavigate();
  const [state, setState] = useState<'loading' | 'quiz' | 'done'>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('there');

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Get user ID directly from Supabase session — don't rely on context loading
      let uid = currentUser?.id ?? null;
      let uname = currentUser?.name ?? 'there';

      if (!uid) {
        // Context not loaded yet — get from session directly
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) {
            // No session at all — redirect to login
            if (!cancelled) navigate('/', { replace: true });
            return;
          }
          uid = session.user.id;

          // Also refresh context so the rest of the app has the user
          await refreshCurrentUser();

          // Get name from profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, onboarding_completed')
            .eq('id', uid)
            .maybeSingle();

          uname = profile?.full_name || 'there';

          if (!cancelled) {
            setUserId(uid);
            setUserName(uname);

            if (profile?.onboarding_completed === true) {
              navigate('/', { replace: true });
            } else {
              setState('quiz');
            }
          }
          return;
        } catch {
          if (!cancelled) setState('quiz');
          return;
        }
      }

      // Context already loaded — check onboarding status
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', uid)
          .maybeSingle();

        if (!cancelled) {
          setUserId(uid);
          setUserName(uname);

          if (profile?.onboarding_completed === true) {
            navigate('/', { replace: true });
          } else {
            setState('quiz');
          }
        }
      } catch {
        if (!cancelled) {
          setUserId(uid);
          setUserName(uname);
          setState('quiz');
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  const handleQuizComplete = (_preferences: UserPreferences) => {
    setState('done');
    navigate('/', { replace: true });
  };

  if (state === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0f0020 0%, #1a0040 40%, #001a1a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <style>{`@keyframes wsp { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `linear-gradient(135deg, ${P}, ${T})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader2 size={24} color="#fff" style={{ animation: 'wsp 0.8s linear infinite' }} />
        </div>
      </div>
    );
  }

  if (state === 'quiz' && userId) {
    return (
      <OnboardingQuiz
        userId={userId}
        userName={userName}
        onComplete={handleQuizComplete}
      />
    );
  }

  return null;
}
