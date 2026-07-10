'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ProjectState, AiCommandPlan, DeviceMode } from '@/types/project';

type Props = {
  projectId: string;
  initialState: ProjectState;
  initialMode: DeviceMode;
  onSave: (
    state: ProjectState,
    changeLabel?: string,
    aiPlan?: AiCommandPlan | null,
    beforeState?: ProjectState
  ) => Promise<void>;
};

type ModuleFlags = {
  inventory?: boolean;
  signs?: boolean;
  fire?: boolean;
  measurement?: boolean;
  ai?: boolean;
  mobile?: boolean;
};

export function ProjectEditor({ projectId, initialState, initialMode, onSave }: Props) {
  const [state, setState] = useState<ProjectState>({
    ...initialState,
    deviceMode: initialMode
  });

  const [prompt, setPrompt] = useState('');
  const [plan, setPlan] = useState<AiCommandPlan | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const modules = useMemo<ModuleFlags>(() => {
    const settings = state.settings as any;
    return settings?.modules || {};
  }, [state.settings]);

  const buildingCount = state.buildings?.length || 0;
  const gridCount = state.columnGrids?.length || 0;
  const assetCount = state.assets?.length || 0;
  const layerCount = state.layers?.length || 0;

  const firstBuilding = state.buildings?.[0];
  const firstGrid = state.columnGrids?.[0];

  const askAi = async () => {
    if (!prompt.trim()) return;

    setAiBusy(true);
    setPlan(null);
    setMessage(null);

    try {
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, prompt, projectState: state })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'AI işlem planı alınamadı.');
      }

      setPlan(data.plan);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'AI planı sırasında hata oluştu.');
    } finally {
      setAiBusy(false);
    }
  };

  const saveProjectNote = async () => {
    setMessage(null);

    try {
      await onSave(state, 'Proje kontrol merkezi kaydı', null, state);
      setMessage('Proje kaydı güncellendi.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kayıt sırasında hata oluştu.');
    }
  };

  return (
    <div className="page-shell" style={{ minHeight: '100vh' }}>
      <div className="panel-layout">
        <aside className="sidebar">
          <Link href="/panel">← Projelere dön</Link>
          <a className="active">Proje kontrol merkezi</a>
          <a>3D editör motoru</a>
          <a>Envanter</a>
          <a>AI işlem motoru</a>
          <a>Raporlama</a>
        </aside>

        <main className="main">
          <div className="toolbar">
            <div>
              <span className="eyebrow">Dijital Tesis / Proje Kontrol Merkezi</span>
              <h1 style={{ fontSize: 34, marginTop: 12 }}>{state.name}</h1>
              <p>
                Bu ekran geçiş kontrol merkezidir. Eski demo kutu editörü kaldırıldı.
                Bundan sonraki aşamada V19 referanslı gerçek 3D editör motoru bu merkeze bağlanacak.
              </p>
            </div>

            <div className="actions" style={{ margin: 0 }}>
              <Link className="btn" href="/panel">
                Projeler
              </Link>

              <button className="btn primary" onClick={saveProjectNote}>
                Kaydet
              </button>
            </div>
          </div>

          {message && (
            <div className="notice" style={{ marginBottom: 18 }}>
              {message}
            </div>
          )}

          <div className="grid-3" style={{ marginBottom: 22 }}>
            <div className="panel metric">
              <strong>{buildingCount}</strong>
              <span>Bina</span>
            </div>

            <div className="panel metric">
              <strong>{gridCount}</strong>
              <span>Kolon / aks sistemi</span>
            </div>

            <div className="panel metric">
              <strong>{assetCount}</strong>
              <span>Varlık / envanter</span>
            </div>
          </div>

          <div className="cards" style={{ marginBottom: 22 }}>
            <section className="panel project-card">
              <span className="badge">Proje verisi</span>
              <h2 style={{ marginTop: 14 }}>Kurulum özeti</h2>

              <p>
                Bu proje veritabanında saklanır. Yeni HTML versiyonu oluşturulmaz.
                Bina, kolon, katman, varlık ve AI işlem geçmişi proje verisi olarak yönetilir.
              </p>

              <div className="notice">
                <b>Çalışma modu:</b> {state.deviceMode?.toUpperCase() || 'PC'}
                <br />
                <b>Katman sayısı:</b> {layerCount}
                <br />
                <b>Profesyonel sihirbaz:</b>{' '}
                {(state.settings as any)?.professionalWizard ? 'Aktif' : 'Yok'}
              </div>
            </section>

            <section className="panel project-card">
              <span className="badge">Bina / aks</span>
              <h2 style={{ marginTop: 14 }}>Tesis geometrisi</h2>

              {firstBuilding ? (
                <p>
                  Başlangıç binası tanımlı. Ölçüler:
                  <br />
                  <b>{firstBuilding.width} m</b> genişlik ·{' '}
                  <b>{firstBuilding.depth} m</b> uzunluk ·{' '}
                  <b>{firstBuilding.height} m</b> yükseklik
                </p>
              ) : (
                <p>
                  Bu proje boş tesis olarak başlatılmış. Bina geometrisi henüz tanımlı değil.
                </p>
              )}

              {firstGrid ? (
                <div className="notice">
                  <b>Aks:</b> {firstGrid.rows?.join(', ')}
                  <br />
                  <b>Kolon:</b> {firstGrid.columns} adet / satır
                  <br />
                  <b>Aralık:</b> {firstGrid.columnSpacing} m
                </div>
              ) : (
                <div className="notice warn">
                  Kolon / aks sistemi yok. AI’nin B12, C14 gibi hedefleri anlayabilmesi için
                  aks sistemi kurulmalı.
                </div>
              )}
            </section>

            <section className="panel project-card">
              <span className="badge">Legacy</span>
              <h2 style={{ marginTop: 14 }}>SAMPA Vadi v19</h2>

              <p>
                Eski V19/Vadi dosyası şu an görüntüleme modunda bağlı.
                Bu geçici bağlantı korunacak; sonraki aşamada V19 verisi yeni editör motoruna
                parça parça aktarılacak.
              </p>

              <div className="actions">
                <Link
                  className="btn primary"
                  href="/legacy/sampa-vadi-v19.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  V19 Legacy Viewer Aç
                </Link>
              </div>
            </section>
          </div>

          <section className="panel" style={{ padding: 24, marginBottom: 22 }}>
            <span className="eyebrow">Aktif modüller</span>
            <h2 style={{ marginTop: 12 }}>Proje modül durumu</h2>

            <div className="cards" style={{ marginTop: 18 }}>
              {[
                ['Envanter yönetimi', modules.inventory],
                ['İSG levha sistemi', modules.signs],
                ['Yangın ekipman planı', modules.fire],
                ['Ölçüm sistemi', modules.measurement],
                ['AI işlem motoru', modules.ai],
                ['Mobil görüntüleme', modules.mobile]
              ].map(([label, active]) => (
                <div
                  key={String(label)}
                  className="notice"
                  style={{
                    borderColor: active ? '#b7d9c5' : '#efcbc7',
                    background: active ? '#f0fbf4' : '#fff4f2'
                  }}
                >
                  <b>{label as string}</b>
                  <br />
                  {active ? 'Aktif' : 'Kapalı'}
                </div>
              ))}
            </div>
          </section>

          <section className="panel" style={{ padding: 24, marginBottom: 22 }}>
            <span className="eyebrow">AI işlem motoru</span>
            <h2 style={{ marginTop: 12 }}>Komuttan işlem planına</h2>

            <p>
              AI burada kaynak kodu değiştirmez. Sadece proje verisine uygulanabilecek güvenli
              işlem planı üretir. Uygulama aşaması bir sonraki geliştirme paketinde kontrollü
              hale getirilecek.
            </p>

            <div className="form-grid" style={{ marginTop: 16 }}>
              <div>
                <label>Komut</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Örn: B12 kolonuna forklift hız sınırı 10 km/h levhası ekle."
                />
              </div>

              <div className="actions">
                <button
                  className="btn primary"
                  onClick={askAi}
                  disabled={aiBusy || !modules.ai}
                >
                  {aiBusy ? 'Plan hazırlanıyor...' : 'İşlem Planı Hazırla'}
                </button>
              </div>

              {!modules.ai && (
                <div className="notice warn">
                  Bu projede AI modülü kapalı. Yeni proje sihirbazından AI modülü açık
                  proje oluşturulmalı.
                </div>
              )}

              {plan && (
                <div className="panel" style={{ padding: 18 }}>
                  <span className="badge">AI planı</span>
                  <h3 style={{ marginTop: 12 }}>{plan.summary}</h3>

                  <p>
                    Güven skoru: <b>{Math.round((plan.confidence || 0) * 100)}%</b>
                  </p>

                  <ul>
                    {plan.humanReadableSteps?.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>

                  {plan.warnings?.map((warning, index) => (
                    <div className="notice warn" key={index} style={{ marginTop: 8 }}>
                      {warning}
                    </div>
                  ))}

                  <div className="notice" style={{ marginTop: 12 }}>
                    Bu aşamada plan sadece görüntülenir. Sonraki pakette “Onayla ve uygula”
                    sistemi proje veritabanına güvenli şekilde bağlanacak.
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="panel" style={{ padding: 24 }}>
            <span className="eyebrow">Sonraki geliştirme</span>
            <h2 style={{ marginTop: 12 }}>Yeni 3D editör motoru</h2>

            <p>
              Bir sonraki adımda burada V19 referanslı gerçek 3D tesis editörü kurulacak.
              Eski demo kutu sistemi kullanılmayacak. Yeni motor; bina, kolon/aks, katman,
              seçili varlık, ölçüm ve levha yerleşimini ayrı modüller halinde yönetecek.
            </p>

            <div className="grid-3" style={{ marginTop: 18 }}>
              <div className="notice">
                <b>1. FacilityScene</b>
                <br />
                Tesis sahnesi ve kamera motoru.
              </div>

              <div className="notice">
                <b>2. ColumnGridLayer</b>
                <br />
                A/B/C/D ve kolon numarası tabanlı koordinat sistemi.
              </div>

              <div className="notice">
                <b>3. AssetPlacement</b>
                <br />
                Makine, raf, levha ve yangın ekipmanı yerleşimi.
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
