'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { createTemplateState } from '@/lib/projectDefaults';
import { ProjectTemplate } from '@/types/project';
import { uid } from '@/lib/utils';

type TemplateCard = {
  id: ProjectTemplate;
  title: string;
  desc: string;
};

const templates: TemplateCard[] = [
  {
    id: 'blank',
    title: 'Boş Tesis Projesi',
    desc: 'Tamamen boş çalışma alanı. Bina, kolon ve envanter kullanıcı tarafından oluşturulur.'
  },
  {
    id: 'factory',
    title: 'Fabrika / Üretim Alanı',
    desc: 'Bina, kolon/aks sistemi ve üretim yerleşimi için başlangıç yapısı kurar.'
  },
  {
    id: 'warehouse',
    title: 'Depo / Lojistik Alanı',
    desc: 'Depolama, raf ve forklift alanları için sade başlangıç kurgusu oluşturur.'
  },
  {
    id: 'safety_signage',
    title: 'İSG Levha Yerleşim Projesi',
    desc: 'Levha, tabela, acil yönlendirme ve KKD planlaması için başlatılır.'
  },
  {
    id: 'fire_plan',
    title: 'Yangın Ekipman Planı',
    desc: 'Yangın söndürme cihazı, yangın dolabı ve acil durum ekipmanları için başlatılır.'
  }
];

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [projectName, setProjectName] = useState('Yeni Dijital Tesis Projesi');
  const [template, setTemplate] = useState<ProjectTemplate>('blank');

  const [createBuilding, setCreateBuilding] = useState(false);
  const [buildingLength, setBuildingLength] = useState(100);
  const [buildingWidth, setBuildingWidth] = useState(60);
  const [buildingHeight, setBuildingHeight] = useState(12);

  const [createGrid, setCreateGrid] = useState(false);
  const [rowsText, setRowsText] = useState('A,B,C,D');
  const [columnCount, setColumnCount] = useState(16);
  const [columnSpacing, setColumnSpacing] = useState(8);
  const [rowSpacing, setRowSpacing] = useState(20);
  const [columnWidth, setColumnWidth] = useState(0.7);
  const [columnHeight, setColumnHeight] = useState(10);

  const [moduleInventory, setModuleInventory] = useState(true);
  const [moduleSigns, setModuleSigns] = useState(true);
  const [moduleFire, setModuleFire] = useState(true);
  const [moduleMeasurement, setModuleMeasurement] = useState(true);
  const [moduleAi, setModuleAi] = useState(true);
  const [moduleMobile, setModuleMobile] = useState(true);

  const selectedTemplate = useMemo(() => {
    return templates.find((item) => item.id === template);
  }, [template]);

  const rows = useMemo(() => {
    return rowsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [rowsText]);

  const moduleRows: Array<{
    label: string;
    checked: boolean;
    setter: (value: boolean) => void;
  }> = [
    {
      label: 'Envanter yönetimi',
      checked: moduleInventory,
      setter: setModuleInventory
    },
    {
      label: 'İSG levha sistemi',
      checked: moduleSigns,
      setter: setModuleSigns
    },
    {
      label: 'Yangın ekipman planı',
      checked: moduleFire,
      setter: setModuleFire
    },
    {
      label: 'Ölçüm sistemi',
      checked: moduleMeasurement,
      setter: setModuleMeasurement
    },
    {
      label: 'AI işlem motoru',
      checked: moduleAi,
      setter: setModuleAi
    },
    {
      label: 'Mobil görüntüleme',
      checked: moduleMobile,
      setter: setModuleMobile
    }
  ];

  const applyTemplateDefaults = (nextTemplate: ProjectTemplate) => {
    setTemplate(nextTemplate);

    if (nextTemplate === 'blank') {
      setCreateBuilding(false);
      setCreateGrid(false);
      return;
    }

    if (nextTemplate === 'factory') {
      setCreateBuilding(true);
      setCreateGrid(true);
      setBuildingLength(120);
      setBuildingWidth(60);
      setBuildingHeight(14);
      setRowsText('A,B,C,D');
      setColumnCount(16);
      setColumnSpacing(8);
      setRowSpacing(20);
      return;
    }

    if (nextTemplate === 'warehouse') {
      setCreateBuilding(true);
      setCreateGrid(true);
      setBuildingLength(90);
      setBuildingWidth(48);
      setBuildingHeight(10);
      setRowsText('A,B,C');
      setColumnCount(12);
      setColumnSpacing(8);
      setRowSpacing(18);
      return;
    }

    if (nextTemplate === 'safety_signage') {
      setCreateBuilding(false);
      setCreateGrid(false);
      setModuleSigns(true);
      setModuleMeasurement(true);
      setModuleAi(true);
      return;
    }

    if (nextTemplate === 'fire_plan') {
      setCreateBuilding(false);
      setCreateGrid(false);
      setModuleFire(true);
      setModuleMeasurement(true);
      setModuleAi(true);
    }
  };

  const createProject = async () => {
    if (!user) {
      setMessage('Oturum bulunamadı. Yeniden giriş yap.');
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const state: any = createTemplateState(projectName, template);

      state.name = projectName;
      state.template = template;

      state.settings = {
        ...(state.settings || {}),
        professionalWizard: true,
        modules: {
          inventory: moduleInventory,
          signs: moduleSigns,
          fire: moduleFire,
          measurement: moduleMeasurement,
          ai: moduleAi,
          mobile: moduleMobile
        }
      };

      state.buildings = createBuilding
        ? [
            {
              id: uid('bld'),
              name: 'Ana Tesis Binası',
              x: 0,
              z: 0,
              width: buildingWidth,
              depth: buildingLength,
              height: buildingHeight,
              wallColor: '#d7dde5',
              roofColor: '#9ca8b6',
              opacity: 0.58,
              layerId: 'buildings'
            }
          ]
        : [];

      state.columnGrids = createGrid
        ? [
            {
              id: uid('grid'),
              name: 'Ana Kolon / Aks Sistemi',
              originX: -(columnCount * columnSpacing) / 2,
              originZ: -((rows.length - 1) * rowSpacing) / 2,
              rows,
              columns: columnCount,
              rowSpacing,
              columnSpacing,
              columnWidth,
              columnHeight,
              visible: true
            }
          ]
        : [];

      const { data, error } = await supabase
        .from('projects')
        .insert({
          owner_id: user.id,
          name: projectName,
          description: selectedTemplate?.desc || '',
          template,
          project_state: state
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      router.push(`/panel/projects/${data.id}?mode=pc`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Proje oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell active="projects">
      <div className="panel-layout">
        <aside className="sidebar">
          <Link href="/panel">← Projelere dön</Link>
          <a className={step === 1 ? 'active' : ''}>1. Proje tipi</a>
          <a className={step === 2 ? 'active' : ''}>2. Ölçüler</a>
          <a className={step === 3 ? 'active' : ''}>3. Kolon / aks</a>
          <a className={step === 4 ? 'active' : ''}>4. Modüller</a>
          <a className={step === 5 ? 'active' : ''}>5. Önizleme</a>
        </aside>

        <main className="main">
          <div className="toolbar">
            <div>
              <span className="eyebrow">Profesyonel kurulum sihirbazı</span>
              <h1 style={{ fontSize: 34, marginTop: 12 }}>Yeni proje oluştur</h1>
              <p>
                Projeyi rastgele kutularla değil; ölçü, aks sistemi, modül ve veri yapısıyla
                kontrollü şekilde oluştur.
              </p>
            </div>

            <Link className="btn" href="/panel">
              İptal
            </Link>
          </div>

          {message && (
            <div className="notice danger" style={{ marginBottom: 16 }}>
              {message}
            </div>
          )}

          {step === 1 && (
            <section className="panel" style={{ padding: 24 }}>
              <h2>1. Proje tipi</h2>
              <p>Yeni projenin hangi amaçla kurulacağını seç.</p>

              <div className="form-grid" style={{ marginTop: 18 }}>
                <div>
                  <label>Proje adı</label>
                  <input
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="Örn: Yeni Fabrika Yerleşimi"
                  />
                </div>

                <div className="cards" style={{ marginTop: 10 }}>
                  {templates.map((item) => (
                    <button
                      key={item.id}
                      className="panel project-card"
                      style={{
                        textAlign: 'left',
                        borderColor: template === item.id ? '#c78a1d' : undefined,
                        boxShadow:
                          template === item.id
                            ? '0 0 0 3px rgba(199,138,29,.16)'
                            : undefined
                      }}
                      onClick={() => applyTemplateDefaults(item.id)}
                    >
                      <span className="badge">{item.id}</span>
                      <h3 style={{ marginTop: 14 }}>{item.title}</h3>
                      <p>{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="panel" style={{ padding: 24 }}>
              <h2>2. Bina ölçüleri</h2>
              <p>
                Boş proje istiyorsan bina oluşturmayı kapalı bırak. Fabrika/depo kuracaksan
                ölçü gir.
              </p>

              <div className="form-grid" style={{ marginTop: 18 }}>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={createBuilding}
                    onChange={(event) => setCreateBuilding(event.target.checked)}
                    style={{ width: 18 }}
                  />
                  Başlangıçta bina oluştur
                </label>

                <div className="grid-3">
                  <div>
                    <label>Uzunluk / Z derinliği (m)</label>
                    <input
                      type="number"
                      value={buildingLength}
                      onChange={(event) => setBuildingLength(Number(event.target.value))}
                      disabled={!createBuilding}
                    />
                  </div>

                  <div>
                    <label>Genişlik / X ekseni (m)</label>
                    <input
                      type="number"
                      value={buildingWidth}
                      onChange={(event) => setBuildingWidth(Number(event.target.value))}
                      disabled={!createBuilding}
                    />
                  </div>

                  <div>
                    <label>Yükseklik (m)</label>
                    <input
                      type="number"
                      value={buildingHeight}
                      onChange={(event) => setBuildingHeight(Number(event.target.value))}
                      disabled={!createBuilding}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="panel" style={{ padding: 24 }}>
              <h2>3. Kolon / aks sistemi</h2>
              <p>Kolon sistemi girilirse AI komutları B12, C14 gibi aks hedeflerini anlayabilir.</p>

              <div className="form-grid" style={{ marginTop: 18 }}>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={createGrid}
                    onChange={(event) => setCreateGrid(event.target.checked)}
                    style={{ width: 18 }}
                  />
                  Başlangıçta kolon / aks sistemi oluştur
                </label>

                <div>
                  <label>Satır isimleri</label>
                  <input
                    value={rowsText}
                    onChange={(event) => setRowsText(event.target.value)}
                    placeholder="A,B,C,D"
                    disabled={!createGrid}
                  />
                </div>

                <div className="grid-3">
                  <div>
                    <label>Kolon sayısı</label>
                    <input
                      type="number"
                      value={columnCount}
                      onChange={(event) => setColumnCount(Number(event.target.value))}
                      disabled={!createGrid}
                    />
                  </div>

                  <div>
                    <label>Kolon aralığı (m)</label>
                    <input
                      type="number"
                      value={columnSpacing}
                      onChange={(event) => setColumnSpacing(Number(event.target.value))}
                      disabled={!createGrid}
                    />
                  </div>

                  <div>
                    <label>Satır aralığı (m)</label>
                    <input
                      type="number"
                      value={rowSpacing}
                      onChange={(event) => setRowSpacing(Number(event.target.value))}
                      disabled={!createGrid}
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div>
                    <label>Kolon genişliği (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={columnWidth}
                      onChange={(event) => setColumnWidth(Number(event.target.value))}
                      disabled={!createGrid}
                    />
                  </div>

                  <div>
                    <label>Kolon yüksekliği (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={columnHeight}
                      onChange={(event) => setColumnHeight(Number(event.target.value))}
                      disabled={!createGrid}
                    />
                  </div>

                  <div className="notice">
                    Satır: <b>{rows.join(', ') || '-'}</b>
                    <br />
                    Toplam kolon: <b>{createGrid ? rows.length * columnCount : 0}</b>
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="panel" style={{ padding: 24 }}>
              <h2>4. Modüller</h2>
              <p>Projede hangi yönetim modüllerinin aktif olacağını seç.</p>

              <div className="cards" style={{ marginTop: 18 }}>
                {moduleRows.map((item) => (
                  <label
                    key={item.label}
                    className="panel project-card"
                    style={{ display: 'flex', gap: 12, alignItems: 'center' }}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(event) => item.setter(event.target.checked)}
                      style={{ width: 18 }}
                    />
                    <span>
                      <h3 style={{ margin: 0 }}>{item.label}</h3>
                      <p style={{ margin: 0 }}>Bu modül proje verisine işlenir.</p>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="panel" style={{ padding: 24 }}>
              <h2>5. Önizleme</h2>
              <p>Oluşturulacak proje özeti.</p>

              <div className="grid-3" style={{ marginTop: 18 }}>
                <div className="panel metric">
                  <strong>{selectedTemplate?.title}</strong>
                  <span>Proje tipi</span>
                </div>

                <div className="panel metric">
                  <strong>{createBuilding ? `${buildingWidth} x ${buildingLength} m` : 'Boş'}</strong>
                  <span>Bina</span>
                </div>

                <div className="panel metric">
                  <strong>{createGrid ? `${rows.length} sıra / ${columnCount} kolon` : 'Yok'}</strong>
                  <span>Kolon sistemi</span>
                </div>
              </div>

              <div className="notice" style={{ marginTop: 18 }}>
                <b>{projectName}</b>
                <br />
                Bu proje veritabanına kaydedilecek. Yeni HTML dosyası oluşturulmayacak.
              </div>
            </section>
          )}

          <div className="toolbar" style={{ marginTop: 20 }}>
            <button
              className="btn"
              onClick={() => setStep((currentStep) => Math.max(1, currentStep - 1))}
              disabled={step === 1 || busy}
            >
              Geri
            </button>

            <div className="actions" style={{ margin: 0 }}>
              {step < 5 ? (
                <button
                  className="btn primary"
                  onClick={() => setStep((currentStep) => Math.min(5, currentStep + 1))}
                  disabled={busy}
                >
                  Devam Et
                </button>
              ) : (
                <button className="btn accent" onClick={createProject} disabled={busy}>
                  {busy ? 'Oluşturuluyor...' : 'Projeyi Oluştur'}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
