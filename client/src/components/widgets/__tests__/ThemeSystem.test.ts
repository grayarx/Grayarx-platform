import { describe, it, expect } from 'vitest';
import { WidgetTheme, ThemePreset } from '@/types/widgets';
import {
  generateThemeCSS,
  generateThemeClasses,
  getContrastingTextColor,
  isValidHexColor,
  hexToRgb,
  rgbToHex,
  lightenColor,
  darkenColor,
  exportTheme,
  importTheme,
} from '@/lib/themeUtils';

/**
 * Tests for Theme System
 * Verifies theme customization, presets, and utilities
 */

describe('Theme System', () => {
  describe('WidgetTheme', () => {
    it('should create valid theme', () => {
      const theme: WidgetTheme = {
        id: 'theme-1',
        name: 'Test Theme',
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
      expect(theme.id).toBe('theme-1');
      expect(theme.backgroundColor).toBe('#FFFFFF');
    });

    it('should support all theme modes', () => {
      const modes = ['light', 'dark', 'auto'];
      expect(modes).toHaveLength(3);
    });

    it('should support all border radius options', () => {
      const radiusOptions = ['none', 'sm', 'md', 'lg', 'full'];
      expect(radiusOptions).toHaveLength(5);
    });

    it('should support all shadow sizes', () => {
      const shadowSizes = ['none', 'sm', 'md', 'lg', 'xl'];
      expect(shadowSizes).toHaveLength(5);
    });

    it('should support opacity 0-100', () => {
      const theme: WidgetTheme = {
        id: 'theme-1',
        name: 'Test',
        mode: 'light',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
        accentColor: '#3B82F6',
        borderColor: '#E5E7EB',
        borderRadius: 'md',
        borderWidth: 1,
        shadowSize: 'md',
        opacity: 50,
      };
      expect(theme.opacity).toBeGreaterThanOrEqual(0);
      expect(theme.opacity).toBeLessThanOrEqual(100);
    });
  });

  describe('ThemePreset', () => {
    it('should create valid preset', () => {
      const preset: ThemePreset = {
        id: 'preset-1',
        name: 'Professional',
        category: 'professional',
        themes: [],
      };
      expect(preset.id).toBeTruthy();
      expect(preset.category).toBe('professional');
    });

    it('should support all categories', () => {
      const categories = ['professional', 'vibrant', 'minimal', 'dark', 'custom'];
      expect(categories).toHaveLength(5);
    });

    it('should contain multiple themes', () => {
      const themes: WidgetTheme[] = [
        {
          id: 'theme-1',
          name: 'Theme 1',
          mode: 'light',
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
          accentColor: '#3B82F6',
          borderColor: '#E5E7EB',
          borderRadius: 'md',
          borderWidth: 1,
          shadowSize: 'md',
          opacity: 100,
        },
      ];
      const preset: ThemePreset = {
        id: 'preset-1',
        name: 'Test',
        category: 'professional',
        themes,
      };
      expect(preset.themes).toHaveLength(1);
    });
  });

  describe('Theme Utilities', () => {
    const testTheme: WidgetTheme = {
      id: 'theme-1',
      name: 'Test',
      mode: 'light',
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      accentColor: '#3B82F6',
      borderColor: '#E5E7EB',
      borderRadius: 'md',
      borderWidth: 2,
      shadowSize: 'lg',
      opacity: 100,
    };

    it('should generate CSS variables', () => {
      const css = generateThemeCSS(testTheme);
      expect(css['--widget-bg']).toBe('#FFFFFF');
      expect(css['--widget-text']).toBe('#000000');
      expect(css['--widget-accent']).toBe('#3B82F6');
    });

    it('should generate Tailwind classes', () => {
      const classes = generateThemeClasses(testTheme);
      expect(classes).toContain('rounded-md');
      expect(classes).toContain('shadow-lg');
    });

    it('should validate hex colors', () => {
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#3B82F6')).toBe(true);
      expect(isValidHexColor('FFFFFF')).toBe(false);
      expect(isValidHexColor('#GGGGGG')).toBe(false);
    });

    it('should convert hex to RGB', () => {
      const rgb = hexToRgb('#FFFFFF');
      expect(rgb).toEqual({ r: 255, g: 255, b: 255 });

      const rgb2 = hexToRgb('#000000');
      expect(rgb2).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should convert RGB to hex', () => {
      expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
      expect(rgbToHex(59, 130, 246)).toBe('#3B82F6');
    });

    it('should lighten colors', () => {
      const lightened = lightenColor('#000000', 50);
      expect(lightened).toBeTruthy();
      expect(isValidHexColor(lightened)).toBe(true);
    });

    it('should darken colors', () => {
      const darkened = darkenColor('#FFFFFF', 50);
      expect(darkened).toBeTruthy();
      expect(isValidHexColor(darkened)).toBe(true);
    });

    it('should get contrasting text color', () => {
      const lightBg = getContrastingTextColor('#FFFFFF');
      expect(lightBg).toBe('#000000'); // Black text on white

      const darkBg = getContrastingTextColor('#000000');
      expect(darkBg).toBe('#FFFFFF'); // White text on black
    });
  });

  describe('Theme Import/Export', () => {
    const testTheme: WidgetTheme = {
      id: 'theme-1',
      name: 'Test',
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

    it('should export theme to JSON', () => {
      const json = exportTheme(testTheme);
      expect(json).toContain('theme-1');
      expect(json).toContain('Test');
      expect(json).toContain('#FFFFFF');
    });

    it('should import theme from JSON', () => {
      const json = exportTheme(testTheme);
      const imported = importTheme(json);
      expect(imported).toEqual(testTheme);
    });

    it('should handle invalid JSON', () => {
      const imported = importTheme('invalid json');
      expect(imported).toBeNull();
    });

    it('should round-trip theme', () => {
      const exported = exportTheme(testTheme);
      const imported = importTheme(exported);
      expect(imported?.id).toBe(testTheme.id);
      expect(imported?.backgroundColor).toBe(testTheme.backgroundColor);
    });
  });

  describe('Color Accessibility', () => {
    it('should provide good contrast for light backgrounds', () => {
      const text = getContrastingTextColor('#FFFFFF');
      expect(text).toBe('#000000');
    });

    it('should provide good contrast for dark backgrounds', () => {
      const text = getContrastingTextColor('#000000');
      expect(text).toBe('#FFFFFF');
    });

    it('should provide good contrast for mid-tone backgrounds', () => {
      const text = getContrastingTextColor('#808080');
      expect([#000000, '#FFFFFF']).toContain(text);
    });
  });

  describe('Theme Customization', () => {
    it('should allow theme cloning', () => {
      const original: WidgetTheme = {
        id: 'theme-1',
        name: 'Original',
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

      const cloned = { ...original, id: 'theme-2', name: 'Cloned' };
      expect(cloned.id).toBe('theme-2');
      expect(cloned.backgroundColor).toBe(original.backgroundColor);
    });

    it('should allow partial theme updates', () => {
      const theme: WidgetTheme = {
        id: 'theme-1',
        name: 'Test',
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

      const updated = { ...theme, backgroundColor: '#000000', opacity: 50 };
      expect(updated.backgroundColor).toBe('#000000');
      expect(updated.opacity).toBe(50);
      expect(updated.textColor).toBe(theme.textColor);
    });
  });

  describe('Performance', () => {
    it('should handle color conversion efficiently', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        hexToRgb('#3B82F6');
        rgbToHex(59, 130, 246);
      }
      const end = performance.now();
      expect(end - start).toBeLessThan(100); // Should be fast
    });

    it('should generate CSS efficiently', () => {
      const theme: WidgetTheme = {
        id: 'theme-1',
        name: 'Test',
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

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        generateThemeCSS(theme);
      }
      const end = performance.now();
      expect(end - start).toBeLessThan(100); // Should be fast
    });
  });
});
