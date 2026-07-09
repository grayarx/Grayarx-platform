import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { WidgetConfig, DashboardLayout, WidgetContextType, LayoutPreset } from '@/types/widgets';
import { useToast } from '@/components/ToastNotification';

/**
 * Widget Context for Dashboard Layout Management
 * Provides state and methods for widget management
 */
const WidgetContext = createContext<WidgetContextType | null>(null);

const DEFAULT_LAYOUT: DashboardLayout = {
  id: 'default',
  userId: '',
  name: 'Default Layout',
  widgets: [
    {
      id: 'widget-1',
      type: 'kpi-card',
      title: 'Total Leads',
      size: 'small',
      position: 0,
      isVisible: true,
    },
    {
      id: 'widget-2',
      type: 'kpi-card',
      title: 'Conversion Rate',
      size: 'small',
      position: 1,
      isVisible: true,
    },
    {
      id: 'widget-3',
      type: 'kpi-card',
      title: 'Avg Response Time',
      size: 'small',
      position: 2,
      isVisible: true,
    },
    {
      id: 'widget-4',
      type: 'kpi-card',
      title: 'Bookings',
      size: 'small',
      position: 3,
      isVisible: true,
    },
    {
      id: 'widget-5',
      type: 'chart',
      title: 'Lead Trends',
      size: 'large',
      position: 4,
      isVisible: true,
    },
    {
      id: 'widget-6',
      type: 'activity-feed',
      title: 'Recent Activity',
      size: 'medium',
      position: 5,
      isVisible: true,
    },
  ],
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const WidgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();
  const [layouts, setLayouts] = useState<DashboardLayout[]>([DEFAULT_LAYOUT]);
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [isEditMode, setEditMode] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string>();
  const [isDragging, setIsDragging] = useState(false);
  const [presets] = useState<LayoutPreset[]>([
    {
      id: 'preset-1',
      name: 'Sales Focus',
      description: 'Optimized for sales team',
      widgets: [
        {
          id: 'widget-1',
          type: 'kpi-card',
          title: 'Total Leads',
          size: 'small',
          position: 0,
          isVisible: true,
        },
        {
          id: 'widget-2',
          type: 'kpi-card',
          title: 'Conversion Rate',
          size: 'small',
          position: 1,
          isVisible: true,
        },
        {
          id: 'widget-5',
          type: 'chart',
          title: 'Lead Trends',
          size: 'large',
          position: 2,
          isVisible: true,
        },
      ],
    },
    {
      id: 'preset-2',
      name: 'Operations Focus',
      description: 'Optimized for operations team',
      widgets: [
        {
          id: 'widget-3',
          type: 'kpi-card',
          title: 'Avg Response Time',
          size: 'small',
          position: 0,
          isVisible: true,
        },
        {
          id: 'widget-4',
          type: 'kpi-card',
          title: 'Bookings',
          size: 'small',
          position: 1,
          isVisible: true,
        },
        {
          id: 'widget-6',
          type: 'activity-feed',
          title: 'Recent Activity',
          size: 'large',
          position: 2,
          isVisible: true,
        },
      ],
    },
  ]);

  // Load layout from localStorage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        setCurrentLayout(parsed);
      } catch (err) {
        console.error('Failed to load saved layout:', err);
      }
    }
  }, []);

  const addWidget = useCallback((widget: WidgetConfig) => {
    setCurrentLayout((prev) => ({
      ...prev,
      widgets: [...prev.widgets, widget],
      updatedAt: new Date(),
    }));
    toast.success(`Widget "${widget.title}" added`);
  }, [toast]);

  const removeWidget = useCallback((widgetId: string) => {
    setCurrentLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== widgetId),
      updatedAt: new Date(),
    }));
    toast.success('Widget removed');
  }, [toast]);

  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    setCurrentLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === widgetId ? { ...w, ...updates, lastRefreshed: new Date() } : w
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const reorderWidgets = useCallback((widgets: WidgetConfig[]) => {
    setCurrentLayout((prev) => ({
      ...prev,
      widgets,
      updatedAt: new Date(),
    }));
  }, []);

  const saveLayout = useCallback(async (layout: DashboardLayout) => {
    try {
      // Save to localStorage
      localStorage.setItem('dashboardLayout', JSON.stringify(layout));
      setCurrentLayout(layout);
      setLayouts((prev) => {
        const existing = prev.find((l) => l.id === layout.id);
        if (existing) {
          return prev.map((l) => (l.id === layout.id ? layout : l));
        }
        return [...prev, layout];
      });
      toast.success('Layout saved successfully');
    } catch (err) {
      toast.error('Failed to save layout');
      throw err;
    }
  }, [toast]);

  const loadLayout = useCallback(async (layoutId: string) => {
    try {
      const layout = layouts.find((l) => l.id === layoutId);
      if (layout) {
        setCurrentLayout(layout);
        localStorage.setItem('dashboardLayout', JSON.stringify(layout));
        toast.success('Layout loaded');
      }
    } catch (err) {
      toast.error('Failed to load layout');
      throw err;
    }
  }, [layouts, toast]);

  const createLayout = useCallback(async (name: string) => {
    const newLayout: DashboardLayout = {
      id: `layout-${Date.now()}`,
      userId: '',
      name,
      widgets: currentLayout.widgets,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await saveLayout(newLayout);
    return newLayout;
  }, [currentLayout.widgets, saveLayout]);

  const deleteLayout = useCallback(async (layoutId: string) => {
    try {
      setLayouts((prev) => prev.filter((l) => l.id !== layoutId));
      if (currentLayout.id === layoutId) {
        setCurrentLayout(DEFAULT_LAYOUT);
        localStorage.setItem('dashboardLayout', JSON.stringify(DEFAULT_LAYOUT));
      }
      toast.success('Layout deleted');
    } catch (err) {
      toast.error('Failed to delete layout');
      throw err;
    }
  }, [currentLayout.id, toast]);

  const resetToDefault = useCallback(async () => {
    await saveLayout(DEFAULT_LAYOUT);
    toast.success('Layout reset to default');
  }, [saveLayout, toast]);

  const applyPreset = useCallback(async (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      const newLayout: DashboardLayout = {
        ...currentLayout,
        widgets: preset.widgets,
        updatedAt: new Date(),
      };
      await saveLayout(newLayout);
      toast.success(`Preset "${preset.name}" applied`);
    }
  }, [presets, currentLayout, saveLayout, toast]);

  const value: WidgetContextType = {
    state: {
      layouts,
      currentLayout: currentLayout || null,
      isEditMode,
      selectedWidget,
      isDragging,
      presets,
      themePresets: [],
      favoriteThemes: [],
    },
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    saveLayout,
    loadLayout,
    createLayout,
    deleteLayout,
    setEditMode,
    resetToDefault,
    applyPreset,
  };

  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  );
};

export const useWidgets = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidgets must be used within WidgetProvider');
  }
  return context;
};
