'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/AuthProvider';

function Guard({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [loading, user, router]);
  if (loading) return <div className="auth-wrap"><div className="panel auth-card"><h2>Oturum kontrol ediliyor</h2><p>Lütfen bekle.</p></div></div>;
  if (!user) return null;
  return <>{children}</>;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  return <AuthProvider><Guard>{children}</Guard></AuthProvider>;
}
