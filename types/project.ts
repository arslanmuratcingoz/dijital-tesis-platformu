export type UserRole = 'admin' | 'editor' | 'viewer';
export type DeviceMode = 'pc' | 'mobile';
export type ProjectTemplate = 'blank' | 'factory' | 'warehouse' | 'safety_signage' | 'fire_plan';
export type AssetCategory = 'building' | 'machine' | 'rack' | 'vehicle' | 'sign' | 'fire' | 'electrical' | 'custom';
export type AiActionType =
  | 'create_building'
  | 'edit_building'
  | 'delete_building'
  | 'create_column_grid'
  | 'create_asset'
  | 'place_asset'
  | 'move_asset'
  | 'delete_asset'
  | 'create_sign'
  | 'place_sign'
  | 'move_sign'
  | 'delete_sign'
  | 'create_layer'
  | 'toggle_layer'
  | 'generate_report'
  | 'noop';

export interface Vector3Like {
  x: number;
  y?: number;
  z: number;
}

export interface Dimensions3D {
  width: number;
  depth: number;
  height: number;
}

export interface LayerState {
  id: string;
  name: string;
  visible: boolean;
  locked?: boolean;
  color?: string;
}

export interface BuildingItem {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  wallColor?: string;
  roofColor?: string;
  opacity?: number;
  layerId?: string;
}

export interface ColumnGrid {
  id: string;
  name: string;
  originX: number;
  originZ: number;
  rows: string[];
  columns: number;
  rowSpacing: number;
  columnSpacing: number;
  columnWidth: number;
  columnHeight: number;
  visible: boolean;
}

export interface AssetItem {
  id: string;
  category: AssetCategory;
  name: string;
  x: number;
  z: number;
  y?: number;
  width: number;
  depth: number;
  height: number;
  rotation?: number;
  layerId?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectState {
  schemaVersion: 1;
  name: string;
  description?: string;
  template: ProjectTemplate;
  units: 'm';
  deviceMode: DeviceMode;
  settings: {
    showGrid: boolean;
    showAxes: boolean;
    background: 'light' | 'technical';
    defaultCamera: 'top' | 'isometric' | 'presentation';
  };
  layers: LayerState[];
  buildings: BuildingItem[];
  columnGrids: ColumnGrid[];
  assets: AssetItem[];
  notes: Array<{ id: string; text: string; x: number; z: number; createdAt: string }>;
  historyPointer?: number;
}

export interface AiCommandPlan {
  summary: string;
  confidence: number;
  requiresApproval: boolean;
  actions: Array<{
    action: AiActionType;
    targetId?: string;
    payload?: Record<string, unknown>;
  }>;
  warnings?: string[];
  humanReadableSteps: string[];
}
