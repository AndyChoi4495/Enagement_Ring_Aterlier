// 반지 디자인 설정의 zod 스키마, 기본값, 프리셋
// Zod schema, defaults, and presets for the ring design config
import { z } from "zod";
import { GEMS, METALS, type GemId, type MetalId } from "./materials";
import { CARAT_MAX, CARAT_MIN, US_SIZE_MAX, US_SIZE_MIN, type StoneCut } from "./sizing";
import type { BandProfile } from "./bandProfile";
import type { ShoulderStyle } from "./geometry/band";

export const METAL_IDS = Object.keys(METALS) as [MetalId, ...MetalId[]];
export const GEM_IDS = Object.keys(GEMS) as [GemId, ...GemId[]];
export const CUTS = ["round", "princess", "oval", "cushion", "emerald", "pear"] as const satisfies readonly StoneCut[];
export const PROFILES = ["comfort", "flat", "knife"] as const satisfies readonly BandProfile[];
export const SETTINGS = ["prong4", "prong6", "bezel"] as const;
export type SettingStyle = (typeof SETTINGS)[number];
/**
 * "hidden" is a row of melee under the girdle, facing sideways; it needs prongs (a bezel would cover it).
 * The prongs pass outside it, interrupting the row; "hiddenOver" is the same row moved outside the
 * prongs, so it runs over them unbroken. Share links store the index: append new styles at the end.
 */
export const HALOS = ["none", "halo", "hidden", "hiddenOver"] as const;
export type HaloStyle = (typeof HALOS)[number];

/** How the band meets the head. "twist" cannot carry side stones (see effectivePave). */
export const SHOULDERS = ["straight", "tapered", "cathedral", "split", "twist"] as const satisfies readonly ShoulderStyle[];

/**
 * Side stones on the shoulders, by how they are held: "pave" = beads raised from a flat surface,
 * "french" = V-shaped cuts in the sides under each stone, "ucut" = U-shaped scallops, "channel" =
 * flush between two walls with no prongs, "inset" = U-shaped scallops cut into the band itself, so
 * the row ends level with the band instead of standing on top of it. Share links store the index:
 * append new styles at the end.
 */
export const PAVES = ["none", "pave", "french", "ucut", "channel", "inset"] as const;
export type PaveStyle = (typeof PAVES)[number];
/** How far round the band the side stones run, in percent of the circumference. */
export const PAVE_COVERAGES = [30, 50, 70] as const;
export type PaveCoverage = (typeof PAVE_COVERAGES)[number];

export const WIDTH_MIN = 1.5;
export const WIDTH_MAX = 4;
export const THICKNESS_MIN = 1.4;
export const THICKNESS_MAX = 2.4;
export const ENGRAVING_MAX = 24;

export const ringDesignSchema = z.object({
  metal: z.enum(METAL_IDS),
  profile: z.enum(PROFILES),
  usSize: z.number().min(US_SIZE_MIN).max(US_SIZE_MAX),
  width: z.number().min(WIDTH_MIN).max(WIDTH_MAX),
  thickness: z.number().min(THICKNESS_MIN).max(THICKNESS_MAX),
  cut: z.enum(CUTS),
  carat: z.number().min(CARAT_MIN).max(CARAT_MAX),
  gem: z.enum(GEM_IDS),
  setting: z.enum(SETTINGS),
  halo: z.enum(HALOS),
  shoulder: z.enum(SHOULDERS),
  pave: z.enum(PAVES),
  coverage: z.literal(PAVE_COVERAGES),
  // Printable characters only; newlines and control characters would break the single text line.
  engraving: z.string().max(ENGRAVING_MAX).regex(/^[^\p{Cc}]*$/u),
});

export type RingDesign = z.infer<typeof ringDesignSchema>;

export const DEFAULT_DESIGN: RingDesign = {
  metal: "platinum",
  profile: "comfort",
  usSize: 6,
  width: 1.8,
  thickness: 1.6,
  cut: "round",
  carat: 1,
  gem: "diamond",
  setting: "prong4",
  halo: "none",
  shoulder: "tapered",
  pave: "none",
  coverage: 70,
  engraving: "",
};

export interface Preset {
  id: string;
  name: string;
  design: RingDesign;
}

export const PRESETS: Preset[] = [
  { id: "classic", name: "Classic Solitaire", design: DEFAULT_DESIGN },
  {
    id: "petite",
    name: "Petite Pavé",
    design: { ...DEFAULT_DESIGN, metal: "whiteGold", halo: "hidden", shoulder: "straight", pave: "ucut" },
  },
  {
    id: "halo",
    name: "Cushion Halo",
    design: {
      ...DEFAULT_DESIGN,
      metal: "roseGold",
      cut: "cushion",
      carat: 1.2,
      halo: "halo",
      shoulder: "cathedral",
      pave: "french",
    },
  },
  {
    id: "bezel",
    name: "Modern Bezel",
    design: {
      ...DEFAULT_DESIGN,
      metal: "yellowGold",
      profile: "flat",
      cut: "emerald",
      carat: 1.5,
      setting: "bezel",
      shoulder: "straight",
      width: 2.6,
    },
  },
  {
    id: "sapphire",
    name: "Pear Sapphire",
    design: {
      ...DEFAULT_DESIGN,
      metal: "whiteGold",
      profile: "knife",
      cut: "pear",
      gem: "sapphire",
      carat: 1.3,
      setting: "prong6",
      halo: "halo",
      shoulder: "split",
    },
  },
];
