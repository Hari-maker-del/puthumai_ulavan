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
const SESSION_BACKUP_KEY = 'puthumai-uzhavan:auth-session-backup';

function saveSessionBackup(nextSession: Session | null): void {
  try {
    if (nextSession) {
      localStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify(nextSession));
    } else {
      localStorage.removeItem(SESSION_BACKUP_KEY);
    }
  } catch {
    // Session backup is best-effort; Supabase remains the primary session store.
  }
}

function readSessionBackup(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.access_token || !parsed?.refresh_token || !parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

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
  // A small app-level backup protects against browser/Supabase storage restoration
  // failures after a tab is closed and reopened. Supabase remains the source of truth.
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
        } else if (data.session) {
          setSession(data.session);
          saveSessionBackup(data.session);
        } else {
          // Supabase returned no session. Recover the last valid session snapshot
          // and immediately hand it back to Supabase so normal refresh continues.
          const backup = readSessionBackup();
          if (backup) {
            const { data: restored, error: restoreError } = await supabase.auth.setSession({
              access_token: backup.access_token,
              refresh_token: backup.refresh_token,
            });

            if (restored.session && !restoreError) {
              setSession(restored.session);
              saveSessionBackup(restored.session);
            } else {
              saveSessionBackup(null);
              setSession(null);
            }
          } else {
            setSession(null);
          }
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
      saveSessionBackup(newSession);

      if (!newSession) {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
    const { error } = await supabase.auth.signOut({ scope: 'local' });

    if (error) throw error;

    setProfile(null);
    setSession(null);
    saveSessionBackup(null);
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
