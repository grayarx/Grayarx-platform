import React, { useState } from 'react';
import { Palette, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
  showPresets?: boolean;
  className?: string;
}

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#6B7280', '#D1D5DB', '#F3F4F6', '#FECACA', '#FED7AA',
  '#DCFCE7', '#CFFAFE', '#DBEAFE', '#E9D5FF', '#FCE7F3',
];

/**
 * Color Picker Component
 * Allows users to select colors with hex input and presets
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  description,
  showPresets = true,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isValidHex = /^#[0-9A-F]{6}$/i.test(value);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </div>

      <div className="flex items-center gap-2">
        {/* Color Preview */}
        <div
          className="w-10 h-10 rounded border-2 border-border cursor-pointer hover:border-primary transition-colors"
          style={{ backgroundColor: isValidHex ? value : '#CCCCCC' }}
          onClick={() => setIsOpen(!isOpen)}
          title="Click to open color picker"
        />

        {/* Hex Input */}
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="#000000"
          className="font-mono text-sm"
          maxLength={7}
        />

        {/* Copy Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="gap-1"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Preset Colors */}
      {showPresets && isOpen && (
        <div className="grid grid-cols-8 gap-2 p-3 bg-muted rounded-lg">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => {
                onChange(color);
                setIsOpen(false);
              }}
              className={cn(
                'w-8 h-8 rounded border-2 transition-all hover:scale-110',
                value === color ? 'border-primary ring-2 ring-primary' : 'border-border'
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}

      {/* Validation Message */}
      {!isValidHex && value && (
        <p className="text-xs text-destructive">Invalid hex color format (e.g., #FF0000)</p>
      )}
    </div>
  );
};

export default ColorPicker;
