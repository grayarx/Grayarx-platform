import React from 'react';
import { WidgetTheme, ThemeMode } from '@/types/widgets';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Sun, Moon, Zap } from 'lucide-react';

export interface ThemeSelectorProps {
  theme: WidgetTheme;
  onThemeChange: (theme: Partial<WidgetTheme>) => void;
  className?: string;
}

const BORDER_RADIUS_OPTIONS = [
  { value: 'none', label: 'None', class: 'rounded-none' },
  { value: 'sm', label: 'Small', class: 'rounded-sm' },
  { value: 'md', label: 'Medium', class: 'rounded-md' },
  { value: 'lg', label: 'Large', class: 'rounded-lg' },
  { value: 'full', label: 'Full', class: 'rounded-full' },
];

const BORDER_WIDTH_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: '1px' },
  { value: 2, label: '2px' },
  { value: 4, label: '4px' },
];

const SHADOW_SIZE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
];

/**
 * Theme Selector Component
 * Allows users to customize widget appearance (border, shadow, etc.)
 */
export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  theme,
  onThemeChange,
  className,
}) => {
  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  const borderRadiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Theme Mode */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Theme Mode</Label>
        <RadioGroup
          value={theme.mode}
          onValueChange={(mode) => onThemeChange({ mode: mode as ThemeMode })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="mode-light" />
            <Label htmlFor="mode-light" className="flex items-center gap-2 cursor-pointer">
              <Sun className="h-4 w-4" />
              Light
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dark" id="mode-dark" />
            <Label htmlFor="mode-dark" className="flex items-center gap-2 cursor-pointer">
              <Moon className="h-4 w-4" />
              Dark
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="auto" id="mode-auto" />
            <Label htmlFor="mode-auto" className="flex items-center gap-2 cursor-pointer">
              <Zap className="h-4 w-4" />
              Auto (System)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Border Radius */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Border Radius</Label>
        <div className="grid grid-cols-5 gap-2">
          {BORDER_RADIUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onThemeChange({ borderRadius: option.value as any })}
              className={cn(
                'p-3 border-2 transition-all',
                theme.borderRadius === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50',
                borderRadiusClasses[option.value as keyof typeof borderRadiusClasses]
              )}
              title={option.label}
            >
              <div className="w-6 h-6 bg-muted" />
            </button>
          ))}
        </div>
      </div>

      {/* Border Width */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Border Width</Label>
        <div className="grid grid-cols-4 gap-2">
          {BORDER_WIDTH_OPTIONS.map((option) => (
            <Button
              key={option.value}
              onClick={() => onThemeChange({ borderWidth: option.value as any })}
              variant={theme.borderWidth === option.value ? 'default' : 'outline'}
              size="sm"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Shadow Size */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Shadow Size</Label>
        <div className="grid grid-cols-5 gap-2">
          {SHADOW_SIZE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              onClick={() => onThemeChange({ shadowSize: option.value as any })}
              variant={theme.shadowSize === option.value ? 'default' : 'outline'}
              size="sm"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Opacity</Label>
          <span className="text-sm text-muted-foreground">{theme.opacity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={theme.opacity}
          onChange={(e) => onThemeChange({ opacity: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Preview */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Preview</Label>
        <div
          className={cn(
            'p-6 transition-all',
            borderRadiusClasses[theme.borderRadius],
            shadowClasses[theme.shadowSize],
            `border-[${theme.borderWidth}px]`
          )}
          style={{
            backgroundColor: theme.backgroundColor,
            color: theme.textColor,
            borderColor: theme.borderColor,
            opacity: theme.opacity / 100,
          }}
        >
          <p className="font-semibold">Widget Preview</p>
          <p className="text-sm mt-2">This is how your widget will look</p>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
