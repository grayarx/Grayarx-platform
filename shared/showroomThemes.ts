export const SHOWROOM_THEME_IDS = [
  "futuristic",
  "classic",
  "minimal",
  "bold",
] as const;

export type ShowroomThemeId = (typeof SHOWROOM_THEME_IDS)[number];

export interface ShowroomThemeDefinition {
  id: ShowroomThemeId;
  name: string;
  description: string;
  preview: {
    background: string;
    accent: string;
    text: string;
  };
}

export const SHOWROOM_THEMES: ShowroomThemeDefinition[] = [
  {
    id: "futuristic",
    name: "Futuristic",
    description: "Dark cinematic grid, gold + cyan accents — platform marketing style.",
    preview: { background: "#060608", accent: "#d4af37", text: "#f4f4f5" },
  },
  {
    id: "classic",
    name: "Classic luxury",
    description: "Warm charcoal and champagne gold. Timeless dealer showroom feel.",
    preview: { background: "#1a1a1a", accent: "#c9a24a", text: "#fafafa" },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean lines, fewer effects. Lets your inventory do the talking.",
    preview: { background: "#0f0f0f", accent: "#e8e8e8", text: "#ffffff" },
  },
  {
    id: "bold",
    name: "Bold",
    description: "High contrast, strong typography. Maximum impact on mobile.",
    preview: { background: "#000000", accent: "#ffcc00", text: "#ffffff" },
  },
];

export function isShowroomThemeId(value: string | null | undefined): value is ShowroomThemeId {
  return SHOWROOM_THEME_IDS.includes(value as ShowroomThemeId);
}

export function resolveShowroomTheme(value: string | null | undefined): ShowroomThemeId {
  return isShowroomThemeId(value) ? value : "classic";
}
