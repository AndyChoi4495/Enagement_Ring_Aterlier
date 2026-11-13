// 미국 반지 사이즈를 실제 밀리미터 치수로 변환하는 함수
// Converts US ring sizes to real millimeter dimensions

export const US_SIZE_MIN = 3;
export const US_SIZE_MAX = 13;

/** Inner diameter in mm for a US ring size (linear standard: 11.63 + 0.8128 × size). */
export function innerDiameterMm(usSize: number): number {
  return 11.63 + 0.8128 * usSize;
}
