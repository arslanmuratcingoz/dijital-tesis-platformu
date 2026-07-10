import { ProjectState, ProjectTemplate, AssetCategory, AiCommandPlan } from '@/types/project';
import { uid } from '@/lib/utils';

export function createBlankProjectState(name = 'Yeni Dijital Tesis Projesi', template: ProjectTemplate = 'blank'): ProjectState {
  return {
    schemaVersion: 1,
    name,
    description: '',
    template,
    units: 'm',
    deviceMode: 'pc',
    settings: {
      showGrid: true,
      showAxes: true,
      background: 'light',
      defaultCamera: 'isometric'
    },
    layers: [
      { id: 'buildings', name: 'Binalar ve Yapılar', visible: true, color: '#2f4c73' },
      { id: 'columns', name: 'Kolon ve Aks Sistemi', visible: true, color: '#6c7683' },
      { id: 'machines', name: 'Makine ve Ekipman', visible: true, color: '#b87815' },
      { id: 'racks', name: 'Raf ve Depolama', visible: true, color: '#576879' },
      { id: 'signs', name: 'İSG Levha ve Tabela', visible: true, color: '#d19216' },
      { id: 'fire', name: 'Yangın Ekipmanları', visible: true, color: '#b43b2d' },
      { id: 'electrical', name: 'Elektrik ve Pano', visible: true, color: '#48505c' }
    ],
    buildings: [],
    columnGrids: [],
    assets: [],
    notes: []
  };
}

export function createTemplateState(name: string, template: ProjectTemplate): ProjectState {
  const state = createBlankProjectState(name, template);
  if (template === 'factory') {
    state.buildings.push({
      id: uid('bld'), name: 'Ana Üretim Binası', x: 0, z: 0, width: 84, depth: 180, height: 14,
      wallColor: '#d7dde5', roofColor: '#9ca8b6', opacity: 0.55, layerId: 'buildings'
    });
    state.columnGrids.push({
      id: uid('grid'), name: '4 Sıra x 20 Aks Kolon Izgarası', originX: -42, originZ: -80,
      rows: ['A', 'B', 'C', 'D'], columns: 20, rowSpacing: 28, columnSpacing: 8,
      columnWidth: 0.75, columnHeight: 12, visible: true
    });
  }
  if (template === 'warehouse') {
    state.buildings.push({
      id: uid('bld'), name: 'Depo Alanı', x: 0, z: 0, width: 60, depth: 120, height: 10,
      wallColor: '#dbe1e8', roofColor: '#a2adb8', opacity: 0.55, layerId: 'buildings'
    });
  }
  return state;
}

export const assetPresets: Array<{
  category: AssetCategory;
  label: string;
  description: string;
  width: number;
  depth: number;
  height: number;
  color: string;
  layerId: string;
}> = [
  { category: 'machine', label: 'Makine', description: 'Üretim makinesi veya özel ekipman', width: 5, depth: 3, height: 2.4, color: '#b87815', layerId: 'machines' },
  { category: 'rack', label: 'Endüstriyel Raf', description: 'Depolama rafı / konsol raf', width: 8, depth: 1.5, height: 4, color: '#5f7185', layerId: 'racks' },
  { category: 'vehicle', label: 'Forklift / Araç', description: 'Forklift veya saha aracı', width: 2.2, depth: 3.5, height: 2.4, color: '#c58b22', layerId: 'machines' },
  { category: 'sign', label: 'İSG Levhası', description: 'Uyarı, yasak, KKD veya yönlendirme levhası', width: 1.2, depth: 0.12, height: 0.8, color: '#d19216', layerId: 'signs' },
  { category: 'fire', label: 'Yangın Ekipmanı', description: 'Yangın dolabı, tüp veya hidrant', width: 0.7, depth: 0.35, height: 1.4, color: '#b43b2d', layerId: 'fire' },
  { category: 'electrical', label: 'Elektrik Panosu', description: 'Elektrik panosu veya MCC alanı', width: 1.2, depth: 0.45, height: 2, color: '#48505c', layerId: 'electrical' }
];

export function fallbackPlanFromPrompt(prompt: string): AiCommandPlan {
  const p = prompt.toLocaleLowerCase('tr-TR');
  const warnings: string[] = ['OPENAI_API_KEY tanımlı değilse yerel kural motoru çalışır; karmaşık komutlar için gerçek AI anahtarı gerekir.'];
  if (p.includes('bina') || p.includes('fabrika') || p.includes('yapı')) {
    return {
      summary: 'Yeni bir bina ekleme işlemi hazırlandı.', confidence: 0.64, requiresApproval: true, warnings,
      humanReadableSteps: ['Boş tesis alanına standart ölçülü bir bina eklenecek.', 'İstersen ölçüler sonradan proje ayarlarından düzenlenebilir.'],
      actions: [{ action: 'create_building', payload: { name: 'Yeni Bina', x: 0, z: 0, width: 60, depth: 100, height: 12 } }]
    };
  }
  if (p.includes('levha') || p.includes('tabela') || p.includes('işaret')) {
    return {
      summary: 'Yeni İSG levhası ekleme işlemi hazırlandı.', confidence: 0.66, requiresApproval: true, warnings,
      humanReadableSteps: ['İSG Levha ve Tabela katmanına standart levha eklenecek.', 'Konum daha sonra sürükle/taşı komutuyla düzenlenebilir.'],
      actions: [{ action: 'create_sign', payload: { name: 'Yeni İSG Levhası', x: 0, z: 0, width: 1.2, depth: 0.12, height: 0.8 } }]
    };
  }
  if (p.includes('raf')) {
    return {
      summary: 'Yeni raf ekleme işlemi hazırlandı.', confidence: 0.69, requiresApproval: true, warnings,
      humanReadableSteps: ['Raf ve Depolama katmanına standart endüstriyel raf eklenecek.'],
      actions: [{ action: 'create_asset', payload: { category: 'rack', name: 'Endüstriyel Raf', x: 0, z: 0, width: 8, depth: 1.5, height: 4, layerId: 'racks', color: '#5f7185' } }]
    };
  }
  return {
    summary: 'Komut için güvenli işlem planı üretilemedi.', confidence: 0.35, requiresApproval: true, warnings,
    humanReadableSteps: ['Komutu daha net yaz: “12 metre makine ekle”, “Bina oluştur”, “Levha ekle” gibi.'],
    actions: [{ action: 'noop', payload: { reason: 'Belirsiz komut' } }]
  };
}
