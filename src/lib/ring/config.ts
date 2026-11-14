// 반지 디자인 설정의 zod 스키마, 기본값, 프리셋
// Zod schema, defaults, and presets for the ring design config
import { z } from "zod";
import { GEMS, METALS, type GemId, type MetalId } from "./materials";
import { CARAT_MAX, CARAT_MIN, US_SIZE_MAX, US_SIZE_MIN, type StoneCut } from "./sizing";
import type { BandProfile } from "./bandProfile";

export const METAL_IDS = Object.keys(METALS) as [MetalId, ...MetalId[]];
export const GEM_IDS = Object.keys(GEMS) as [GemId, ...GemId[]];
export const CUTS = ["round", "princess", "oval", "cushion", "emerald", "pear"] as const satisfies readonly StoneCut[];
export const PROFILES = ["comfort", "flat", "knife"] as const satisfies readonly BandProfile[];
export const SETTINGS = ["prong4", "prong6", "bezel"] as const;
export type SettingStyle = (typeof SETTINGS)[number];
/** "hidden" is a row of melee under the girdle, facing sideways; it needs prongs (a bezel would cover it). */
export const HALOS = ["none", "halo", "hidden"] as const;
export type HaloStyle = (typeof HALOS)[number];

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
  pave: z.boolean(),
  // Printable characters only; newlines and control characters would break the single text line.
  engraving: z.string().max(ENGRAVING_MAX).regex(/^[^\p{Cc}]*$/u),
});

export type RingDesign = z.infer<typeof ringDesignSchema>;

export const DEFAULT_DESIGN: RingDesign = {
  metal: "platinum",
  profile: "comfort",
  usSize: 6,
  width: 2.5,
  thickness: 1.7,
  cut: "round",
  carat: 1,
  gem: "diamond",
  setting: "prong4",
  halo: "none",
  pave: false,
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
    id: "halo",
    name: "Cushion Halo",
    design: {
      ...DEFAULT_DESIGN,
      metal: "roseGold",
      cut: "cushion",
      carat: 1.2,
      halo: "halo",
      pave: true,
      width: 2.2,
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
      width: 3,
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
    },
  },
];
