import React, { useState } from 'react';
import { Plus, RotateCcw, Save, Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LayoutPreset, WidgetConfig, WidgetType } from '@/types/widgets';

export interface WidgetToolbarProps {
  isEditMode: boolean;
  onToggleEditMode: (isEdit: boolean) => void;
  onAddWidget: (type: WidgetType) => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
  onApplyPreset: (presetId: string) => void;
  presets: LayoutPreset[];
  hasChanges: boolean;
  className?: string;
}

const AVAILABLE_WIDGETS: Array<{ type: WidgetType; label: string; icon: string }> = [
  { type: 'kpi-card', label: 'KPI Card', icon: '📊' },
  { type: 'chart', label: 'Chart', icon: '📈' },
  { type: 'table', label: 'Table', icon: '📋' },
  { type: 'activity-feed', label: 'Activity Feed', icon: '📝' },
  { type: 'leads-summary', label: 'Leads Summary', icon: '👥' },
  { type: 'conversion-metrics', label: 'Conversion Metrics', icon: '🎯' },
  { type: 'response-time', label: 'Response Time', icon: '⏱️' },
  { type: 'bookings', label: 'Bookings', icon: '📅' },
];

/**
 * Widget Customization Toolbar
 * Provides controls for layout editing, adding widgets, and applying presets
 */
export const WidgetToolbar: React.FC<WidgetToolbarProps> = ({
  isEditMode,
  onToggleEditMode,
  onAddWidget,
  onSaveLayout,
  onResetLayout,
  onApplyPreset,
  presets,
  hasChanges,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 p-4 bg-card border border-border rounded-lg',
        className
      )}
    >
      {/* Left Section - Edit Mode Toggle */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onToggleEditMode(!isEditMode)}
          variant={isEditMode ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
        >
          <Edit2 className="h-4 w-4" />
          {isEditMode ? 'Editing' : 'Edit Layout'}
        </Button>

        {isEditMode && (
          <>
            {/* Add Widget Button */}
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Widget
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {AVAILABLE_WIDGETS.map((widget) => (
                  <DropdownMenuItem
                    key={widget.type}
                    onClick={() => {
                      onAddWidget(widget.type);
                      setIsOpen(false);
                    }}
                  >
                    <span className="mr-2">{widget.icon}</span>
                    <span>{widget.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Reset Layout Button */}
            <Button
              onClick={onResetLayout}
              variant="outline"
              size="sm"
              className="gap-2"
              title="Reset to default layout"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </>
        )}
      </div>

      {/* Right Section - Save & Presets */}
      <div className="flex items-center gap-2">
        {/* Apply Preset */}
        {presets.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Presets
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {presets.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => onApplyPreset(preset.id)}
                >
                  <div>
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {preset.description}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Save Button */}
        <Button
          onClick={onSaveLayout}
          disabled={!hasChanges && !isEditMode}
          className="gap-2"
          size="sm"
        >
          <Save className="h-4 w-4" />
          {hasChanges ? 'Save Changes' : 'Saved'}
        </Button>

        {/* Close Edit Mode */}
        {isEditMode && (
          <Button
            onClick={() => onToggleEditMode(false)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Done
          </Button>
        )}
      </div>
    </div>
  );
};

export default WidgetToolbar;
