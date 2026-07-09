import { WidgetConfig, DashboardLayout, WidgetTheme } from '@/types/widgets';

/**
 * Reset Utilities
 * Handles resetting widgets and dashboard to default states
 */

/**
 * Default widget theme
 */
export const DEFAULT_WIDGET_THEME: WidgetTheme = {
  id: 'default-theme',
  name: 'Default',
  mode: 'light',
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  accentColor: '#3B82F6',
  borderColor: '#E5E7EB',
  borderRadius: 'md',
  borderWidth: 1,
  shadowSize: 'md',
  opacity: 100,
};

/**
 * Default widget configuration
 */
export const getDefaultWidgetConfig = (id: string, type: string): Partial<WidgetConfig> => ({
  isVisible: true,
  isLocked: false,
  theme: DEFAULT_WIDGET_THEME,
  refreshInterval: 300,
  settings: {},
});

/**
 * Reset individual widget to default
 */
export const resetWidgetToDefault = (widget: WidgetConfig): WidgetConfig => {
  return {
    ...widget,
    theme: DEFAULT_WIDGET_THEME,
    refreshInterval: 300,
    settings: {},
    isLocked: false,
  };
};

/**
 * Reset widget theme only
 */
export const resetWidgetTheme = (widget: WidgetConfig): WidgetConfig => {
  return {
    ...widget,
    theme: DEFAULT_WIDGET_THEME,
  };
};

/**
 * Reset widget settings only
 */
export const resetWidgetSettings = (widget: WidgetConfig): WidgetConfig => {
  return {
    ...widget,
    settings: {},
    refreshInterval: 300,
  };
};

/**
 * Reset dashboard to default layout
 */
export const resetDashboardToDefault = (layout: DashboardLayout): DashboardLayout => {
  return {
    ...layout,
    widgets: layout.widgets.map((widget) => resetWidgetToDefault(widget)),
  };
};

/**
 * Reset all widget themes in dashboard
 */
export const resetAllWidgetThemes = (layout: DashboardLayout): DashboardLayout => {
  return {
    ...layout,
    widgets: layout.widgets.map((widget) => resetWidgetTheme(widget)),
  };
};

/**
 * Reset all widget settings in dashboard
 */
export const resetAllWidgetSettings = (layout: DashboardLayout): DashboardLayout => {
  return {
    ...layout,
    widgets: layout.widgets.map((widget) => resetWidgetSettings(widget)),
  };
};

/**
 * Create a backup of current state before reset
 */
export interface ResetBackup {
  id: string;
  timestamp: Date;
  type: 'widget' | 'dashboard';
  itemId: string;
  itemName: string;
  originalState: any;
}

/**
 * Create widget backup
 */
export const createWidgetBackup = (widget: WidgetConfig): ResetBackup => {
  return {
    id: `backup-${Date.now()}`,
    timestamp: new Date(),
    type: 'widget',
    itemId: widget.id,
    itemName: widget.title,
    originalState: JSON.parse(JSON.stringify(widget)),
  };
};

/**
 * Create dashboard backup
 */
export const createDashboardBackup = (layout: DashboardLayout): ResetBackup => {
  return {
    id: `backup-${Date.now()}`,
    timestamp: new Date(),
    type: 'dashboard',
    itemId: layout.id,
    itemName: layout.name,
    originalState: JSON.parse(JSON.stringify(layout)),
  };
};

/**
 * Restore from backup
 */
export const restoreFromBackup = <T>(backup: ResetBackup): T => {
  return JSON.parse(JSON.stringify(backup.originalState)) as T;
};

/**
 * Save backup to localStorage
 */
export const saveBackupToLocalStorage = (backup: ResetBackup): void => {
  const backups = getBackupsFromLocalStorage();
  backups.push(backup);
  // Keep only last 20 backups
  if (backups.length > 20) {
    backups.shift();
  }
  localStorage.setItem('resetBackups', JSON.stringify(backups));
};

/**
 * Get backups from localStorage
 */
export const getBackupsFromLocalStorage = (): ResetBackup[] => {
  const stored = localStorage.getItem('resetBackups');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

/**
 * Get latest backup
 */
export const getLatestBackup = (): ResetBackup | null => {
  const backups = getBackupsFromLocalStorage();
  return backups.length > 0 ? backups[backups.length - 1] : null;
};

/**
 * Delete backup
 */
export const deleteBackup = (backupId: string): void => {
  const backups = getBackupsFromLocalStorage();
  const filtered = backups.filter((b) => b.id !== backupId);
  localStorage.setItem('resetBackups', JSON.stringify(filtered));
};

/**
 * Clear all backups
 */
export const clearAllBackups = (): void => {
  localStorage.removeItem('resetBackups');
};

/**
 * Get backup history
 */
export const getBackupHistory = (limit: number = 10): ResetBackup[] => {
  const backups = getBackupsFromLocalStorage();
  return backups.slice(-limit).reverse();
};

/**
 * Format backup timestamp
 */
export const formatBackupTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Export reset statistics
 */
export interface ResetStatistics {
  totalResets: number;
  widgetResets: number;
  dashboardResets: number;
  lastReset?: Date;
  backupsAvailable: number;
}

export const getResetStatistics = (): ResetStatistics => {
  const backups = getBackupsFromLocalStorage();
  const widgetResets = backups.filter((b) => b.type === 'widget').length;
  const dashboardResets = backups.filter((b) => b.type === 'dashboard').length;

  return {
    totalResets: backups.length,
    widgetResets,
    dashboardResets,
    lastReset: backups.length > 0 ? backups[backups.length - 1].timestamp : undefined,
    backupsAvailable: backups.length,
  };
};
