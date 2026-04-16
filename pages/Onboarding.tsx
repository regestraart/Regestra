import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { OnboardingQuiz, UserPreferences } from '../components/OnboardingQuiz';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Onboarding() {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('there');

  useEffect(() => {
    let mounted = true;

    const resolveSession = async (session: any) => {
      if (!mounted) return;
      if (session?.user) {
        setUserId(session.user.id);
        // Try to get name from profile, fall back to email
        const { data } = await supabase.from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .maybeSingle();
        if (mounted && data?.full_name) setUserName(data.full_name.split(' ')[0]);
      } else {
        if (mounted) navigate('/login', { replace: true });
      }
    };

    // First try getSession() — handles the case where session is already persisted
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        resolveSession(session);
      }
      // If no session yet, onAuthStateChange below will catch SIGNED_IN once
      // the PKCE exchange completes and the session is persisted (fixes desktop race condition)
    });

    // Listen for auth state — catches the case where getSession() fires before
    // the session is written to localStorage (common on desktop after PKCE redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        resolveSession(session);
      } else if (event === 'SIGNED_OUT' || (!session && event === 'INITIAL_SESSION')) {
        navigate('/login', { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleComplete = (_prefs: UserPreferences) => {
    localStorage.removeItem('rg_needs_onboarding');
    // Use window.location for hard redirect to ensure clean state
    window.location.replace('/');
  };

  // Show quiz as soon as we have a userId — don't wait for currentUser
  if (userId) {
    return (
      <OnboardingQuiz
        userId={userId}
        userName={userName}
        onComplete={handleComplete}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Setting up your profile...</p>
      </div>
    </div>
  );
}
