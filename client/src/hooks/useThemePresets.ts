import { useMemo } from 'react';
import { ThemePreset, WidgetTheme } from '@/types/widgets';

/**
 * Hook for managing theme presets
 * Provides pre-configured themes for different styles
 */
export const useThemePresets = () => {
  const presets: ThemePreset[] = useMemo(() => [
    {
      id: 'preset-professional',
      name: 'Professional',
      description: 'Clean and professional appearance',
      category: 'professional',
      themes: [
        {
          id: 'theme-prof-1',
          name: 'Blue Professional',
          mode: 'light',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          accentColor: '#2563EB',
          borderColor: '#D1D5DB',
          borderRadius: 'md',
          borderWidth: 1,
          shadowSize: 'md',
          opacity: 100,
        },
        {
          id: 'theme-prof-2',
          name: 'Gray Professional',
          mode: 'light',
          backgroundColor: '#F9FAFB',
          textColor: '#111827',
          accentColor: '#6B7280',
          borderColor: '#E5E7EB',
          borderRadius: 'md',
          borderWidth: 1,
          shadowSize: 'sm',
          opacity: 100,
        },
      ],
    },
    {
      id: 'preset-vibrant',
      name: 'Vibrant',
      description: 'Bold and colorful design',
      category: 'vibrant',
      themes: [
        {
          id: 'theme-vib-1',
          name: 'Sunset',
          mode: 'light',
          backgroundColor: '#FFF7ED',
          textColor: '#7C2D12',
          accentColor: '#EA580C',
          borderColor: '#FDBA74',
          borderRadius: 'lg',
          borderWidth: 2,
          shadowSize: 'lg',
          opacity: 100,
        },
        {
          id: 'theme-vib-2',
          name: 'Ocean',
          mode: 'light',
          backgroundColor: '#F0F9FF',
          textColor: '#0C4A6E',
          accentColor: '#0284C7',
          borderColor: '#7DD3FC',
          borderRadius: 'lg',
          borderWidth: 2,
          shadowSize: 'lg',
          opacity: 100,
        },
        {
          id: 'theme-vib-3',
          name: 'Forest',
          mode: 'light',
          backgroundColor: '#F0FDF4',
          textColor: '#14532D',
          accentColor: '#16A34A',
          borderColor: '#86EFAC',
          borderRadius: 'lg',
          borderWidth: 2,
          shadowSize: 'lg',
          opacity: 100,
        },
      ],
    },
    {
      id: 'preset-minimal',
      name: 'Minimal',
      description: 'Simple and clean',
      category: 'minimal',
      themes: [
        {
          id: 'theme-min-1',
          name: 'Minimal Light',
          mode: 'light',
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
          accentColor: '#000000',
          borderColor: '#F3F4F6',
          borderRadius: 'none',
          borderWidth: 0,
          shadowSize: 'none',
          opacity: 100,
        },
        {
          id: 'theme-min-2',
          name: 'Minimal Bordered',
          mode: 'light',
          backgroundColor: '#FFFFFF',
          textColor: '#374151',
          accentColor: '#111827',
          borderColor: '#111827',
          borderRadius: 'none',
          borderWidth: 1,
          shadowSize: 'none',
          opacity: 100,
        },
      ],
    },
    {
      id: 'preset-dark',
      name: 'Dark',
      description: 'Dark theme variants',
      category: 'dark',
      themes: [
        {
          id: 'theme-dark-1',
          name: 'Dark Blue',
          mode: 'dark',
          backgroundColor: '#1E293B',
          textColor: '#F1F5F9',
          accentColor: '#60A5FA',
          borderColor: '#334155',
          borderRadius: 'md',
          borderWidth: 1,
          shadowSize: 'md',
          opacity: 100,
        },
        {
          id: 'theme-dark-2',
          name: 'Dark Purple',
          mode: 'dark',
          backgroundColor: '#2D1B4E',
          textColor: '#F3E8FF',
          accentColor: '#C084FC',
          borderColor: '#4C1D95',
          borderRadius: 'md',
          borderWidth: 1,
          shadowSize: 'md',
          opacity: 100,
        },
        {
          id: 'theme-dark-3',
          name: 'Dark Gray',
          mode: 'dark',
          backgroundColor: '#1F2937',
          textColor: '#F9FAFB',
          accentColor: '#9CA3AF',
          borderColor: '#374151',
          borderRadius: 'md',
          borderWidth: 1,
          shadowSize: 'md',
          opacity: 100,
        },
      ],
    },
  ], []);

  const getPresetById = (id: string): ThemePreset | undefined => {
    return presets.find((p) => p.id === id);
  };

  const getThemeById = (themeId: string): WidgetTheme | undefined => {
    for (const preset of presets) {
      const theme = preset.themes.find((t) => t.id === themeId);
      if (theme) return theme;
    }
    return undefined;
  };

  const getPresetsByCategory = (category: string): ThemePreset[] => {
    return presets.filter((p) => p.category === category);
  };

  const getFavoriteThemes = (): WidgetTheme[] => {
    const favorites = localStorage.getItem('favoriteThemes');
    if (favorites) {
      try {
        return JSON.parse(favorites);
      } catch {
        return [];
      }
    }
    return [];
  };

  const saveFavoriteTheme = (theme: WidgetTheme) => {
    const favorites = getFavoriteThemes();
    if (!favorites.find((t) => t.id === theme.id)) {
      favorites.push(theme);
      localStorage.setItem('favoriteThemes', JSON.stringify(favorites));
    }
  };

  const removeFavoriteTheme = (themeId: string) => {
    const favorites = getFavoriteThemes();
    const updated = favorites.filter((t) => t.id !== themeId);
    localStorage.setItem('favoriteThemes', JSON.stringify(updated));
  };

  return {
    presets,
    getPresetById,
    getThemeById,
    getPresetsByCategory,
    getFavoriteThemes,
    saveFavoriteTheme,
    removeFavoriteTheme,
  };
};

export default useThemePresets;
