import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseMisconfigured } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import { clearOfflineUserData } from '@/services/offlineService';
import { clearToken } from '@/services/apiClient';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile:', error.message);
      return;
    }

    setProfile(data as Profile | null);
  }, []);

  // Restore the persisted Supabase session before protected routes are evaluated.
  // The listener only mirrors auth state; profile loading is handled separately so
  // an auth callback can never keep the route guard in an indeterminate state.
  useEffect(() => {
    let mounted = true;

    if (supabaseMisconfigured) {
      setLoading(false);
      return;
    }

    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Failed to restore session:', error.message);
          setSession(null);
        } else {
          setSession(data.session);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        if (mounted) setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);

      if (!newSession) {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Keep profile state synchronized with the authenticated user without blocking
  // the auth route guard. Clear the previous user's profile immediately on switch.
  useEffect(() => {
    let cancelled = false;
    const userId = session?.user?.id;

    if (!userId) {
      setProfile(null);
      return;
    }

    setProfile(null);

    const load = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Failed to load profile:', error.message);
        return;
      }

      setProfile(data as Profile | null);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const signOut = useCallback(async () => {
    // Only this explicit action clears the local session. Session restoration
    // never calls signOut(), so reopening the app does not force a new login.
    const { error } = await supabase.auth.signOut({ scope: 'local' });

    if (error) throw error;

    setProfile(null);
    setSession(null);

    // Remove data belonging to the previous session so another account on the
    // same browser/device cannot inherit cached state or queued mutations.
    clearOfflineUserData();
    clearToken();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await fetchProfile(session.user.id);
  }, [fetchProfile, session?.user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
