// 반지 디자인 전체 설정 타입 (4단계에서 zod 스키마로 대체 예정)
// Full ring design config type (to become a zod schema in Phase 4)
import type { BandProfile } from "./bandProfile";
import type { GemId, MetalId } from "./materials";
import type { StoneCut } from "./sizing";

export type SettingStyle = "prong4" | "prong6" | "bezel";

export interface RingDesign {
  metal: MetalId;
  profile: BandProfile;
  usSize: number;
  width: number;
  thickness: number;
  cut: StoneCut;
  carat: number;
  gem: GemId;
  setting: SettingStyle;
  halo: boolean;
  pave: boolean;
}
