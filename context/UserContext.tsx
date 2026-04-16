
import React, { createContext, useState, useContext, PropsWithChildren, useEffect, useCallback } from 'react';
import { User } from '../data/mock';
import { db } from '../services/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: PropsWithChildren) => {
  const [currentUser, _setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string, authEmail?: string) => {
    try {
        const user = await db.users.getFullProfile(userId);
        if (user) {
            if (authEmail && !user.email) {
                user.email = authEmail;
            }
            _setCurrentUser(user);
        }
    } catch (error) {
        console.error("Error loading user profile:", error);
    }
  }, []);

  const checkAndRedirectOnboarding = useCallback(async (userId: string) => {
    try {
        // If there are pending prefs from pre-confirmation quiz, apply them now
        const pendingRaw = localStorage.getItem('rg_pending_prefs');
        if (pendingRaw) {
            try {
                const pending = JSON.parse(pendingRaw);
                await supabase.from('profiles').update({
                    preferences: pending.preferences,
                    onboarding_completed: true,
                }).eq('id', userId);
                localStorage.removeItem('rg_pending_prefs');
                return;
            } catch {
                localStorage.removeItem('rg_pending_prefs');
            }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', userId)
            .maybeSingle();

        const excludedPaths = ['/onboarding', '/sign-up', '/forgot-password', '/update-password', '/magic-link', '/auth-callback'];
        const currentPath = window.location.pathname;
        const isExcluded = excludedPaths.some(p => currentPath.includes(p));

        if (profile?.onboarding_completed === false && !isExcluded) {
            // Use soft React Router navigation if available
            const nav = getRegisteredNavigate();
            if (nav) {
                nav('/onboarding');
            } else {
                // Fallback: only on very first load before router mounts
                window.history.replaceState(null, '', '/onboarding');
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
        } else {
            localStorage.removeItem('rg_needs_onboarding');
        }
    } catch (err) {
        console.error('Onboarding check failed:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let initialLoadDone = false;

    if (!isSupabaseConfigured) {
        setIsLoading(false);
        return () => { mounted = false; };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
            if (!initialLoadDone) {
                // Genuine first load — show spinner and fetch profile
                setIsLoading(true);
                await fetchUserProfile(session.user.id, session.user.email);
                setIsLoading(false);
                initialLoadDone = true;
                await checkAndRedirectOnboarding(session.user.id);
            }
            // If initialLoadDone, this is a tab-focus re-auth from Supabase's
            // built-in visibilitychange listener. The user hasn't changed — ignore it.
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Silent background token rotation — no UI changes needed
        } else if (event === 'SIGNED_OUT') {
            _setCurrentUser(null);
            localStorage.removeItem('rg_needs_onboarding');
            initialLoadDone = false;
            setIsLoading(false);
        } else if (!session) {
            initialLoadDone = true;
            setIsLoading(false);
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []); // Empty dep array — fetchUserProfile and checkAndRedirectOnboarding are stable useCallbacks

  const refreshCurrentUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email);
    }
  }, [fetchUserProfile]);

  const setCurrentUser = async (user: User | null) => {
    if (!user) {
        if (isSupabaseConfigured) await db.auth.signOut();
        _setCurrentUser(null);
    } else {
        _setCurrentUser(user);
    }
  };
  
  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, refreshCurrentUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Module-level registry — avoids context prop drilling
let _navigateRegistry: ((path: string) => void) | null = null;
export const _setNavigateRegistry = (navigate: (path: string) => void) => { _navigateRegistry = navigate; };
export const getRegisteredNavigate = () => _navigateRegistry;
