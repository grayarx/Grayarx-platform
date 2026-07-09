import React, { useState } from 'react';
import { ThemePreset, WidgetTheme } from '@/types/widgets';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemePresets } from '@/hooks/useThemePresets';

export interface ThemePresetBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTheme: (theme: WidgetTheme) => void;
}

/**
 * Theme Preset Browser
 * Browse and apply pre-configured themes
 */
export const ThemePresetBrowser: React.FC<ThemePresetBrowserProps> = ({
  isOpen,
  onClose,
  onSelectTheme,
}) => {
  const { presets, getFavoriteThemes, saveFavoriteTheme, removeFavoriteTheme } =
    useThemePresets();
  const [favorites, setFavorites] = useState(getFavoriteThemes());

  const handleToggleFavorite = (theme: WidgetTheme) => {
    if (favorites.find((t) => t.id === theme.id)) {
      removeFavoriteTheme(theme.id);
      setFavorites((prev) => prev.filter((t) => t.id !== theme.id));
    } else {
      saveFavoriteTheme(theme);
      setFavorites((prev) => [...prev, theme]);
    }
  };

  const isFavorite = (themeId: string) => {
    return favorites.some((t) => t.id === themeId);
  };

  const ThemeCard = ({ theme }: { theme: WidgetTheme }) => (
    <div
      className="p-4 rounded-lg border-2 border-border hover:border-primary transition-all cursor-pointer group"
      onClick={() => {
        onSelectTheme(theme);
        onClose();
      }}
    >
      <div
        className="h-24 rounded mb-3 border-2"
        style={{
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
        }}
      >
        <div
          className="h-full flex items-center justify-center text-sm font-semibold"
          style={{ color: theme.textColor }}
        >
          Preview
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">{theme.name}</h4>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: theme.backgroundColor }}
              title="Background"
            />
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: theme.textColor }}
              title="Text"
            />
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: theme.accentColor }}
              title="Accent"
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite(theme);
            }}
            className="ml-auto"
          >
            <Star
              className={cn(
                'h-4 w-4 transition-colors',
                isFavorite(theme.id)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground hover:text-yellow-400'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Theme Presets</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="vibrant">Vibrant</TabsTrigger>
            <TabsTrigger value="minimal">Minimal</TabsTrigger>
            <TabsTrigger value="dark">Dark</TabsTrigger>
          </TabsList>

          {/* All Themes */}
          <TabsContent value="all" className="space-y-4 mt-4">
            {presets.map((preset) => (
              <div key={preset.id} className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{preset.name}</h3>
                  {preset.description && (
                    <p className="text-sm text-muted-foreground">{preset.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {preset.themes.map((theme) => (
                    <ThemeCard key={theme.id} theme={theme} />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Favorites */}
          <TabsContent value="favorites" className="mt-4">
            {favorites.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No favorite themes yet</p>
                <p className="text-sm text-muted-foreground">
                  Click the star icon to add themes to favorites
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {favorites.map((theme) => (
                  <ThemeCard key={theme.id} theme={theme} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Category Tabs */}
          {(['professional', 'vibrant', 'minimal', 'dark'] as const).map((category) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {presets
                  .filter((p) => p.category === category)
                  .flatMap((p) => p.themes)
                  .map((theme) => (
                    <ThemeCard key={theme.id} theme={theme} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Import/Export */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Theme
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Theme
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemePresetBrowser;
