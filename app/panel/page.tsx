'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { createTemplateState } from '@/lib/projectDefaults';
import { ProjectTemplate } from '@/types/project';
import { formatDateTime } from '@/lib/utils';

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  template: ProjectTemplate;
  owner_id: string;
  project_state: any;
  updated_at: string;
  deleted_at: string | null;
};

const templates: Array<{ id: ProjectTemplate; title: string; desc: string }> = [
  { id: 'blank', title: 'Boş Tesis Projesi', desc: 'Binasız, kolonsuz, sıfır çalışma alanı.' },
  { id: 'factory', title: 'Fabrika Şablonu', desc: 'Başlangıç binası ve kolon ızgarasıyla gelir.' },
  { id: 'warehouse', title: 'Depo Şablonu', desc: 'Depo ve raf yerleşimi için sade başlangıç.' },
  { id: 'safety_signage', title: 'İSG Levha Projesi', desc: 'Levha ve tabela planlaması için boş kurgu.' },
  { id: 'fire_plan', title: 'Yangın Ekipman Planı', desc: 'Yangın ekipmanı yerleşim çalışması.' }
];

export default function PanelPage() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('Yeni Dijital Tesis Projesi');
  const [template, setTemplate] = useState<ProjectTemplate>('blank');
  const [message, setMessage] = useState<string | null>(null);
  const activeCount = useMemo(() => projects.filter((p) => !p.deleted_at).length, [projects]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });
    if (!error) setProjects((data as ProjectRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const createProject = async () => {
    if (!user) return;
    const state = createTemplateState(name, template);
    const { error } = await supabase.from('projects').insert({
      owner_id: user.id,
      name,
      description: '',
      template,
      project_state: state
    });
    if (error) setMessage(error.message);
    else { setShowNew(false); setName('Yeni Dijital Tesis Projesi'); setTemplate('blank'); await load(); }
  };

  const duplicateProject = async (project: ProjectRow) => {
    if (!user) return;
    const copy = { ...project.project_state, name: `${project.name} - Kopya` };
    const { error } = await supabase.from('projects').insert({
      owner_id: user.id,
      name: `${project.name} - Kopya`,
      description: project.description,
      template: project.template,
      project_state: copy
    });
    if (error) setMessage(error.message); else await load();
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Bu proje çöp kutusuna taşınacak. Devam edilsin mi?')) return;
    const { error } = await supabase.from('projects').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) setMessage(error.message); else await load();
  };

  return (
    <AppShell active="projects">
      <div className="panel-layout">
        <aside className="sidebar">
          <Link className="active" href="/panel">Projeler</Link>
          <Link href="/panel/account">Profil Ayarları</Link>
          {profile?.role === 'admin' && <Link href="/panel/admin">Admin Panel</Link>}
        </aside>
        <main className="main">
          <div className="toolbar">
            <div>
              <span className="eyebrow">Proje merkezi</span>
              <h1 style={{ fontSize: 34, marginTop: 12 }}>Projelerim</h1>
              <p>Boş proje oluştur, ekipman ekle, AI ile işlem planı üret ve dosya versiyonu oluşturmadan çalış.</p>
            </div>
            <button className="btn accent" onClick={() => setShowNew(true)}>Yeni Proje</button>
          </div>
          <div className="grid-3" style={{ marginBottom: 22 }}>
            <div className="panel metric"><strong>{activeCount}</strong><span>Aktif proje</span></div>
            <div className="panel metric"><strong>{profile?.role || '-'}</strong><span>Hesap yetkisi</span></div>
            <div className="panel metric"><strong>Veri tabanlı</strong><span>Sürüm dosyası üretmeden çalışma</span></div>
          </div>
          {message && <div className="notice danger" style={{ marginBottom: 16 }}>{message}</div>}
          {loading ? <div className="notice">Projeler yükleniyor...</div> : (
            <div className="cards">
              {projects.map((project) => (
                <article className="panel project-card" key={project.id}>
                  <span className="badge">{project.template}</span>
                  <h3 style={{ marginTop: 18 }}>{project.name}</h3>
                  <p>{project.description || 'Proje açıklaması henüz girilmedi.'}</p>
                  <p style={{ fontSize: 12 }}>Güncelleme: {formatDateTime(project.updated_at)}</p>
                  <p style={{ fontSize: 12 }}>Varlık: {project.project_state?.assets?.length || 0} · Bina: {project.project_state?.buildings?.length || 0}</p>
                  <div className="card-actions">
                    <Link className="btn primary small" href={`/panel/projects/${project.id}?mode=pc`}>PC Modu</Link>
                    <Link className="btn small" href={`/panel/projects/${project.id}?mode=mobile`}>Mobil Mod</Link>
                    <button className="btn small" onClick={() => duplicateProject(project)}>Kopyala</button>
                    <button className="btn danger small" onClick={() => deleteProject(project.id)}>Sil</button>
                  </div>
                </article>
              ))}
              {!projects.length && <div className="panel feature"><h3>Henüz proje yok</h3><p>Yeni Proje butonuyla boş bir tesis projesi oluştur.</p></div>}
            </div>
          )}

          {showNew && (
            <div className="panel" style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(16,28,42,.25)', display: 'grid', placeItems: 'center', padding: 20 }}>
              <div className="panel auth-card" style={{ maxHeight: '90vh', overflow: 'auto' }}>
                <h2>Yeni proje oluştur</h2>
                <p>Yeni kullanıcılar için varsayılan seçenek boş tesis projesidir; hazır bina gelmez.</p>
                <div className="form-grid">
                  <div><label>Proje adı</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div><label>Şablon</label><select value={template} onChange={(e) => setTemplate(e.target.value as ProjectTemplate)}>{templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
                  <div className="cards" style={{ gridTemplateColumns: '1fr' }}>
                    {templates.map((t) => <div className="notice" key={t.id}><b>{t.title}</b><br />{t.desc}</div>)}
                  </div>
                  <div className="actions"><button className="btn primary" onClick={createProject}>Oluştur</button><button className="btn" onClick={() => setShowNew(false)}>İptal</button></div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}
