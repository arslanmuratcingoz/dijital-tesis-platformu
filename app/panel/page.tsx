'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { ProjectTemplate } from '@/types/project';
import { formatDateTime } from '@/lib/utils';

type ProjectStatePreview = {
  assets?: unknown[];
  buildings?: unknown[];
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  template: ProjectTemplate;
  owner_id: string;
  project_state: ProjectStatePreview | null;
  updated_at: string;
  deleted_at: string | null;
};

export default function PanelPage() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const activeCount = useMemo(
    () => projects.filter((p) => !p.deleted_at).length,
    [projects]
  );

  const load = async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setProjects((data as ProjectRow[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const duplicateProject = async (project: ProjectRow) => {
    if (!user) return;

    const copy = {
      ...(project.project_state || {}),
      name: `${project.name} - Kopya`
    };

    const { error } = await supabase.from('projects').insert({
      owner_id: user.id,
      name: `${project.name} - Kopya`,
      description: project.description,
      template: project.template,
      project_state: copy
    });

    if (error) {
      setMessage(error.message);
    } else {
      await load();
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Bu proje çöp kutusuna taşınacak. Devam edilsin mi?')) return;

    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setMessage(error.message);
    } else {
      await load();
    }
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
              <p>
                Projelerini veritabanı tabanlı yönet. Yeni proje oluştururken bina,
                kolon/aks, modül ve AI altyapısını profesyonel sihirbazla belirle.
              </p>
            </div>

            <Link className="btn accent" href="/panel/projects/new">
              Yeni Proje
            </Link>
          </div>

          <div className="grid-3" style={{ marginBottom: 22 }}>
            <div className="panel metric">
              <strong>{activeCount}</strong>
              <span>Aktif proje</span>
            </div>

            <div className="panel metric">
              <strong>{profile?.role || '-'}</strong>
              <span>Hesap yetkisi</span>
            </div>

            <div className="panel metric">
              <strong>Veri tabanlı</strong>
              <span>Sürüm dosyası üretmeden çalışma</span>
            </div>
          </div>

          {profile?.role === 'admin' && (
            <div
              className="panel"
              style={{
                padding: 20,
                marginBottom: 22,
                borderLeft: '5px solid #c78a1d'
              }}
            >
              <span className="eyebrow">Özel Proje</span>

              <h2 style={{ marginTop: 12 }}>
                SAMPA Vadi v19 Legacy Viewer
              </h2>

              <p>
                Eski V19/Vadi tesis dosyasını doğrudan görüntüleme modunda açar.
                Bu alan geçici legacy bağlantıdır; sonraki aşamada veritabanı tabanlı
                proje editörüne dönüştürülecek.
              </p>

              <div className="actions">
                <Link
                  className="btn primary"
                  href="/legacy/sampa-vadi-v19.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SAMPA Vadi v19 Aç
                </Link>
              </div>
            </div>
          )}

          {message && (
            <div className="notice danger" style={{ marginBottom: 16 }}>
              {message}
            </div>
          )}

          {loading ? (
            <div className="notice">Projeler yükleniyor...</div>
          ) : (
            <div className="cards">
              {projects.map((project) => (
                <article className="panel project-card" key={project.id}>
                  <span className="badge">{project.template}</span>

                  <h3 style={{ marginTop: 18 }}>{project.name}</h3>

                  <p>{project.description || 'Proje açıklaması henüz girilmedi.'}</p>

                  <p style={{ fontSize: 12 }}>
                    Güncelleme: {formatDateTime(project.updated_at)}
                  </p>

                  <p style={{ fontSize: 12 }}>
                    Varlık: {project.project_state?.assets?.length || 0} · Bina:{' '}
                    {project.project_state?.buildings?.length || 0}
                  </p>

                  <div className="card-actions">
                    <Link
                      className="btn primary small"
                      href={`/panel/projects/${project.id}?mode=pc`}
                    >
                      PC Modu
                    </Link>

                    <Link
                      className="btn small"
                      href={`/panel/projects/${project.id}?mode=mobile`}
                    >
                      Mobil Mod
                    </Link>

                    <button
                      className="btn small"
                      onClick={() => duplicateProject(project)}
                    >
                      Kopyala
                    </button>

                    <button
                      className="btn danger small"
                      onClick={() => deleteProject(project.id)}
                    >
                      Sil
                    </button>
                  </div>
                </article>
              ))}

              {!projects.length && (
                <div className="panel feature">
                  <h3>Henüz proje yok</h3>
                  <p>
                    Yeni Proje butonuyla profesyonel kurulum sihirbazını açıp
                    sıfırdan tesis projesi oluştur.
                  </p>
                  <div className="actions">
                    <Link className="btn primary" href="/panel/projects/new">
                      İlk Projeyi Oluştur
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}
