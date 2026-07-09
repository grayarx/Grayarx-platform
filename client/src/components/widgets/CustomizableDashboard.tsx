import React, { useState, useMemo } from 'react';
import { useWidgets } from '@/contexts/WidgetContext';
import { WidgetGrid } from './WidgetGrid';
import { WidgetToolbar } from './WidgetToolbar';
import { WidgetConfig, WidgetType } from '@/types/widgets';
import { LoadingSpinner } from '@/components/LoadingAnimations';
import { cn } from '@/lib/utils';

export interface CustomizableDashboardProps {
  className?: string;
  onWidgetUpdate?: (widget: WidgetConfig) => void;
}

/**
 * Customizable Dashboard with Drag-and-Drop Widget Layout
 * Allows users to rearrange, add, remove, and customize dashboard widgets
 */
export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  className,
  onWidgetUpdate,
}) => {
  const {
    state,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    saveLayout,
    setEditMode,
    resetToDefault,
    applyPreset,
  } = useWidgets();

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const visibleWidgets = useMemo(
    () => state.currentLayout?.widgets.filter((w) => w.isVisible) || [],
    [state.currentLayout?.widgets]
  );

  const handleAddWidget = (type: WidgetType) => {
    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      type,
      title: type.replace(/-/g, ' ').toUpperCase(),
      size: 'medium',
      position: visibleWidgets.length,
      isVisible: true,
    };
    addWidget(newWidget);
    setHasChanges(true);
  };

  const handleRemoveWidget = (widgetId: string) => {
    removeWidget(widgetId);
    setHasChanges(true);
  };

  const handleUpdateWidget = (widgetId: string, updates: Partial<WidgetConfig>) => {
    updateWidget(widgetId, updates);
    setHasChanges(true);
    onWidgetUpdate?.(updates as WidgetConfig);
  };

  const handleReorderWidgets = (widgets: WidgetConfig[]) => {
    reorderWidgets(widgets);
    setHasChanges(true);
  };

  const handleSaveLayout = async () => {
    setIsLoading(true);
    try {
      if (state.currentLayout) {
        await saveLayout(state.currentLayout);
        setHasChanges(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEditMode = (isEdit: boolean) => {
    setEditMode(isEdit);
    if (!isEdit && hasChanges) {
      handleSaveLayout();
    }
  };

  const handleResetLayout = async () => {
    if (confirm('Are you sure you want to reset to the default layout?')) {
      setIsLoading(true);
      try {
        await resetToDefault();
        setHasChanges(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleApplyPreset = async (presetId: string) => {
    setIsLoading(true);
    try {
      await applyPreset(presetId);
      setHasChanges(false);
    } finally {
      setIsLoading(false);
    }
  };

  const renderWidget = (config: WidgetConfig) => {
    // This is where you'd render actual widget content
    // For now, we'll show a placeholder
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] bg-muted/30 rounded">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">{config.type}</p>
          <p className="text-xs text-muted-foreground mt-1">Widget content here</p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingSpinner text="Updating layout..." />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <WidgetToolbar
        isEditMode={state.isEditMode}
        onToggleEditMode={handleToggleEditMode}
        onAddWidget={handleAddWidget}
        onSaveLayout={handleSaveLayout}
        onResetLayout={handleResetLayout}
        onApplyPreset={handleApplyPreset}
        presets={state.presets}
        hasChanges={hasChanges}
      />

      {/* Widget Grid */}
      <WidgetGrid
        widgets={visibleWidgets}
        isEditing={state.isEditMode}
        onReorder={handleReorderWidgets}
        onUpdateWidget={handleUpdateWidget}
        onRemoveWidget={handleRemoveWidget}
        renderWidget={renderWidget}
        columns={4}
      />

      {/* Empty State */}
      {visibleWidgets.length === 0 && (
        <div className="flex items-center justify-center py-12 border border-dashed rounded-lg">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">No widgets</p>
            <p className="text-sm text-muted-foreground mt-1">
              {state.isEditMode
                ? 'Add widgets using the toolbar above'
                : 'Enable edit mode to add widgets'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizableDashboard;
