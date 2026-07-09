/**
 * Widget Layout System Types
 * Defines the structure for customizable dashboard widgets
 */

export type WidgetType = 
  | 'kpi-card'
  | 'chart'
  | 'table'
  | 'activity-feed'
  | 'leads-summary'
  | 'conversion-metrics'
  | 'response-time'
  | 'bookings'
  | 'custom';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface WidgetTheme {
  id: string;
  name: string;
  description?: string;
  mode: ThemeMode;
  backgroundColor: string; // hex color
  textColor: string; // hex color
  accentColor: string; // hex color
  borderColor: string; // hex color
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  borderWidth: 0 | 1 | 2 | 4;
  shadowSize: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  opacity: number; // 0-100
  customCSS?: string;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  size: WidgetSize;
  position: number;
  isVisible: boolean;
  isLocked?: boolean;
  settings?: Record<string, any>;
  refreshInterval?: number; // in seconds
  lastRefreshed?: Date;
  theme?: WidgetTheme;
  themePresetId?: string;
}

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  widgets: WidgetConfig[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetDragItem {
  id: string;
  type: WidgetType;
  index: number;
}

export interface GridPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type WidgetRegistry = {
  [key in WidgetType]: {
    name: string;
    description: string;
    icon: string;
    defaultSize: WidgetSize;
    minWidth: number;
    minHeight: number;
    maxWidth?: number;
    maxHeight?: number;
    component: React.ComponentType<any>;
    configurable: boolean;
  };
}

export interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  category: 'professional' | 'vibrant' | 'minimal' | 'dark' | 'custom';
  themes: WidgetTheme[];
  isFavorite?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  widgets: WidgetConfig[];
  thumbnail?: string;
}

export interface WidgetState {
  layouts: DashboardLayout[];
  currentLayout: DashboardLayout | null;
  isEditMode: boolean;
  selectedWidget?: string;
  isDragging: boolean;
  presets: LayoutPreset[];
  themePresets: ThemePreset[];
  favoriteThemes: WidgetTheme[];
  currentTheme?: WidgetTheme;
}

export interface WidgetContextType {
  state: WidgetState;
  addWidget: (widget: WidgetConfig) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  reorderWidgets: (widgets: WidgetConfig[]) => void;
  saveLayout: (layout: DashboardLayout) => Promise<void>;
  loadLayout: (layoutId: string) => Promise<void>;
  createLayout: (name: string) => Promise<DashboardLayout>;
  deleteLayout: (layoutId: string) => Promise<void>;
  setEditMode: (isEdit: boolean) => void;
  resetToDefault: () => Promise<void>;
  applyPreset: (presetId: string) => Promise<void>;
}

export interface WidgetProps {
  id: string;
  config: WidgetConfig;
  isEditing: boolean;
  onUpdate?: (updates: Partial<WidgetConfig>) => void;
  onRemove?: () => void;
  isDragging?: boolean;
}

export interface DraggableWidgetProps extends WidgetProps {
  index: number;
  isDraggingOver?: boolean;
}
