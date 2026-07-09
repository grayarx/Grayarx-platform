# Widget Theme Customization Guide

**Version:** 1.0  
**Date:** June 1, 2026  
**Status:** Complete & Production-Ready  

---

## Overview

The GrayArx widget system now includes comprehensive theme customization capabilities. Users can personalize individual widgets with custom colors, border styles, shadows, and more. The system includes pre-configured theme presets, a color picker, and real-time preview functionality.

---

## Features

### Core Customization Options

1. **Color Scheme** — Customize background, text, accent, and border colors
2. **Border Styling** — Adjust border radius and width
3. **Shadow Effects** — Apply various shadow sizes
4. **Opacity Control** — Adjust widget transparency (0-100%)
5. **Theme Modes** — Light, dark, or auto (system) modes
6. **Custom CSS** — Advanced styling with custom CSS rules
7. **Theme Presets** — 15+ pre-configured themes
8. **Favorites** — Save and organize favorite themes
9. **Import/Export** — Share themes as JSON
10. **Real-time Preview** — See changes instantly

---

## Architecture

### Component Hierarchy

```
WidgetSettingsPanel (Main Dialog)
├── Tabs (General | Theme | Advanced)
├── General Tab
│   ├── Title Input
│   ├── Description Input
│   └── Refresh Interval
├── Theme Tab
│   ├── ColorPicker (Background)
│   ├── ColorPicker (Text)
│   ├── ColorPicker (Accent)
│   ├── ColorPicker (Border)
│   ├── ThemeSelector
│   │   ├── Theme Mode Radio
│   │   ├── Border Radius Options
│   │   ├── Border Width Options
│   │   ├── Shadow Size Options
│   │   ├── Opacity Slider
│   │   └── Live Preview
│   └── Reset Button
└── Advanced Tab
    ├── Custom CSS
    └── Widget Settings (JSON)
```

### Data Flow

```
WidgetConfig (with theme property)
    ↓
WidgetSettingsPanel (UI)
    ↓
ColorPicker & ThemeSelector (Components)
    ↓
Theme Utilities (themeUtils.ts)
    ↓
CSS Application (applyThemeToElement)
    ↓
Rendered Widget (with custom styling)
```

---

## Usage Guide

### Basic Theme Customization

1. **Open Widget Settings:**
```tsx
import { WidgetSettingsPanel } from '@/components/widgets/WidgetSettingsPanel';

const [isSettingsOpen, setIsSettingsOpen] = useState(false);

<WidgetSettingsPanel
  widget={widget}
  isOpen={isSettingsOpen}
  onClose={() => setIsSettingsOpen(false)}
  onSave={(updates) => updateWidget(widget.id, updates)}
/>
```

2. **Apply Theme to Widget:**
```tsx
import { applyThemeToElement } from '@/lib/themeUtils';

useEffect(() => {
  if (elementRef.current && widget.theme) {
    applyThemeToElement(elementRef.current, widget.theme);
  }
}, [widget.theme]);
```

### Using Color Picker

```tsx
import { ColorPicker } from '@/components/widgets/ColorPicker';

<ColorPicker
  label="Background Color"
  value={theme.backgroundColor}
  onChange={(color) => setTheme({ ...theme, backgroundColor: color })}
  description="Widget background color"
  showPresets={true}
/>
```

### Using Theme Selector

```tsx
import { ThemeSelector } from '@/components/widgets/ThemeSelector';

<ThemeSelector
  theme={theme}
  onThemeChange={(updates) => setTheme({ ...theme, ...updates })}
/>
```

### Using Theme Presets

```tsx
import { useThemePresets } from '@/hooks/useThemePresets';

const {
  presets,
  getPresetById,
  getThemeById,
  getFavoriteThemes,
  saveFavoriteTheme,
  removeFavoriteTheme,
} = useThemePresets();

// Get a specific preset
const professionalPreset = getPresetById('preset-professional');

// Get favorite themes
const favorites = getFavoriteThemes();

// Save a theme as favorite
saveFavoriteTheme(theme);
```

### Using Theme Preset Browser

```tsx
import { ThemePresetBrowser } from '@/components/widgets/ThemePresetBrowser';

const [isBrowserOpen, setIsBrowserOpen] = useState(false);

<ThemePresetBrowser
  isOpen={isBrowserOpen}
  onClose={() => setIsBrowserOpen(false)}
  onSelectTheme={(theme) => applyTheme(theme)}
/>
```

---

## Theme Properties

### WidgetTheme Interface

```typescript
interface WidgetTheme {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description?: string;          // Optional description
  mode: 'light' | 'dark' | 'auto'; // Theme mode
  backgroundColor: string;       // Hex color (#RRGGBB)
  textColor: string;             // Hex color (#RRGGBB)
  accentColor: string;           // Hex color (#RRGGBB)
  borderColor: string;           // Hex color (#RRGGBB)
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  borderWidth: 0 | 1 | 2 | 4;
  shadowSize: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  opacity: number;               // 0-100
  customCSS?: string;            // Optional custom CSS
}
```

---

## Theme Presets

### Available Preset Categories

#### Professional (2 themes)
- **Blue Professional** — Clean blue accent, white background
- **Gray Professional** — Neutral gray tones, minimal shadows

#### Vibrant (3 themes)
- **Sunset** — Warm orange tones with rounded corners
- **Ocean** — Cool blue tones with soft shadows
- **Forest** — Green tones with natural appearance

#### Minimal (2 themes)
- **Minimal Light** — No borders, no shadows, pure white
- **Minimal Bordered** — Thin black border, no shadow

#### Dark (3 themes)
- **Dark Blue** — Dark blue background with light text
- **Dark Purple** — Dark purple with accent colors
- **Dark Gray** — Neutral dark gray tones

### Creating Custom Presets

```tsx
const customPreset: ThemePreset = {
  id: 'preset-custom',
  name: 'My Custom Preset',
  description: 'Custom theme for my dashboard',
  category: 'custom',
  themes: [
    {
      id: 'theme-custom-1',
      name: 'Custom Theme 1',
      mode: 'light',
      backgroundColor: '#F5F5F5',
      textColor: '#333333',
      accentColor: '#FF6B6B',
      borderColor: '#DDDDDD',
      borderRadius: 'md',
      borderWidth: 1,
      shadowSize: 'md',
      opacity: 100,
    },
  ],
};
```

---

## Utility Functions

### Color Utilities

#### `generateThemeCSS(theme: WidgetTheme)`
Generates CSS custom properties from theme.

```tsx
const cssVars = generateThemeCSS(theme);
// Returns: { '--widget-bg': '#FFFFFF', '--widget-text': '#000000', ... }
```

#### `generateThemeClasses(theme: WidgetTheme)`
Generates Tailwind classes from theme.

```tsx
const classes = generateThemeClasses(theme);
// Returns: 'rounded-md shadow-lg border'
```

#### `applyThemeToElement(element: HTMLElement, theme: WidgetTheme)`
Applies theme styles to a DOM element.

```tsx
applyThemeToElement(elementRef.current, theme);
```

#### `getContrastingTextColor(backgroundColor: string)`
Returns black or white for best contrast.

```tsx
const textColor = getContrastingTextColor('#FFFFFF');
// Returns: '#000000'
```

#### `isValidHexColor(color: string)`
Validates hex color format.

```tsx
isValidHexColor('#FFFFFF'); // true
isValidHexColor('FFFFFF');  // false
```

#### `hexToRgb(hex: string)`
Converts hex to RGB.

```tsx
hexToRgb('#FFFFFF');
// Returns: { r: 255, g: 255, b: 255 }
```

#### `rgbToHex(r: number, g: number, b: number)`
Converts RGB to hex.

```tsx
rgbToHex(255, 255, 255);
// Returns: '#FFFFFF'
```

#### `lightenColor(hex: string, percent: number)`
Lightens a color by percentage.

```tsx
lightenColor('#000000', 50);
// Returns: '#808080'
```

#### `darkenColor(hex: string, percent: number)`
Darkens a color by percentage.

```tsx
darkenColor('#FFFFFF', 50);
// Returns: '#808080'
```

### Import/Export

#### `exportTheme(theme: WidgetTheme)`
Exports theme as JSON string.

```tsx
const json = exportTheme(theme);
// Returns: '{"id":"theme-1","name":"Test",...}'
```

#### `importTheme(json: string)`
Imports theme from JSON string.

```tsx
const theme = importTheme(json);
// Returns: WidgetTheme | null
```

---

## Styling

### CSS Variables

Themes generate the following CSS variables:

```css
--widget-bg           /* Background color */
--widget-text         /* Text color */
--widget-accent       /* Accent color */
--widget-border       /* Border color */
--widget-radius       /* Border radius */
--widget-border-width /* Border width */
--widget-shadow       /* Box shadow */
--widget-opacity      /* Opacity */
```

### Using CSS Variables

```css
.widget {
  background-color: var(--widget-bg);
  color: var(--widget-text);
  border: var(--widget-border-width) solid var(--widget-border);
  border-radius: var(--widget-radius);
  box-shadow: var(--widget-shadow);
  opacity: var(--widget-opacity);
}
```

### Custom CSS

Users can add custom CSS rules in the Advanced tab:

```css
.widget-header {
  font-weight: bold;
  text-transform: uppercase;
}

.widget-content {
  padding: 20px;
  line-height: 1.6;
}
```

---

## Best Practices

### Color Selection

1. **Contrast** — Ensure sufficient contrast between text and background
2. **Consistency** — Use complementary colors
3. **Accessibility** — Test with color blindness simulators
4. **Brand Alignment** — Match company colors when possible

### Border & Shadow

1. **Professional** — Use subtle shadows (sm, md)
2. **Modern** — Use rounded corners (md, lg)
3. **Minimal** — Use no borders or shadows
4. **Bold** — Use thick borders and large shadows

### Opacity

1. **Full Opacity** — 100% for important widgets
2. **Subtle** — 80-90% for secondary content
3. **Faded** — 50-70% for background elements
4. **Hidden** — 0% for invisible elements

### Performance

1. **Limit Custom CSS** — Keep CSS rules minimal
2. **Use Presets** — Leverage pre-configured themes
3. **Cache Themes** — Store favorite themes locally
4. **Lazy Load** — Load themes on demand

---

## Accessibility

### WCAG Compliance

1. **Color Contrast** — Minimum 4.5:1 for text
2. **Color Not Alone** — Don't rely on color alone
3. **Focus Indicators** — Maintain visible focus states
4. **Keyboard Navigation** — All controls keyboard accessible

### Testing

1. **Contrast Checker** — Use WebAIM contrast checker
2. **Color Blindness** — Test with Coblis simulator
3. **Screen Reader** — Test with NVDA or JAWS
4. **Keyboard Only** — Navigate without mouse

---

## Examples

### Complete Theme Customization

```tsx
import { useState } from 'react';
import { WidgetConfig, WidgetTheme } from '@/types/widgets';
import { WidgetSettingsPanel } from '@/components/widgets/WidgetSettingsPanel';
import { applyThemeToElement } from '@/lib/themeUtils';

export function CustomizableWidget({ widget }: { widget: WidgetConfig }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentWidget, setCurrentWidget] = useState(widget);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current && currentWidget.theme) {
      applyThemeToElement(elementRef.current, currentWidget.theme);
    }
  }, [currentWidget.theme]);

  const handleSaveSettings = (updates: Partial<WidgetConfig>) => {
    setCurrentWidget((prev) => ({ ...prev, ...updates }));
  };

  return (
    <>
      <div ref={elementRef} className="p-4">
        <h3>{currentWidget.title}</h3>
        <p>{currentWidget.description}</p>
        <button onClick={() => setIsSettingsOpen(true)}>
          Customize Theme
        </button>
      </div>

      <WidgetSettingsPanel
        widget={currentWidget}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </>
  );
}
```

### Using Theme Presets

```tsx
import { useThemePresets } from '@/hooks/useThemePresets';
import { ThemePresetBrowser } from '@/components/widgets/ThemePresetBrowser';

export function ThemeManager() {
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const { presets, getFavoriteThemes } = useThemePresets();

  const favorites = getFavoriteThemes();

  return (
    <div className="space-y-4">
      <button onClick={() => setIsBrowserOpen(true)}>
        Browse Themes
      </button>

      <div>
        <h3>Favorite Themes ({favorites.length})</h3>
        {favorites.map((theme) => (
          <div key={theme.id} className="p-2 border rounded">
            {theme.name}
          </div>
        ))}
      </div>

      <ThemePresetBrowser
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        onSelectTheme={(theme) => console.log('Selected:', theme)}
      />
    </div>
  );
}
```

---

## Troubleshooting

### Colors Not Applying

1. Check if theme is passed to widget
2. Verify `applyThemeToElement` is called
3. Check browser console for errors
4. Verify hex color format (#RRGGBB)

### Poor Contrast

1. Use `getContrastingTextColor` utility
2. Check WCAG contrast requirements
3. Use WebAIM contrast checker
4. Test with color blindness simulator

### Theme Not Persisting

1. Check localStorage is enabled
2. Verify `saveFavoriteTheme` is called
3. Check browser storage quota
4. Clear cache and reload

### Performance Issues

1. Reduce number of custom CSS rules
2. Use theme presets instead of custom
3. Cache theme calculations
4. Lazy load theme browser

---

## Future Enhancements

1. **Theme Sharing** — Share themes with team members
2. **Theme Analytics** — Track popular themes
3. **AI Theme Generator** — Generate themes from images
4. **Gradient Support** — Add gradient backgrounds
5. **Animation Themes** — Theme-based animations
6. **Accessibility Checker** — Auto-check contrast
7. **Theme Versioning** — Version control for themes
8. **Collaborative Theming** — Real-time theme editing

---

## Support

For issues or questions:

1. Check this guide for solutions
2. Review component source code
3. Check browser console for errors
4. Test in different browsers
5. Contact development team

---

**Document Version:** 1.0  
**Last Updated:** June 1, 2026  
**Status:** COMPLETE & PRODUCTION-READY
