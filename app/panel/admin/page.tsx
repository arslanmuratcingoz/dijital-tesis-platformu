'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { formatDateTime } from '@/lib/utils';

type ProfileRow = { id: string; email: string; full_name: string | null; role: string; created_at: string };
type ProjectRow = { id: string; name: string; owner_id: string; updated_at: string; deleted_at: string | null };
type ChangeRow = { id: string; project_id: string; user_id: string; change_type: string; prompt: string | null; created_at: string };

export default function AdminPage() {
  const { profile } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [changes, setChanges] = useState<ChangeRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const [p1, p2, p3] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id,name,owner_id,updated_at,deleted_at').order('updated_at', { ascending: false }),
      supabase.from('project_changes').select('id,project_id,user_id,change_type,prompt,created_at').order('created_at', { ascending: false }).limit(30)
    ]);
    if (p1.error || p2.error || p3.error) setMessage(p1.error?.message || p2.error?.message || p3.error?.message || 'Veri alınamadı.');
    setProfiles((p1.data as ProfileRow[]) || []);
    setProjects((p2.data as ProjectRow[]) || []);
    setChanges((p3.data as ChangeRow[]) || []);
  };

  useEffect(() => { load(); }, []);
  const isAdmin = profile?.role === 'admin';
  if (!isAdmin) return <AppShell active="admin"><div className="main"><div className="notice danger">Bu sayfa için admin yetkisi gerekir.</div></div></AppShell>;

  return (
    <AppShell active="admin">
      <div className="panel-layout">
        <aside className="sidebar"><a className="active">Admin Panel</a></aside>
        <main className="main">
          <div className="toolbar"><div><span className="eyebrow">Yönetim</span><h1 style={{ fontSize: 34, marginTop: 12 }}>Admin panel</h1><p>Kullanıcı, proje ve değişiklik geçmişi denetimi.</p></div><button className="btn" onClick={load}>Yenile</button></div>
          {message && <div className="notice danger">{message}</div>}
          <section className="section" style={{ paddingTop: 0 }}>
            <h2>Kullanıcılar</h2>
            <table className="admin-table"><thead><tr><th>E-posta</th><th>Ad</th><th>Rol</th><th>Kayıt</th></tr></thead><tbody>{profiles.map((p) => <tr key={p.id}><td>{p.email}</td><td>{p.full_name}</td><td>{p.role}</td><td>{formatDateTime(p.created_at)}</td></tr>)}</tbody></table>
          </section>
          <section className="section" style={{ paddingTop: 18 }}>
            <h2>Projeler</h2>
            <table className="admin-table"><thead><tr><th>Proje</th><th>Sahip</th><th>Durum</th><th>Güncelleme</th></tr></thead><tbody>{projects.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.owner_id.slice(0,8)}</td><td>{p.deleted_at ? 'Silinmiş' : 'Aktif'}</td><td>{formatDateTime(p.updated_at)}</td></tr>)}</tbody></table>
          </section>
          <section className="section" style={{ paddingTop: 18 }}>
            <h2>Son değişiklikler</h2>
            <table className="admin-table"><thead><tr><th>Tip</th><th>İşlem</th><th>Proje</th><th>Tarih</th></tr></thead><tbody>{changes.map((c) => <tr key={c.id}><td>{c.change_type}</td><td>{c.prompt}</td><td>{c.project_id.slice(0,8)}</td><td>{formatDateTime(c.created_at)}</td></tr>)}</tbody></table>
          </section>
        </main>
      </div>
    </AppShell>
  );
}
