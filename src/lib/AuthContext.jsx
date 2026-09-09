import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  // While a signUp() call is creating the profile/company row, the auth-state-change
  // listener also fires and races loadProfile against that creation step. Suppress
  // the auto-sign-out during that window so it doesn't kick out a brand-new user.
  const suppressAutoSignOut = useRef(false);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setCompany(null);
      return;
    }
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profileRow) {
      setProfile(null);
      setCompany(null);
      if (!suppressAutoSignOut.current) {
        // Session references a user with no linked profile (e.g. the local database
        // was reset since this browser tab last logged in). Force back to login
        // rather than leaving every page spinning on a company that will never load.
        await supabase.auth.signOut();
      }
      return;
    }

    setProfile(profileRow);

    if (profileRow.company_id) {
      const { data: companyRow } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profileRow.company_id)
        .maybeSingle();
      setCompany(companyRow ?? null);
    } else {
      setCompany(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session ?? null);
      await loadProfile(data.session?.user?.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      await loadProfile(newSession?.user?.id);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(async ({ email, password, firstName, lastName, companyName }) => {
    suppressAutoSignOut.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error('Sign up did not return a user.');

      const { error: rpcError } = await supabase.rpc('create_company_profile', {
        p_company_name: companyName,
        p_first_name: firstName,
        p_last_name: lastName,
      });
      if (rpcError) throw rpcError;

      await loadProfile(userId);
    } finally {
      suppressAutoSignOut.current = false;
    }
  }, [loadProfile]);

  const signIn = useCallback(async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const refreshCompany = useCallback(async () => {
    if (session?.user?.id) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  return (
    <AuthContext.Provider
      value={{ session, profile, company, loading, signUp, signIn, signOut, requestPasswordReset, updatePassword, refreshCompany }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
