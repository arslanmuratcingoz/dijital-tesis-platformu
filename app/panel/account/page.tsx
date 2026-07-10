'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

export default function AccountPage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [title, setTitle] = useState(profile?.title || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update({
      full_name: fullName, username: fullName, title, department, phone, avatar_url: avatarUrl, updated_at: new Date().toISOString()
    }).eq('id', profile.id);
    if (error) setMessage(error.message); else { await refreshProfile(); setMessage('Profil kaydedildi.'); }
  };

  return (
    <AppShell active="account">
      <div className="panel-layout">
        <aside className="sidebar"><a className="active">Profil Ayarları</a></aside>
        <main className="main">
          <div className="toolbar"><div><span className="eyebrow">Hesap merkezi</span><h1 style={{ fontSize: 34, marginTop: 12 }}>Profil ayarları</h1><p>Toplantı, sunum ve proje paylaşım ekranlarında görünecek kullanıcı bilgileri.</p></div></div>
          <div className="panel auth-card" style={{ maxWidth: 720 }}>
            <div className="form-grid">
              <div><label>Ad Soyad</label><input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div><label>Ünvan</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="İSG Uzmanı / Proje Sorumlusu" /></div>
              <div><label>Departman</label><input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="İSG / Tesis Yönetimi" /></div>
              <div><label>Telefon</label><input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><label>Profil görseli URL</label><input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." /></div>
              {message && <div className="notice">{message}</div>}
              <button className="btn primary" onClick={save}>Profili kaydet</button>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
