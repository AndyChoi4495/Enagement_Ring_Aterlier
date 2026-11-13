// 미국 반지 사이즈를 실제 밀리미터 치수로 변환하는 함수
// Converts US ring sizes to real millimeter dimensions

export const US_SIZE_MIN = 3;
export const US_SIZE_MAX = 13;

/** Inner diameter in mm for a US ring size (linear standard: 11.63 + 0.8128 × size). */
export function innerDiameterMm(usSize: number): number {
  return 11.63 + 0.8128 * usSize;
}

export type StoneCut = "round" | "princess" | "oval" | "cushion" | "emerald" | "pear";

export const CARAT_MIN = 0.3;
export const CARAT_MAX = 3;

const DIAMOND_DENSITY = 3.52; // g/cm³

// Face-up length of a 1 ct diamond (mm) and length/width ratio, from common size charts.
const CUT_SIZE_AT_1CT: Record<StoneCut, { length: number; ratio: number }> = {
  round: { length: 6.5, ratio: 1 },
  princess: { length: 5.5, ratio: 1 },
  oval: { length: 7.7, ratio: 1.35 },
  cushion: { length: 5.9, ratio: 1.05 },
  emerald: { length: 7.0, ratio: 1.4 },
  pear: { length: 7.7, ratio: 1.55 },
};

/**
 * Face-up length × width in mm. Size scales with ∛(carat), since carat is weight.
 * Denser gems are smaller at the same carat, so density scales by ∛(3.52 / density).
 */
export function stoneSizeMm(
  cut: StoneCut,
  carat: number,
  density = DIAMOND_DENSITY,
): { length: number; width: number } {
  const { length, ratio } = CUT_SIZE_AT_1CT[cut];
  const length_ = length * Math.cbrt((carat * DIAMOND_DENSITY) / density);
  return { length: length_, width: length_ / ratio };
}
