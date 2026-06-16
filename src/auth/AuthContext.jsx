/**
 * AuthContext — wraps the app in Supabase auth state.
 *
 * Exposes the current `session`/`user`, a `loading` flag for the initial
 * session check, and `signIn`/`signUp`/`signOut` helpers. When Supabase isn't
 * configured yet, everything resolves to a signed-out state and the auth
 * helpers return a friendly error so the UI can prompt for setup.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { getProfile, upsertProfile } from '../data/db';

const AuthContext = createContext(null);

const NOT_CONFIGURED = {
  error: { message: 'Supabase isn’t connected yet. Add your project keys to .env.local.' },
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setProfileLoading(false);
      return;
    }
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load the user's profile whenever the signed-in user changes.
  const userId = session?.user?.id ?? null;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    let active = true;
    setProfileLoading(true);
    getProfile()
      .then((p) => active && setProfile(p))
      .catch(() => active && setProfile(null))
      .finally(() => active && setProfileLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  const saveProfile = async (data) => {
    const p = await upsertProfile({ userId, ...data });
    setProfile(p);
    return p;
  };

  const signIn = async ({ email, password }) => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED;
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async ({ email, password }) => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED;
    return supabase.auth.signUp({ email, password });
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    setProfile(null);
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    configured: isSupabaseConfigured,
    profile,
    profileLoading,
    saveProfile,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
