'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export function AppShell({ children, active }: { children: React.ReactNode; active?: 'projects' | 'admin' | 'account' }) {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const isAdmin = profile?.role === 'admin';
  return (
    <div className="page-shell">
      <header className="topbar">
        <Link className="brand" href="/panel">
          <Image src="/brand/lion-logo.png" alt="Dijital Tesis" width={48} height={48} />
          <span>
            <span className="brand-title">Dijital Tesis</span>
            <span className="brand-sub">Proje ve envanter platformu</span>
          </span>
        </Link>
        <nav className="nav">
          <Link className={active === 'projects' ? 'primary' : ''} href="/panel">Projeler</Link>
          {isAdmin && <Link className={active === 'admin' ? 'primary' : ''} href="/panel/admin">Admin</Link>}
          <Link className={active === 'account' ? 'primary' : ''} href="/panel/account">Profil</Link>
          {profile && <span className="role-badge">{profile.role} · {profile.email}</span>}
          <button onClick={async () => { await signOut(); router.push('/auth'); }}>Çıkış</button>
        </nav>
      </header>
      {children}
    </div>
  );
}
