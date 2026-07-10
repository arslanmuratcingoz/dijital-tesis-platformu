'use client';

import { useMemo, useState } from 'react';
import { ProjectState, AiCommandPlan, DeviceMode } from '@/types/project';
import { assetPresets } from '@/lib/projectDefaults';
import { uid } from '@/lib/utils';
import { ThreeScene } from '@/components/ThreeScene';
import { applyAiPlan } from '@/lib/applyActions';

type Props = {
  projectId: string;
  initialState: ProjectState;
  initialMode: DeviceMode;
  onSave: (state: ProjectState, changeLabel?: string, aiPlan?: AiCommandPlan | null, beforeState?: ProjectState) => Promise<void>;
};

export function ProjectEditor({ projectId, initialState, initialMode, onSave }: Props) {
  const [state, setState] = useState<ProjectState>({ ...initialState, deviceMode: initialMode });
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [plan, setPlan] = useState<AiCommandPlan | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selected = useMemo(() => state.assets.find((a) => a.id === selectedAsset), [state.assets, selectedAsset]);

  const save = async (label = 'Manuel kayıt', customState = state, aiPlan: AiCommandPlan | null = null, beforeState?: ProjectState) => {
    setSaving(true); setMessage(null);
    try { await onSave(customState, label, aiPlan, beforeState); setMessage('Kaydedildi.'); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Kayıt sırasında hata oluştu.'); }
    finally { setSaving(false); }
  };

  const addPreset = (preset: typeof assetPresets[number]) => {
    const index = state.assets.length;
    setState((prev) => ({
      ...prev,
      assets: [...prev.assets, {
        id: uid('asset'), category: preset.category, name: preset.label,
        x: (index % 6) * 4 - 10, z: Math.floor(index / 6) * 4 - 10, y: 0,
        width: preset.width, depth: preset.depth, height: preset.height,
        color: preset.color, layerId: preset.layerId, rotation: 0
      }]
    }));
  };

  const addBuilding = () => {
    setState((prev) => ({ ...prev, buildings: [...prev.buildings, {
      id: uid('bld'), name: 'Yeni Bina', x: 0, z: 0, width: 60, depth: 100, height: 12,
      wallColor: '#d7dde5', roofColor: '#9ca8b6', opacity: .58, layerId: 'buildings'
    }] }));
  };

  const addGrid = () => {
    setState((prev) => ({ ...prev, columnGrids: [...prev.columnGrids, {
      id: uid('grid'), name: 'Kolon Izgarası', originX: -30, originZ: -45, rows: ['A', 'B', 'C', 'D'], columns: 16,
      rowSpacing: 20, columnSpacing: 8, columnWidth: .7, columnHeight: 10, visible: true
    }] }));
  };

  const toggleLayer = (id: string) => setState((prev) => ({ ...prev, layers: prev.layers.map((l) => l.id === id ? { ...l, visible: !l.visible } : l) }));

  const askAi = async () => {
    if (!prompt.trim()) return;
    setAiBusy(true); setPlan(null); setMessage(null);
    try {
      const res = await fetch('/api/ai/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, prompt, projectState: state })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI planı alınamadı.');
      setPlan(data.plan);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'AI planı sırasında hata oluştu.'); }
    finally { setAiBusy(false); }
  };

  const applyPlan = async () => {
    if (!plan) return;
    const before = state;
    const next = applyAiPlan(before, plan);
    setState(next);
    setPlan(null); setPrompt('');
    await save(`AI komutu: ${plan.summary}`, next, plan, before);
  };

  const updateSelected = (patch: Record<string, number | string>) => {
    if (!selectedAsset) return;
    setState((prev) => ({ ...prev, assets: prev.assets.map((a) => a.id === selectedAsset ? { ...a, ...patch } : a) }));
  };

  const deleteSelected = () => {
    if (!selectedAsset) return;
    setState((prev) => ({ ...prev, assets: prev.assets.filter((a) => a.id !== selectedAsset) }));
    setSelectedAsset(null);
  };

  return (
    <div className="editor">
      <aside className="editor-left">
        <div className="editor-header"><div><div className="editor-title">Araçlar</div><div className="editor-sub">Proje: {state.name}</div></div></div>
        <div className="editor-section">
          <h4>Çalışma modu</h4>
          <div className="actions" style={{ marginTop: 0 }}>
            <button className={`btn small ${state.deviceMode === 'pc' ? 'primary' : ''}`} onClick={() => setState({ ...state, deviceMode: 'pc' })}>PC</button>
            <button className={`btn small ${state.deviceMode === 'mobile' ? 'primary' : ''}`} onClick={() => setState({ ...state, deviceMode: 'mobile' })}>Mobil</button>
          </div>
        </div>
        <div className="editor-section">
          <h4>Yapı araçları</h4>
          <div className="asset-list">
            <button className="asset-button" onClick={addBuilding}><strong>Bina oluştur</strong><span>Boş projeye ölçülendirilebilir bina ekler.</span></button>
            <button className="asset-button" onClick={addGrid}><strong>Kolon / aks oluştur</strong><span>Satır ve aks bazlı kolon sistemi üretir.</span></button>
          </div>
        </div>
        <div className="editor-section">
          <h4>Envanter ekle</h4>
          <div className="asset-list">
            {assetPresets.map((preset) => (
              <button key={preset.category} className="asset-button" onClick={() => addPreset(preset)}>
                <strong>{preset.label}</strong><span>{preset.description}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="editor-section">
          <h4>Katmanlar</h4>
          {state.layers.map((layer) => (
            <div className="layer-row" key={layer.id}>
              <span><span className="color-dot" style={{ background: layer.color || '#999' }} />{layer.name}</span>
              <button className="btn small" onClick={() => toggleLayer(layer.id)}>{layer.visible ? 'Açık' : 'Kapalı'}</button>
            </div>
          ))}
        </div>
      </aside>

      <main className="scene-wrap">
        <div className="editor-header">
          <div><div className="editor-title">Dijital tesis editörü</div><div className="editor-sub">Veritabanı tabanlı çalışma alanı · {state.deviceMode.toUpperCase()}</div></div>
          <div className="actions" style={{ margin: 0 }}>
            <button className="btn small" onClick={() => setState({ ...state, settings: { ...state.settings, showGrid: !state.settings.showGrid } })}>Grid</button>
            <button className="btn primary small" onClick={() => save()} disabled={saving}>{saving ? 'Kaydediliyor' : 'Kaydet'}</button>
          </div>
        </div>
        <div className="scene-canvas"><ThreeScene state={state} /></div>
        {!state.buildings.length && !state.assets.length && !state.columnGrids.length && (
          <div className="scene-empty">
            <div className="empty-box">
              <h2>Boş tesis projesi</h2>
              <p>Bu proje sıfırdan başlar. Sol panelden bina, kolon sistemi veya envanter ekle. AI panelinden doğal dille işlem planı oluşturabilirsin.</p>
            </div>
          </div>
        )}
      </main>

      <aside className="editor-right">
        <div className="editor-header"><div><div className="editor-title">AI ve özellikler</div><div className="editor-sub">Onaylı işlem motoru</div></div></div>
        <div className="editor-section">
          <h4>AI asistan</h4>
          <div className="ai-chat">
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Örn: 12 metre uzunluğunda makine ekle, raf alanı oluştur, B12 kolonuna levha yerleştir..." />
            <button className="btn primary" onClick={askAi} disabled={aiBusy}>{aiBusy ? 'Plan hazırlanıyor...' : 'İşlem Planı Hazırla'}</button>
            {plan && <div className="ai-plan"><strong>{plan.summary}</strong><ul>{plan.humanReadableSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>{plan.warnings?.map((w, i) => <div className="notice warn" key={i} style={{ marginTop: 8 }}>{w}</div>)}<div className="actions"><button className="btn accent small" onClick={applyPlan}>Uygula ve kaydet</button><button className="btn small" onClick={() => setPlan(null)}>İptal</button></div></div>}
            {message && <div className="notice">{message}</div>}
          </div>
        </div>
        <div className="editor-section">
          <h4>Varlıklar</h4>
          {state.assets.map((asset) => (
            <button key={asset.id} className="asset-button" style={{ width: '100%', marginBottom: 8, borderColor: selectedAsset === asset.id ? '#c78a1d' : undefined }} onClick={() => setSelectedAsset(asset.id)}>
              <strong>{asset.name}</strong><span>{asset.category} · x:{asset.x} z:{asset.z}</span>
            </button>
          ))}
          {!state.assets.length && <div className="notice">Henüz varlık yok.</div>}
        </div>
        {selected && <div className="editor-section">
          <h4>Seçili varlık</h4>
          <div className="form-grid">
            <div><label>Ad</label><input value={selected.name} onChange={(e) => updateSelected({ name: e.target.value })} /></div>
            <div><label>X</label><input type="number" value={selected.x} onChange={(e) => updateSelected({ x: Number(e.target.value) })} /></div>
            <div><label>Z</label><input type="number" value={selected.z} onChange={(e) => updateSelected({ z: Number(e.target.value) })} /></div>
            <div><label>Genişlik</label><input type="number" value={selected.width} onChange={(e) => updateSelected({ width: Number(e.target.value) })} /></div>
            <button className="btn danger" onClick={deleteSelected}>Varlığı sil</button>
          </div>
        </div>}
      </aside>
    </div>
  );
}
