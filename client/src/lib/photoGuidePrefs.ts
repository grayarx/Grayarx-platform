const STORAGE_KEY = "grayarx_photo_guide_v1";

export type PhotoGuideState = {
  /** User closed the dashboard card permanently */
  dismissed: boolean;
  /** Dashboard card collapsed to summary row */
  collapsed: boolean;
  /** Contextual hints hidden on inventory / import / photos pages */
  hintsHidden: boolean;
};

const DEFAULT: PhotoGuideState = {
  dismissed: false,
  collapsed: false,
  hintsHidden: false,
};

export function loadPhotoGuideState(): PhotoGuideState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function savePhotoGuideState(patch: Partial<PhotoGuideState>): PhotoGuideState {
  const next = { ...loadPhotoGuideState(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("grayarx-photo-guide-change"));
  return next;
}

export function resetPhotoGuideState(): PhotoGuideState {
  return savePhotoGuideState({
    dismissed: false,
    hintsHidden: false,
    collapsed: false,
  });
}

export const PHOTO_GUIDE_STEPS = [
  {
    step: 1,
    title: "Import stock",
    body: 'Upload your DMS or stock export CSV — keep "Save photos to GrayArx" on.',
    href: "/dealer/inventory/import",
    time: "30 sec",
  },
  {
    step: 2,
    title: "Save external photos",
    body: "One click copies external listing images so links never break.",
    href: "/dealer/csv-photo",
    time: "10 sec",
  },
  {
    step: 3,
    title: "Add 8 angles",
    body: "Drop photos on the grid — front 3/4, side, interior, dashboard, and more.",
    href: "/dealer/inventory",
    time: "2 min / car",
  },
  {
    step: 4,
    title: "Preview showroom",
    body: "See the buyer view — gallery, deal scores, and Nala chat live.",
    href: "/showroom",
    time: "10 sec",
  },
  {
    step: 5,
    title: "Sign legal pack",
    body: "Dealer agreement + POPIA consent — fill in and submit online (no printing).",
    href: "/dealer/legal",
    time: "3 min",
  },
] as const;
