'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { UserRole } from '@/types/project';

type Profile = {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: UserRole;
  title: string | null;
  department: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureServerProfile(session: Session) {
  try {
    await fetch('/api/auth/ensure-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({})
    });
  } catch (error) {
    console.warn('Profil doğrulama çağrısı başarısız:', error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData.session;
    setSession(currentSession);
    if (!currentSession?.user) {
      setProfile(null);
      return;
    }
    await ensureServerProfile(currentSession);
    const { data } = await supabase.from('profiles').select('*').eq('id', currentSession.user.id).maybeSingle();
    setProfile((data as Profile | null) || null);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await refreshProfile();
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) await refreshProfile(); else setProfile(null);
      setLoading(false);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    loading,
    session,
    user: session?.user || null,
    profile,
    refreshProfile,
    signOut: async () => { await supabase.auth.signOut(); setSession(null); setProfile(null); }
  }), [loading, session, profile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı.');
  return ctx;
}
