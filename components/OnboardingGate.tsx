import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { OnboardingQuiz, UserPreferences } from './OnboardingQuiz';

// Pages where we should NOT show the quiz
const EXCLUDED_PATHS = ['/update-password', '/forgot-password', '/magic-link', '/verify', '/explorer'];

export const OnboardingGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useUser();
  const [showQuiz, setShowQuiz] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Don't show on auth/password pages
    const path = window.location.pathname;
    const isExcluded = EXCLUDED_PATHS.some(p => path.startsWith(p));
    if (isExcluded) {
      setChecked(true);
      return;
    }

    // Not logged in — nothing to check
    if (!currentUser?.id) {
      setChecked(true);
      setShowQuiz(false);
      return;
    }

    supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', currentUser.id)
      .maybeSingle()
      .then(({ data }) => {
        setShowQuiz(!data?.onboarding_completed);
        setChecked(true);
      })
      .catch(() => {
        setShowQuiz(true);
        setChecked(true);
      });
  }, [currentUser?.id]);

  if (!checked) return null;

  if (showQuiz && currentUser) {
    return (
      <OnboardingQuiz
        userId={currentUser.id}
        userName={currentUser.name || 'there'}
        onComplete={(_prefs: UserPreferences) => setShowQuiz(false)}
      />
    );
  }

  return <>{children}</>;
};
