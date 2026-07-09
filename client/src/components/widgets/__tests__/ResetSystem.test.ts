import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resetWidgetToDefault,
  resetWidgetTheme,
  resetWidgetSettings,
  resetDashboardToDefault,
  resetAllWidgetThemes,
  resetAllWidgetSettings,
  createWidgetBackup,
  createDashboardBackup,
  restoreFromBackup,
  saveBackupToLocalStorage,
  getBackupsFromLocalStorage,
  getLatestBackup,
  deleteBackup,
  clearAllBackups,
  getBackupHistory,
  getResetStatistics,
  DEFAULT_WIDGET_THEME,
} from '@/lib/resetUtils';
import { WidgetConfig, DashboardLayout } from '@/types/widgets';

/**
 * Tests for Reset System
 * Verifies reset functionality for widgets and dashboard
 */

describe('Reset System', () => {
  const mockWidget: WidgetConfig = {
    id: 'widget-1',
    type: 'kpi-card',
    title: 'Test Widget',
    size: 'medium',
    position: 0,
    isVisible: true,
    isLocked: true,
    settings: { customSetting: 'value' },
    refreshInterval: 600,
    theme: {
      id: 'custom-theme',
      name: 'Custom',
      mode: 'dark',
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      accentColor: '#FF0000',
      borderColor: '#333333',
      borderRadius: 'lg',
      borderWidth: 2,
      shadowSize: 'lg',
      opacity: 80,
    },
  };

  const mockLayout: DashboardLayout = {
    id: 'layout-1',
    userId: 'user-1',
    name: 'Test Layout',
    widgets: [mockWidget],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Widget Reset', () => {
    it('should reset widget to default', () => {
      const reset = resetWidgetToDefault(mockWidget);
      expect(reset.id).toBe(mockWidget.id);
      expect(reset.isLocked).toBe(false);
      expect(reset.settings).toEqual({});
      expect(reset.refreshInterval).toBe(300);
    });

    it('should reset widget theme only', () => {
      const reset = resetWidgetTheme(mockWidget);
      expect(reset.theme).toEqual(DEFAULT_WIDGET_THEME);
      expect(reset.settings).toEqual(mockWidget.settings);
      expect(reset.refreshInterval).toBe(mockWidget.refreshInterval);
    });

    it('should reset widget settings only', () => {
      const reset = resetWidgetSettings(mockWidget);
      expect(reset.settings).toEqual({});
      expect(reset.refreshInterval).toBe(300);
      expect(reset.theme).toEqual(mockWidget.theme);
    });

    it('should preserve widget ID after reset', () => {
      const reset = resetWidgetToDefault(mockWidget);
      expect(reset.id).toBe(mockWidget.id);
      expect(reset.type).toBe(mockWidget.type);
      expect(reset.title).toBe(mockWidget.title);
    });
  });

  describe('Dashboard Reset', () => {
    it('should reset dashboard to default', () => {
      const reset = resetDashboardToDefault(mockLayout);
      expect(reset.id).toBe(mockLayout.id);
      expect(reset.widgets).toHaveLength(1);
      expect(reset.widgets[0].isLocked).toBe(false);
      expect(reset.widgets[0].settings).toEqual({});
    });

    it('should reset all widget themes in dashboard', () => {
      const reset = resetAllWidgetThemes(mockLayout);
      expect(reset.widgets[0].theme).toEqual(DEFAULT_WIDGET_THEME);
      expect(reset.widgets[0].settings).toEqual(mockWidget.settings);
    });

    it('should reset all widget settings in dashboard', () => {
      const reset = resetAllWidgetSettings(mockLayout);
      expect(reset.widgets[0].settings).toEqual({});
      expect(reset.widgets[0].theme).toEqual(mockWidget.theme);
    });

    it('should handle multiple widgets', () => {
      const multiLayout: DashboardLayout = {
        ...mockLayout,
        widgets: [mockWidget, { ...mockWidget, id: 'widget-2' }],
      };
      const reset = resetDashboardToDefault(multiLayout);
      expect(reset.widgets).toHaveLength(2);
      expect(reset.widgets[0].isLocked).toBe(false);
      expect(reset.widgets[1].isLocked).toBe(false);
    });
  });

  describe('Backup & Restore', () => {
    it('should create widget backup', () => {
      const backup = createWidgetBackup(mockWidget);
      expect(backup.type).toBe('widget');
      expect(backup.itemId).toBe(mockWidget.id);
      expect(backup.itemName).toBe(mockWidget.title);
      expect(backup.originalState).toEqual(mockWidget);
    });

    it('should create dashboard backup', () => {
      const backup = createDashboardBackup(mockLayout);
      expect(backup.type).toBe('dashboard');
      expect(backup.itemId).toBe(mockLayout.id);
      expect(backup.itemName).toBe(mockLayout.name);
      expect(backup.originalState).toEqual(mockLayout);
    });

    it('should restore from backup', () => {
      const backup = createWidgetBackup(mockWidget);
      const restored = restoreFromBackup<WidgetConfig>(backup);
      expect(restored).toEqual(mockWidget);
    });

    it('should create deep copy in backup', () => {
      const backup = createWidgetBackup(mockWidget);
      const restored = restoreFromBackup<WidgetConfig>(backup);
      restored.title = 'Modified';
      expect(mockWidget.title).toBe('Test Widget');
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save backup to localStorage', () => {
      const backup = createWidgetBackup(mockWidget);
      saveBackupToLocalStorage(backup);
      const backups = getBackupsFromLocalStorage();
      expect(backups).toHaveLength(1);
      expect(backups[0].id).toBe(backup.id);
    });

    it('should get backups from localStorage', () => {
      const backup1 = createWidgetBackup(mockWidget);
      const backup2 = createDashboardBackup(mockLayout);
      saveBackupToLocalStorage(backup1);
      saveBackupToLocalStorage(backup2);
      const backups = getBackupsFromLocalStorage();
      expect(backups).toHaveLength(2);
    });

    it('should limit backups to 20', () => {
      for (let i = 0; i < 25; i++) {
        const backup = createWidgetBackup({ ...mockWidget, id: `widget-${i}` });
        saveBackupToLocalStorage(backup);
      }
      const backups = getBackupsFromLocalStorage();
      expect(backups.length).toBeLessThanOrEqual(20);
    });

    it('should get latest backup', () => {
      const backup1 = createWidgetBackup(mockWidget);
      const backup2 = createWidgetBackup({ ...mockWidget, id: 'widget-2' });
      saveBackupToLocalStorage(backup1);
      saveBackupToLocalStorage(backup2);
      const latest = getLatestBackup();
      expect(latest?.id).toBe(backup2.id);
    });

    it('should delete backup', () => {
      const backup = createWidgetBackup(mockWidget);
      saveBackupToLocalStorage(backup);
      deleteBackup(backup.id);
      const backups = getBackupsFromLocalStorage();
      expect(backups).toHaveLength(0);
    });

    it('should clear all backups', () => {
      const backup1 = createWidgetBackup(mockWidget);
      const backup2 = createDashboardBackup(mockLayout);
      saveBackupToLocalStorage(backup1);
      saveBackupToLocalStorage(backup2);
      clearAllBackups();
      const backups = getBackupsFromLocalStorage();
      expect(backups).toHaveLength(0);
    });
  });

  describe('Backup History', () => {
    it('should get backup history', () => {
      for (let i = 0; i < 5; i++) {
        const backup = createWidgetBackup({ ...mockWidget, id: `widget-${i}` });
        saveBackupToLocalStorage(backup);
      }
      const history = getBackupHistory(10);
      expect(history.length).toBeLessThanOrEqual(5);
    });

    it('should limit history to specified count', () => {
      for (let i = 0; i < 10; i++) {
        const backup = createWidgetBackup({ ...mockWidget, id: `widget-${i}` });
        saveBackupToLocalStorage(backup);
      }
      const history = getBackupHistory(5);
      expect(history).toHaveLength(5);
    });

    it('should return history in reverse order', () => {
      const backup1 = createWidgetBackup({ ...mockWidget, id: 'widget-1' });
      const backup2 = createWidgetBackup({ ...mockWidget, id: 'widget-2' });
      saveBackupToLocalStorage(backup1);
      saveBackupToLocalStorage(backup2);
      const history = getBackupHistory();
      expect(history[0].id).toBe(backup2.id);
      expect(history[1].id).toBe(backup1.id);
    });
  });

  describe('Reset Statistics', () => {
    it('should calculate reset statistics', () => {
      const backup1 = createWidgetBackup(mockWidget);
      const backup2 = createDashboardBackup(mockLayout);
      saveBackupToLocalStorage(backup1);
      saveBackupToLocalStorage(backup2);
      const stats = getResetStatistics();
      expect(stats.totalResets).toBe(2);
      expect(stats.widgetResets).toBe(1);
      expect(stats.dashboardResets).toBe(1);
      expect(stats.backupsAvailable).toBe(2);
    });

    it('should track last reset', () => {
      const backup = createWidgetBackup(mockWidget);
      saveBackupToLocalStorage(backup);
      const stats = getResetStatistics();
      expect(stats.lastReset).toBeDefined();
    });

    it('should handle empty history', () => {
      const stats = getResetStatistics();
      expect(stats.totalResets).toBe(0);
      expect(stats.widgetResets).toBe(0);
      expect(stats.dashboardResets).toBe(0);
      expect(stats.lastReset).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle widget with no theme', () => {
      const widget: WidgetConfig = {
        ...mockWidget,
        theme: undefined,
      };
      const reset = resetWidgetToDefault(widget);
      expect(reset.theme).toEqual(DEFAULT_WIDGET_THEME);
    });

    it('should handle widget with no settings', () => {
      const widget: WidgetConfig = {
        ...mockWidget,
        settings: undefined,
      };
      const reset = resetWidgetToDefault(widget);
      expect(reset.settings).toEqual({});
    });

    it('should handle empty dashboard', () => {
      const layout: DashboardLayout = {
        ...mockLayout,
        widgets: [],
      };
      const reset = resetDashboardToDefault(layout);
      expect(reset.widgets).toHaveLength(0);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('resetBackups', 'invalid json');
      const backups = getBackupsFromLocalStorage();
      expect(backups).toEqual([]);
    });
  });

  describe('Performance', () => {
    it('should reset widget quickly', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        resetWidgetToDefault(mockWidget);
      }
      const end = performance.now();
      expect(end - start).toBeLessThan(100);
    });

    it('should reset dashboard quickly', () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        resetDashboardToDefault(mockLayout);
      }
      const end = performance.now();
      expect(end - start).toBeLessThan(100);
    });

    it('should create backup quickly', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        createWidgetBackup(mockWidget);
      }
      const end = performance.now();
      expect(end - start).toBeLessThan(100);
    });
  });
});
