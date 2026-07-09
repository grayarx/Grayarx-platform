/**
 * Standard 8-angle checklist — matches luxury dealer photography (Daytona-tier).
 * Dealers tap a slot or drop files; GrayArx guides them without jargon.
 */

export const PHOTO_ANGLES = [
  {
    id: "front_3_4",
    label: "Front 3/4",
    hint: "Main hero shot — show grille & bonnet",
    required: true,
  },
  {
    id: "rear_3_4",
    label: "Rear 3/4",
    hint: "Rear angle with taillights visible",
    required: true,
  },
  {
    id: "side",
    label: "Side profile",
    hint: "Full side of the vehicle",
    required: true,
  },
  {
    id: "front",
    label: "Front straight",
    hint: "Head-on view",
    required: false,
  },
  {
    id: "rear",
    label: "Rear straight",
    hint: "Straight back view",
    required: false,
  },
  {
    id: "interior_front",
    label: "Front seats",
    hint: "Driver & passenger seats",
    required: true,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    hint: "Steering wheel & infotainment",
    required: true,
  },
  {
    id: "wheels",
    label: "Wheels",
    hint: "Tyres & mags — shows condition",
    required: false,
  },
] as const;

export type PhotoAngleId = (typeof PHOTO_ANGLES)[number]["id"];

export const RECOMMENDED_ANGLE_COUNT = PHOTO_ANGLES.length;

export function photoAngleLabel(id: string): string {
  return PHOTO_ANGLES.find((a) => a.id === id)?.label ?? id;
}
