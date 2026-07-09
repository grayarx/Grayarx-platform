import React, { useState } from 'react';
import { WidgetConfig, WidgetTheme } from '@/types/widgets';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPicker } from './ColorPicker';
import { ThemeSelector } from './ThemeSelector';
import { Settings, Palette } from 'lucide-react';

export interface WidgetSettingsPanelProps {
  widget: WidgetConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<WidgetConfig>) => void;
}

const DEFAULT_THEME: WidgetTheme = {
  id: 'default',
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
 * Widget Settings Panel
 * Allows users to customize widget properties and appearance
 */
export const WidgetSettingsPanel: React.FC<WidgetSettingsPanelProps> = ({
  widget,
  isOpen,
  onClose,
  onSave,
}) => {
  const [localWidget, setLocalWidget] = useState<WidgetConfig>(widget);
  const [theme, setTheme] = useState<WidgetTheme>(widget.theme || DEFAULT_THEME);

  const handleThemeChange = (updates: Partial<WidgetTheme>) => {
    setTheme((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    onSave({
      ...localWidget,
      theme,
    });
    onClose();
  };

  const handleReset = () => {
    setTheme(DEFAULT_THEME);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Widget Settings: {widget.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Widget Title</Label>
              <Input
                value={localWidget.title}
                onChange={(e) =>
                  setLocalWidget({ ...localWidget, title: e.target.value })
                }
                placeholder="Enter widget title"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={localWidget.description || ''}
                onChange={(e) =>
                  setLocalWidget({ ...localWidget, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-2">
              <Label>Refresh Interval (seconds)</Label>
              <Input
                type="number"
                value={localWidget.refreshInterval || 300}
                onChange={(e) =>
                  setLocalWidget({
                    ...localWidget,
                    refreshInterval: parseInt(e.target.value),
                  })
                }
                min="0"
                step="60"
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 to disable auto-refresh
              </p>
            </div>
          </TabsContent>

          {/* Theme Settings */}
          <TabsContent value="theme" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Color Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker
                  label="Background Color"
                  value={theme.backgroundColor}
                  onChange={(color) =>
                    handleThemeChange({ backgroundColor: color })
                  }
                  description="Widget background"
                />
                <ColorPicker
                  label="Text Color"
                  value={theme.textColor}
                  onChange={(color) => handleThemeChange({ textColor: color })}
                  description="Primary text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ColorPicker
                  label="Accent Color"
                  value={theme.accentColor}
                  onChange={(color) =>
                    handleThemeChange({ accentColor: color })
                  }
                  description="Highlights & accents"
                />
                <ColorPicker
                  label="Border Color"
                  value={theme.borderColor}
                  onChange={(color) =>
                    handleThemeChange({ borderColor: color })
                  }
                  description="Widget border"
                />
              </div>

              {/* Theme Selector */}
              <ThemeSelector theme={theme} onThemeChange={handleThemeChange} />

              {/* Reset Button */}
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                Reset to Default Theme
              </Button>
            </div>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Custom CSS</Label>
              <textarea
                value={theme.customCSS || ''}
                onChange={(e) =>
                  handleThemeChange({ customCSS: e.target.value })
                }
                placeholder="Enter custom CSS (optional)"
                className="w-full h-32 p-2 border rounded font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Advanced: Add custom CSS rules for this widget
              </p>
            </div>

            <div className="space-y-2">
              <Label>Widget Settings (JSON)</Label>
              <textarea
                value={JSON.stringify(localWidget.settings || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const settings = JSON.parse(e.target.value);
                    setLocalWidget({ ...localWidget, settings });
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder="Enter widget-specific settings as JSON"
                className="w-full h-32 p-2 border rounded font-mono text-sm"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WidgetSettingsPanel;
