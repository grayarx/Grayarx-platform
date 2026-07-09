import { WidgetTheme } from '@/types/widgets';

/**
 * Theme Utility Functions
 * Handles theme application and styling
 */

/**
 * Generate CSS variables from theme
 */
export const generateThemeCSS = (theme: WidgetTheme): Record<string, string> => {
  const shadowMap = {
    none: '0 0 0 rgba(0, 0, 0, 0)',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  };

  const borderRadiusMap = {
    none: '0px',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  };

  return {
    '--widget-bg': theme.backgroundColor,
    '--widget-text': theme.textColor,
    '--widget-accent': theme.accentColor,
    '--widget-border': theme.borderColor,
    '--widget-radius': borderRadiusMap[theme.borderRadius],
    '--widget-border-width': `${theme.borderWidth}px`,
    '--widget-shadow': shadowMap[theme.shadowSize],
    '--widget-opacity': `${theme.opacity / 100}`,
  };
};

/**
 * Apply theme to element
 */
export const applyThemeToElement = (
  element: HTMLElement,
  theme: WidgetTheme
): void => {
  const cssVars = generateThemeCSS(theme);

  Object.entries(cssVars).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });

  // Apply inline styles
  element.style.backgroundColor = theme.backgroundColor;
  element.style.color = theme.textColor;
  element.style.borderColor = theme.borderColor;
  element.style.borderWidth = `${theme.borderWidth}px`;
  element.style.borderRadius = theme.borderRadius === 'none' ? '0' : 'var(--widget-radius)';
  element.style.boxShadow = `var(--widget-shadow)`;
  element.style.opacity = `${theme.opacity / 100}`;

  // Apply custom CSS if provided
  if (theme.customCSS) {
    const styleElement = document.createElement('style');
    styleElement.textContent = theme.customCSS;
    element.appendChild(styleElement);
  }
};

/**
 * Generate Tailwind classes from theme
 */
export const generateThemeClasses = (theme: WidgetTheme): string => {
  const borderRadiusClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const shadowClass = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  return [
    borderRadiusClass[theme.borderRadius],
    shadowClass[theme.shadowSize],
    theme.borderWidth > 0 ? 'border' : 'border-0',
  ].join(' ');
};

/**
 * Get contrasting text color for background
 */
export const getContrastingTextColor = (backgroundColor: string): string => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Validate hex color
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

/**
 * Convert hex to RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Convert RGB to hex
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

/**
 * Lighten color by percentage
 */
export const lightenColor = (hex: string, percent: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * (percent / 100)));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * (percent / 100)));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * (percent / 100)));

  return rgbToHex(r, g, b);
};

/**
 * Darken color by percentage
 */
export const darkenColor = (hex: string, percent: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.max(0, Math.round(rgb.r * (1 - percent / 100)));
  const g = Math.max(0, Math.round(rgb.g * (1 - percent / 100)));
  const b = Math.max(0, Math.round(rgb.b * (1 - percent / 100)));

  return rgbToHex(r, g, b);
};

/**
 * Export theme as JSON
 */
export const exportTheme = (theme: WidgetTheme): string => {
  return JSON.stringify(theme, null, 2);
};

/**
 * Import theme from JSON
 */
export const importTheme = (json: string): WidgetTheme | null => {
  try {
    return JSON.parse(json) as WidgetTheme;
  } catch {
    return null;
  }
};
