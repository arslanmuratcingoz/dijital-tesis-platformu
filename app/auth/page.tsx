'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicHeader } from '@/components/PublicHeader';
import { supabase } from '@/lib/supabaseClient';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async () => {
    setBusy(true); setError(null); setMessage(null);
    try {
      if (mode === 'register') {
        const { error: signError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (signError) throw signError;
        setMessage('Kayıt oluşturuldu. E-posta doğrulaması istenirse doğruladıktan sonra giriş yap.');
        setMode('login');
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        router.push('/panel');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem sırasında hata oluştu.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell">
      <PublicHeader />
      <section className="auth-wrap">
        <div className="panel auth-card">
          <div className="tabs">
            <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Giriş</button>
            <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Kayıt</button>
          </div>
          <h2>{mode === 'login' ? 'Hesabına giriş yap' : 'Yeni hesap oluştur'}</h2>
          <p>Projeler, profil bilgileri ve yetkiler kullanıcı hesabına bağlı olarak yönetilir.</p>
          <div className="form-grid">
            {mode === 'register' && <div><label>Ad Soyad / Profil adı</label><input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Arslan Murat Cingöz" /></div>}
            <div><label>E-posta</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@firma.com" /></div>
            <div><label>Şifre</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
            {error && <div className="notice danger">{error}</div>}
            {message && <div className="notice">{message}</div>}
            <button className="btn primary" onClick={submit} disabled={busy}>{busy ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Oluştur'}</button>
          </div>
          <p style={{ fontSize: 12, marginTop: 18 }}>Admin yetkisi, Vercel’deki <b>ADMIN_EMAILS</b> değişkeninde tanımlı e-postaya otomatik atanır.</p>
          <Link href="/" className="btn ghost small">Ana sayfaya dön</Link>
        </div>
      </section>
    </main>
  );
}
