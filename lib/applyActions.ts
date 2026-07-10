import { AiCommandPlan, ProjectState, AssetItem, BuildingItem } from '@/types/project';
import { uid } from '@/lib/utils';

function asNumber(value: unknown, fallback: number) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function applyAiPlan(state: ProjectState, plan: AiCommandPlan): ProjectState {
  const next: ProjectState = structuredClone(state);
  for (const item of plan.actions || []) {
    const payload = item.payload || {};
    if (item.action === 'noop') continue;

    if (item.action === 'create_layer') {
      const name = asString(payload.name, 'Yeni Katman');
      const id = asString(payload.id, uid('layer'));
      if (!next.layers.find((layer) => layer.id === id)) {
        next.layers.push({ id, name, visible: true, color: asString(payload.color, '#64748b') });
      }
    }

    if (item.action === 'toggle_layer') {
      const id = asString(payload.id, '');
      next.layers = next.layers.map((layer) => layer.id === id ? { ...layer, visible: typeof payload.visible === 'boolean' ? payload.visible : !layer.visible } : layer);
    }

    if (item.action === 'create_building') {
      const building: BuildingItem = {
        id: uid('bld'),
        name: asString(payload.name, 'Yeni Bina'),
        x: asNumber(payload.x, 0),
        z: asNumber(payload.z, 0),
        width: asNumber(payload.width, 60),
        depth: asNumber(payload.depth, 100),
        height: asNumber(payload.height, 12),
        wallColor: asString(payload.wallColor, '#d7dde5'),
        roofColor: asString(payload.roofColor, '#a5afbb'),
        opacity: asNumber(payload.opacity, 0.58),
        layerId: 'buildings'
      };
      next.buildings.push(building);
    }

    if (item.action === 'edit_building') {
      const targetId = item.targetId || asString(payload.id, '');
      next.buildings = next.buildings.map((building) => building.id === targetId ? {
        ...building,
        name: asString(payload.name, building.name),
        x: asNumber(payload.x, building.x),
        z: asNumber(payload.z, building.z),
        width: asNumber(payload.width, building.width),
        depth: asNumber(payload.depth, building.depth),
        height: asNumber(payload.height, building.height)
      } : building);
    }

    if (item.action === 'delete_building') {
      const targetId = item.targetId || asString(payload.id, '');
      next.buildings = next.buildings.filter((building) => building.id !== targetId);
    }

    if (item.action === 'create_column_grid') {
      next.columnGrids.push({
        id: uid('grid'), name: asString(payload.name, 'Kolon Izgarası'),
        originX: asNumber(payload.originX, -30), originZ: asNumber(payload.originZ, -50),
        rows: Array.isArray(payload.rows) ? payload.rows.map(String) : ['A', 'B', 'C', 'D'],
        columns: asNumber(payload.columns, 20), rowSpacing: asNumber(payload.rowSpacing, 28),
        columnSpacing: asNumber(payload.columnSpacing, 8), columnWidth: asNumber(payload.columnWidth, 0.7),
        columnHeight: asNumber(payload.columnHeight, 12), visible: true
      });
    }

    if (item.action === 'create_asset' || item.action === 'place_asset') {
      const asset: AssetItem = {
        id: uid('asset'),
        category: asString(payload.category, 'custom') as AssetItem['category'],
        name: asString(payload.name, 'Yeni Varlık'),
        x: asNumber(payload.x, 0), z: asNumber(payload.z, 0), y: asNumber(payload.y, 0),
        width: asNumber(payload.width, 2), depth: asNumber(payload.depth, 2), height: asNumber(payload.height, 2),
        rotation: asNumber(payload.rotation, 0),
        layerId: asString(payload.layerId, 'machines'),
        color: asString(payload.color, '#b87815'),
        metadata: typeof payload.metadata === 'object' && payload.metadata ? payload.metadata as Record<string, unknown> : {}
      };
      next.assets.push(asset);
    }

    if (item.action === 'create_sign' || item.action === 'place_sign') {
      next.assets.push({
        id: uid('sign'), category: 'sign', name: asString(payload.name, 'Yeni İSG Levhası'),
        x: asNumber(payload.x, 0), z: asNumber(payload.z, 0), y: asNumber(payload.y, 2.2),
        width: asNumber(payload.width, 1.2), depth: asNumber(payload.depth, 0.12), height: asNumber(payload.height, 0.8),
        rotation: asNumber(payload.rotation, 0), layerId: 'signs', color: asString(payload.color, '#d19216'),
        metadata: { text: asString(payload.text, asString(payload.name, 'İSG Levhası')) }
      });
    }

    if (item.action === 'move_asset' || item.action === 'move_sign') {
      const targetId = item.targetId || asString(payload.id, '');
      next.assets = next.assets.map((asset) => asset.id === targetId ? {
        ...asset, x: asNumber(payload.x, asset.x), z: asNumber(payload.z, asset.z), y: asNumber(payload.y, asset.y || 0), rotation: asNumber(payload.rotation, asset.rotation || 0)
      } : asset);
    }

    if (item.action === 'delete_asset' || item.action === 'delete_sign') {
      const targetId = item.targetId || asString(payload.id, '');
      next.assets = next.assets.filter((asset) => asset.id !== targetId);
    }
  }
  return next;
}
