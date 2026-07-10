'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ProjectState, AiCommandPlan, DeviceMode } from '@/types/project';
import { uid } from '@/lib/utils';
import { applyAiPlan } from '@/lib/applyActions';
import { ThreeScene } from '@/components/ThreeScene';

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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const modules = useMemo<ModuleFlags>(() => {
    const settings = state.settings as any;
    return settings?.modules || {};
  }, [state.settings]);

  const moduleIsActive = (value: boolean | undefined) => value !== false;

  const buildingCount = state.buildings?.length || 0;
  const gridCount = state.columnGrids?.length || 0;
  const assetCount = state.assets?.length || 0;
  const layerCount = state.layers?.length || 0;

  const firstBuilding = state.buildings?.[0];
  const firstGrid = state.columnGrids?.[0];

  const saveCurrentState = async (label = 'Proje düzenleme kaydı') => {
    setMessage(null);
    setSaving(true);

    try {
      await onSave(state, label, null, state);
      setMessage('Proje kaydedildi.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kayıt sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const addBuilding = () => {
    setState((prev) => ({
      ...prev,
      buildings: [
        ...(prev.buildings || []),
        {
          id: uid('bld'),
          name: 'Yeni Bina',
          x: 0,
          z: 0,
          width: 60,
          depth: 100,
          height: 12,
          wallColor: '#d7dde5',
          roofColor: '#9ca8b6',
          opacity: 0.58,
          layerId: 'buildings'
        } as any
      ]
    }));
  };

  const addColumnGrid = () => {
    setState((prev) => ({
      ...prev,
      columnGrids: [
        ...(prev.columnGrids || []),
        {
          id: uid('grid'),
          name: 'Kolon / Aks Sistemi',
          originX: -64,
          originZ: -30,
          rows: ['A', 'B', 'C', 'D'],
          columns: 16,
          rowSpacing: 20,
          columnSpacing: 8,
          columnWidth: 0.7,
          columnHeight: 10,
          visible: true
        } as any
      ]
    }));
  };

  const addAsset = (
    name: string,
    category: string,
    width: number,
    depth: number,
    height: number,
    color: string,
    layerId: string
  ) => {
    const index = state.assets?.length || 0;

    setState((prev) => ({
      ...prev,
      assets: [
        ...(prev.assets || []),
        {
          id: uid('asset'),
          name,
          category: category as any,
          x: -12 + (index % 6) * 5,
          y: 0,
          z: -12 + Math.floor(index / 6) * 5,
          width,
          depth,
          height,
          rotation: 0,
          color,
          layerId
        } as any
      ]
    }));
  };

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

  const applyPlanToProject = async () => {
    if (!plan) return;

    setMessage(null);
    setSaving(true);

    try {
      const beforeState = state;
      const nextState = applyAiPlan(beforeState, plan);

      setState(nextState);
      setPlan(null);
      setPrompt('');

      await onSave(
        nextState,
        `AI komutu uygulandı: ${plan.summary}`,
        plan,
        beforeState
      );

      setMessage('AI işlem planı projeye uygulandı ve veritabanına kaydedildi.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'AI işlem planı uygulanırken hata oluştu.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="editor">
      <aside className="editor-left">
        <div className="editor-header">
          <div>
            <div className="editor-title">Proje Araçları</div>
            <div className="editor-sub">{state.name}</div>
          </div>
        </div>

        <div className="editor-section">
          <h4>Proje Özeti</h4>

          <div className="notice">
            <b>Bina:</b> {buildingCount}
            <br />
            <b>Kolon / aks:</b> {gridCount}
            <br />
            <b>Varlık:</b> {assetCount}
            <br />
            <b>Katman:</b> {layerCount}
          </div>

          <div className="actions" style={{ marginTop: 12 }}>
            <Link className="btn small" href="/panel">
              Projelere Dön
            </Link>

            <button className="btn primary small" onClick={() => saveCurrentState()} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>

        <div className="editor-section">
          <h4>Yapı Oluştur</h4>

          <div className="asset-list">
            <button className="asset-button" onClick={addBuilding}>
              <strong>Bina oluştur</strong>
              <span>Boş projeye ölçülendirilebilir bina ekler.</span>
            </button>

            <button className="asset-button" onClick={addColumnGrid}>
              <strong>Kolon / aks oluştur</strong>
              <span>A, B, C, D satırları ve kolon dizilimi üretir.</span>
            </button>
          </div>
        </div>

        <div className="editor-section">
          <h4>Envanter Ekle</h4>

          <div className="asset-list">
            <button
              className="asset-button"
              onClick={() => addAsset('Makine', 'machine', 12, 3, 2.4, '#b87815', 'machines')}
            >
              <strong>Makine</strong>
              <span>Üretim makinesi veya özel ekipman.</span>
            </button>

            <button
              className="asset-button"
              onClick={() => addAsset('Endüstriyel Raf', 'rack', 10, 2.2, 4, '#6f7d8c', 'racks')}
            >
              <strong>Endüstriyel Raf</strong>
              <span>Depolama rafı / konsol raf.</span>
            </button>

            <button
              className="asset-button"
              onClick={() => addAsset('Forklift / Araç', 'vehicle', 3.2, 1.6, 2.2, '#d79a18', 'vehicles')}
            >
              <strong>Forklift / Araç</strong>
              <span>Saha aracı veya hareketli ekipman.</span>
            </button>

            <button
              className="asset-button"
              onClick={() => addAsset('Yangın Ekipmanı', 'fire', 1, 0.4, 1.8, '#c2473f', 'fire')}
            >
              <strong>Yangın ekipmanı</strong>
              <span>Yangın dolabı veya söndürme cihazı.</span>
            </button>

            <button
              className="asset-button"
              onClick={() => addAsset('İSG Levhası', 'sign', 1.2, 0.08, 0.8, '#1f3552', 'signs')}
            >
              <strong>İSG Levhası</strong>
              <span>Uyarı, yasak, KKD veya yönlendirme levhası.</span>
            </button>
          </div>
        </div>

        <div className="editor-section">
          <h4>V19 Bağlantısı</h4>

          <p style={{ fontSize: 13 }}>
            Eski V19/Vadi sistemi geçici olarak görüntüleme modunda bağlı.
          </p>

          <Link
            className="btn primary"
            href="/legacy/sampa-vadi-v19.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            V19 Legacy Viewer Aç
          </Link>
        </div>
      </aside>

      <main className="scene-wrap">
        <div className="editor-header">
          <div>
            <div className="editor-title">Dijital Tesis Editörü</div>
            <div className="editor-sub">
              Veritabanı tabanlı çalışma alanı · {state.deviceMode?.toUpperCase() || 'PC'}
            </div>
          </div>

          <div className="actions" style={{ margin: 0 }}>
            <button
              className="btn small"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  settings: {
                    ...(prev.settings as any),
                    showGrid: !(prev.settings as any)?.showGrid
                  } as any
                }))
              }
            >
              Grid
            </button>

            <button className="btn primary small" onClick={() => saveCurrentState()} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>

        <div className="scene-canvas">
          <ThreeScene state={state} />
        </div>

        {!buildingCount && !gridCount && !assetCount && (
          <div className="scene-empty">
            <div className="empty-box">
              <h2>Boş tesis projesi</h2>
              <p>
                Sol panelden bina, kolon sistemi veya envanter ekle. AI panelinden doğal dille
                işlem planı oluşturabilirsin.
              </p>
            </div>
          </div>
        )}
      </main>

      <aside className="editor-right">
        <div className="editor-header">
          <div>
            <div className="editor-title">AI ve Özellikler</div>
            <div className="editor-sub">Onaylı işlem motoru</div>
          </div>
        </div>

        <div className="editor-section">
          <h4>AI Asistan</h4>

          <div className="ai-chat">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Örn: 12 metre uzunluğunda makine ekle. / B12 kolonuna forklift hız sınırı 10 km/h levhası ekle."
            />

            <button
              className="btn primary"
              onClick={askAi}
              disabled={aiBusy || !moduleIsActive(modules.ai)}
            >
              {aiBusy ? 'Plan hazırlanıyor...' : 'İşlem Planı Hazırla'}
            </button>

            {!moduleIsActive(modules.ai) && (
              <div className="notice warn">
                Bu projede AI modülü kapalı. Yeni proje sihirbazından AI modülü açık proje
                oluşturulmalı.
              </div>
            )}

            {plan && (
              <div className="ai-plan">
                <strong>{plan.summary}</strong>

                <p style={{ fontSize: 13 }}>
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

                <div className="actions">
                  <button className="btn accent small" onClick={applyPlanToProject} disabled={saving}>
                    {saving ? 'Uygulanıyor...' : 'Onayla ve Projeye Uygula'}
                  </button>

                  <button className="btn small" onClick={() => setPlan(null)} disabled={saving}>
                    İptal
                  </button>
                </div>
              </div>
            )}

            {message && <div className="notice">{message}</div>}
          </div>
        </div>

        <div className="editor-section">
          <h4>Aktif Modüller</h4>

          {[
            ['Envanter yönetimi', modules.inventory],
            ['İSG levha sistemi', modules.signs],
            ['Yangın ekipman planı', modules.fire],
            ['Ölçüm sistemi', modules.measurement],
            ['AI işlem motoru', modules.ai],
            ['Mobil görüntüleme', modules.mobile]
          ].map(([label, active]) => (
            <div className="layer-row" key={String(label)}>
              <span>{label as string}</span>
              <span className="badge">
                {moduleIsActive(active as boolean | undefined) ? 'Aktif' : 'Kapalı'}
              </span>
            </div>
          ))}
        </div>

        <div className="editor-section">
          <h4>Proje Geometrisi</h4>

          {firstBuilding ? (
            <div className="notice">
              <b>Bina:</b> {firstBuilding.width} m x {firstBuilding.depth} m x {firstBuilding.height} m
            </div>
          ) : (
            <div className="notice warn">Bina tanımlı değil.</div>
          )}

          {firstGrid ? (
            <div className="notice" style={{ marginTop: 10 }}>
              <b>Aks:</b> {firstGrid.rows?.join(', ')}
              <br />
              <b>Kolon:</b> {firstGrid.columns} adet / satır
              <br />
              <b>Aralık:</b> {firstGrid.columnSpacing} m
            </div>
          ) : (
            <div className="notice warn" style={{ marginTop: 10 }}>
              Kolon / aks sistemi yok.
            </div>
          )}
        </div>

        <div className="editor-section">
          <h4>Varlıklar</h4>

          {(state.assets || []).map((asset: any) => (
            <div className="asset-row" key={asset.id}>
              <span>
                <b>{asset.name}</b>
                <br />
                <small>{asset.category} · x:{asset.x} z:{asset.z}</small>
              </span>
            </div>
          ))}

          {!assetCount && <div className="notice">Henüz varlık yok.</div>}
        </div>
      </aside>
    </div>
  );
}
